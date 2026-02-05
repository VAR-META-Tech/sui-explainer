/**
 * API Route for LLM-based transaction explanations
 * POST /api/explain
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedTransaction } from '@/lib/backend/services/enhancedService';
import { getEnhancedExplanation, getSimpleExplanation, isGeminiConfigured } from '@/lib/gemini/client';
import { LLMExplainResponse } from '@/lib/gemini/types';
import { TranslatedTransaction } from '@/types/visualization';

/**
 * POST /api/explain
 * Body: { digest: string, mode?: 'enhanced' | 'simple' }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { digest, mode = 'enhanced' } = body;

        if (!digest) {
            return NextResponse.json(
                { success: false, error: 'Digest is required' },
                { status: 400 }
            );
        }

        // Check if Gemini is configured
        if (!isGeminiConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'AI explanation service is not configured. Please set GEMINI_API_KEY in environment variables.',
                    configured: false
                },
                { status: 503 }
            );
        }

        // Fetch transaction data
        let tx: TranslatedTransaction;
        try {
            tx = await getEnhancedTransaction(digest);
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch transaction'
                },
                { status: 404 }
            );
        }

        // Generate explanation
        let result: LLMExplainResponse;

        if (mode === 'simple') {
            result = await getSimpleExplanation(tx);
        } else {
            result = await getEnhancedExplanation(tx);
        }

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    configured: true
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            explanation: result.explanation,
            simple_explanation: result.simple_explanation,
            model: result.model,
            transaction: {
                digest: tx.digest,
                status: tx.status,
                timestamp: tx.timestamp,
            }
        });
    } catch (error) {
        console.error('Error in explain API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/explain
 * Returns API status and configuration
 */
export async function GET() {
    return NextResponse.json({
        configured: isGeminiConfigured(),
        available_models: ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
        modes: ['enhanced', 'simple'],
        usage: {
            method: 'POST',
            body: {
                digest: 'string (transaction digest)',
                mode: "'enhanced' | 'simple' (optional, default: 'enhanced')"
            }
        }
    });
}
