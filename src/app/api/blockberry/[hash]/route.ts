import { NextRequest, NextResponse } from 'next/server';
import { blockberryClient } from '@/lib/blockberry/client';

/**
 * GET /api/blockberry/[hash]
 * Fetch raw transaction data from Blockberry API
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ hash: string }> }
) {
    const { hash } = await params;

    if (!hash) {
        return NextResponse.json(
            { error: 'Transaction hash is required' },
            { status: 400 }
        );
    }

    // Validate hash format (basic validation)
    if (hash.length < 32 || hash.length > 128) {
        return NextResponse.json(
            { error: 'Invalid transaction hash format' },
            { status: 400 }
        );
    }

    try {
        const data = await blockberryClient.getRawTransaction(hash);

        if (!data) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Blockberry API error:', error);

        const message = error instanceof Error ? error.message : 'Failed to fetch transaction';

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
