// Sui RPC Client using fetch API with proxy support

// RPC endpoint configuration
const SUI_RPC_URLS = {
    mainnet: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443',
    testnet: process.env.NEXT_PUBLIC_SUI_TESTNET_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    devnet: 'https://fullnode.devnet.sui.io:443',
} as const;

export type SuiNetwork = keyof typeof SUI_RPC_URLS;

export interface SuiRpcResponse<T> {
    result: T;
    jsonrpc: string;
    id: number;
}

export interface RpcError {
    code: number;
    message: string;
    data?: unknown;
}

/**
 * Options for querying transaction block
 */
export interface TransactionBlockOptions {
    showInput?: boolean;
    showEffects?: boolean;
    showEvents?: boolean;
    showObjectChanges?: boolean;
    showBalanceChanges?: boolean;
    showRawInput?: boolean;
}

/**
 * Create a Sui RPC provider with the specified network
 * Uses server-side proxy to avoid CORS issues
 */
export function createProvider(network: SuiNetwork = 'mainnet') {
    const rpcUrl = SUI_RPC_URLS[network];

    return {
        /**
         * Query the Sui RPC through our proxy API
         */
        async query<T>(method: string, params: unknown[]): Promise<T> {
            const response = await fetch('/api/sui', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method,
                    params,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || data.error.toString());
            }

            return data.result as T;
        },

        async getTransactionBlock(digest: string, options?: TransactionBlockOptions) {
            const params = [
                digest,
                options || {
                    showInput: true,
                    showEffects: true,
                    showEvents: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
            ];
            return this.query('sui_getTransactionBlock', params);
        },

        async getObject(objectId: string) {
            return this.query('sui_getObject', [objectId]);
        },
    };
}

/**
 * Default provider instance
 */
export const suiProvider = createProvider('mainnet');

/**
 * Sui RPC error class
 */
export class SuiRPCError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.name = 'SuiRPCError';
        this.code = code;
    }
}
