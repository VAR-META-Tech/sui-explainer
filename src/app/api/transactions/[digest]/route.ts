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

    const geminiConfigured = isGeminiConfigured();
    const explainMode = explainParam ? (explainParam as 'enhanced' | 'simple' | 'none')
        : (geminiConfigured ? 'enhanced' : 'none');

    if (!digest || digest.trim() === '') {
        return NextResponse.json(
            { success: false, error: 'Transaction digest is required', code: 'INVALID_DIGEST' },
            { status: 400 }
        );
    }

    try {
        const transaction = await getTransaction(digest);

        let llmExplanation: LLMExplainResponse | null = null;

        if (explainMode !== 'none' && geminiConfigured) {
            try {
                llmExplanation = await getEnhancedExplanation(transaction);
            } catch {
                // Silently fail - explanation is optional
            }
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
