/**
 * Gemini API Service for LLM-based transaction explanations
 */

import { ENHANCED_TX_EXPLAINER_PROMPT, SIMPLE_TX_EXPLAINER_PROMPT } from './promptTemplate';
import {
    LLMTransactionExplanation,
    SimpleLLMExplanation,
    LLMExplainResponse
} from './types';
import { TranslatedTransaction } from '@/types/visualization';

interface GeminiConfig {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
}

const DEFAULT_CONFIG: GeminiConfig = {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
    temperature: 0.3,
    maxOutputTokens: 4096,
};

function cleanExtractedText(text: string): string {
    return text
        .replace(/\\n/g, ' ')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function prepareTransactionForLLM(tx: TranslatedTransaction): Record<string, unknown> {
    return {
        digest: tx.digest,
        status: tx.status,
        timestamp: tx.timestamp,
        sender: {
            address: tx.sender.address,
            truncated: tx.sender.truncated,
        },
        recipients: tx.recipients.map(r => ({
            address: r.address,
            truncated: r.truncated,
        })),
        transaction_type: tx.transactionType,
        gas_info: {
            gas_used_mist: tx.gasInfo.gasUsed,
            gas_fee_sui: (tx.gasInfo.gasFee / 1_000_000_000).toFixed(6),
            net_gas_fee_sui: (tx.gasInfo.netGasFee / 1_000_000_000).toFixed(6),
            storage_rebate_sui: (tx.gasInfo.storageRebate / 1_000_000_000).toFixed(6),
        },
        object_stats: tx.objectStats,
        objects: tx.objects.map(o => ({
            object_id: o.objectId,
            type: o.type,
            operation: o.operation,
            category: o.category,
        })),
        move_calls: tx.moveCalls.map(m => ({
            package: m.package,
            module: m.module,
            function: m.function,
            description: m.description,
        })),
        plain_english_summary: tx.plainEnglish,
        object_summary: tx.objectSummary,
        gas_summary: tx.gasSummary,
    };
}

function parseLLMResponse(text: string): Record<string, unknown> | null {
    try {
        return JSON.parse(text);
    } catch {
        // Try unescaping common issues
        const unescaped = text
            .replace(/\\\\n/g, '\\n')
            .replace(/\\\\\\\\/g, '\\\\')
            .trim();
        try {
            return JSON.parse(unescaped);
        } catch {
            // Try removing markdown code blocks
            const cleaned = text
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
            try {
                return JSON.parse(cleaned);
            } catch {
                // Try brace matching
                const startIdx = text.indexOf('{');
                if (startIdx !== -1) {
                    let depth = 0;
                    let endIdx = -1;
                    for (let i = startIdx; i < text.length; i++) {
                        const char = text.charAt(i);
                        if (char === '{') depth++;
                        if (char === '}') {
                            depth--;
                            if (depth === 0) {
                                endIdx = i + 1;
                                break;
                            }
                        }
                    }
                    if (endIdx > startIdx) {
                        const jsonCandidate = text.substring(startIdx, endIdx)
                            .replace(/\\\\n/g, '\\n')
                            .replace(/\\\\\\\\/g, '\\\\');
                        try {
                            return JSON.parse(jsonCandidate);
                        } catch {
                            // Fall through to regex extraction
                        }
                    }
                }
            }
        }
    }

    // Regex extraction fallback
    const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/);
    const summaryMatch = text.match(/"summary"\s*:\s*"([^"]*)"/);
    const significanceMatch = text.match(/"significance"\s*:\s*"([^"]*)"/);
    const simpleExpMatch = text.match(/"simple_explanation"\s*:\s*"([^"]*)"/);
    const everydayAnalogyMatch = text.match(/"everyday_analogy"\s*:\s*"([^"]*)"/);
    const keyTakeawayMatch = text.match(/"key_takeaway"\s*:\s*"([^"]*)"/);
    const detailedExpMatch = text.match(/"detailed_explanation"\s*:\s*"([^"]*)"/);
    const techBreakMatch = text.match(/"technical_breakdown"\s*:\s*"([^"]*)"/);
    const categoryMatch = text.match(/"category"\s*:\s*"([^"]*)"/);
    const actionMatch = text.match(/"action"\s*:\s*"([^"]*)"/);
    const riskLevelMatch = text.match(/"risk_level"\s*:\s*"([^"]*)"/);
    const complexityMatch = text.match(/"complexity"\s*:\s*"([^"]*)"/);
    const typeMatch = text.match(/"type"\s*:\s*"([^"]*)"/);
    const descMatch = text.match(/"description"\s*:\s*"([^"]*)"/);

    if (titleMatch || summaryMatch || typeMatch) {
        const partial: Record<string, unknown> = {
            overview: {
                title: titleMatch ? cleanExtractedText(titleMatch[1]) : 'Unknown',
                summary: summaryMatch ? cleanExtractedText(summaryMatch[1]) : 'Unable to parse full response',
                significance: significanceMatch ? cleanExtractedText(significanceMatch[1]) : 'Partial data extracted',
            },
            plain_english: {
                level_1: {
                    simple_explanation: simpleExpMatch ? cleanExtractedText(simpleExpMatch[1]) : 'Not available',
                    everyday_analogy: everydayAnalogyMatch ? cleanExtractedText(everydayAnalogyMatch[1]) : 'Not available',
                    key_takeaway: keyTakeawayMatch ? cleanExtractedText(keyTakeawayMatch[1]) : 'Not available',
                },
                level_2: {
                    detailed_explanation: detailedExpMatch ? cleanExtractedText(detailedExpMatch[1]) : 'Extended details not available',
                    key_terms: [],
                    practical_implications: [],
                },
                level_3: {
                    technical_breakdown: techBreakMatch ? cleanExtractedText(techBreakMatch[1]) : 'Technical details not available',
                    edge_cases: [],
                    deeper_implications: [],
                    related_concepts: [],
                    risk_factors: [],
                },
            },
            classification: {
                category: categoryMatch ? categoryMatch[1] : 'unknown',
                action: actionMatch ? actionMatch[1] : 'Unknown action',
                risk_level: riskLevelMatch ? riskLevelMatch[1] : 'medium',
                complexity: complexityMatch ? complexityMatch[1] : 'moderate',
            },
        };

        if (typeMatch) {
            partial.transaction_type = {
                type: typeMatch[1],
                description: descMatch ? cleanExtractedText(descMatch[1]) : 'Extracted from response',
                capabilities: [],
                common_use_cases: [],
            };
        }

        return partial;
    }

    return null;
}

