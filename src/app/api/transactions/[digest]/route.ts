// Single API endpoint for getting enhanced transaction data

import { NextRequest, NextResponse } from 'next/server';
import { getTransaction } from '@/lib/backend/services/enhancedService';
import { TransactionError } from '@/lib/backend/errors';
import { getEnhancedExplanation, isGeminiConfigured } from '@/lib/gemini/client';
import { LLMExplainResponse } from '@/lib/gemini/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ digest: string }> }
) {
    const { digest } = await params;
    const searchParams = request.nextUrl.searchParams;
    const explainParam = searchParams.get('explain');

    // DEBUG: Log Gemini configuration
    const geminiApiKey = process.env.GEMINI_API_KEY;
    console.log('[GEMINI DEBUG] GEMINI_API_KEY present:', !!geminiApiKey);
    console.log('[GEMINI DEBUG] GEMINI_API_KEY (first 10 chars):', geminiApiKey ? geminiApiKey.substring(0, 10) + '...' : 'NOT SET');

    const geminiConfigured = isGeminiConfigured();
    console.log('[GEMINI DEBUG] isGeminiConfigured():', geminiConfigured);

    const explainMode = explainParam ? (explainParam as 'enhanced' | 'simple' | 'none')
        : (geminiConfigured ? 'enhanced' : 'none');
    console.log('[GEMINI DEBUG] explainMode:', explainMode);

    if (!digest || digest.trim() === '') {
        return NextResponse.json(
            { success: false, error: 'Transaction digest is required', code: 'INVALID_DIGEST' },
            { status: 400 }
        );
    }

    try {
        const transaction = await getTransaction(digest);
        console.log('[GEMINI DEBUG] Transaction fetched successfully, digest:', transaction.digest);

        let llmExplanation: LLMExplainResponse | null = null;

        if (explainMode !== 'none' && geminiConfigured) {
            console.log('[GEMINI DEBUG] Calling getEnhancedExplanation...');
            try {
                llmExplanation = await getEnhancedExplanation(transaction);
                console.log('[GEMINI DEBUG] getEnhancedExplanation result:', {
                    success: llmExplanation.success,
                    error: llmExplanation.error,
                    hasExplanation: !!llmExplanation.explanation,
                    model: llmExplanation.model,
                });
                if (llmExplanation.explanation) {
                    console.log('[GEMINI DEBUG] Explanation overview:', JSON.stringify(llmExplanation.explanation.overview, null, 2));
                }
            } catch (err) {
                console.error('[GEMINI DEBUG] Exception in getEnhancedExplanation:', err);
            }
        } else {
            console.log('[GEMINI DEBUG] Skipping Gemini explanation - mode:', explainMode, 'configured:', geminiConfigured);
        }

        const enhancedTransaction = { ...transaction };

        if (llmExplanation?.success && llmExplanation.explanation?.overview?.summary) {
            enhancedTransaction.plainEnglish = llmExplanation.explanation.overview.summary;
        }

        const response: Record<string, unknown> = {
            success: true,
            data: enhancedTransaction,
            explainer: {
                enabled: explainMode !== 'none',
                mode: explainMode,
                configured: geminiConfigured,
            },
        };

        if (llmExplanation?.success && llmExplanation.explanation) {
            response.gemini = {
                explanation: llmExplanation.explanation,
                simple_explanation: llmExplanation.simple_explanation,
                model: llmExplanation.model,
            };
        } else if (explainMode !== 'none' && !geminiConfigured) {
            response.gemini = {
                error: 'Gemini API not configured. Set GEMINI_API_KEY in environment variables.',
                configured: false,
            };
        } else if (llmExplanation && !llmExplanation.success) {
            response.gemini = {
                error: llmExplanation.error,
                configured: true,
            };
        }

        return NextResponse.json(response);
    } catch (error) {
        if (error instanceof TransactionError) {
            return NextResponse.json(
                { success: false, error: error.message, code: error.code },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}
