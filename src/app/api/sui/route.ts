import { NextRequest, NextResponse } from 'next/server';

// Sui RPC endpoints
const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { method, params } = body;

        if (!method) {
            return NextResponse.json(
                { error: 'Method is required' },
                { status: 400 }
            );
        }

        const response = await fetch(SUI_RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params: params || [],

            }),
        });

        const data = await response.json();

        if (data.error) {
            return NextResponse.json(
                {
                    code: data.error.code || 400,
                    message: data.error.message || 'Sui RPC Error',
                    data: data.error.data
                },
                { status: 400 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Sui RPC proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Sui RPC' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'Sui Transaction Explainer API' });
}