export async function getEnhancedExplanation(
    tx: TranslatedTransaction,
    config?: GeminiConfig
): Promise<LLMExplainResponse> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    if (!finalConfig.apiKey) {
        return {
            success: false,
            error: 'Gemini API key not configured',
        };
    }

    try {
        const txData = prepareTransactionForLLM(tx);
        const prompt = ENHANCED_TX_EXPLAINER_PROMPT.replace(
            '{{TRANSACTION_JSON}}',
            JSON.stringify(txData, null, 2)
        );

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${finalConfig.model}:generateContent?key=${finalConfig.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: finalConfig.temperature,
                        maxOutputTokens: finalConfig.maxOutputTokens,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error: `Gemini API error: ${error}` };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = parseLLMResponse(text);

        if (!parsed) {
            return { success: false, error: 'Failed to parse LLM response', model: finalConfig.model };
        }

        return {
            success: true,
            explanation: parsed as unknown as LLMTransactionExplanation,
            model: finalConfig.model,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function getSimpleExplanation(
    tx: TranslatedTransaction,
    config?: GeminiConfig
): Promise<LLMExplainResponse> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    if (!finalConfig.apiKey) {
        return { success: false, error: 'Gemini API key not configured' };
    }

    try {
        const txData = prepareTransactionForLLM(tx);
        const prompt = SIMPLE_TX_EXPLAINER_PROMPT.replace(
            '{{TRANSACTION_JSON}}',
            JSON.stringify(txData, null, 2)
        );

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${finalConfig.model}:generateContent?key=${finalConfig.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: finalConfig.temperature,
                        maxOutputTokens: 512,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error: `Gemini API error: ${error}` };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = parseLLMResponse(text);

        if (!parsed) {
            return { success: false, error: 'Failed to parse LLM response', model: finalConfig.model };
        }

        return {
            success: true,
            simple_explanation: parsed as unknown as SimpleLLMExplanation,
            model: finalConfig.model,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export function isGeminiConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
}
