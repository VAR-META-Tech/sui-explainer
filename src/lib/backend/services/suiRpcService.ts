// Sui RPC Service - handles all interactions with Sui RPC endpoints

import { SuiTransactionResponse } from '@/lib/sui/types';
import { RpcError, NotFoundError } from '../errors';

const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443';

export interface TransactionBlockOptions {
    showInput?: boolean;
    showEffects?: boolean;
    showEvents?: boolean;
    showObjectChanges?: boolean;
    showBalanceChanges?: boolean;
}

export class SuiRpcService {
    private rpcUrl: string;

    constructor(rpcUrl?: string) {
        this.rpcUrl = rpcUrl || SUI_RPC_URL;
    }

    /**
     * Make a JSON-RPC call to the Sui RPC endpoint
     */
    private async call<T>(method: string, params: unknown[]): Promise<T> {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new RpcError(data.error.message || 'Sui RPC error');
        }

        return data.result as T;
    }

    /**
     * Fetch a transaction block by digest
     */
    async getTransactionBlock(digest: string, options?: TransactionBlockOptions): Promise<SuiTransactionResponse> {
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

        try {
            const result = await this.call<SuiTransactionResponse>('sui_getTransactionBlock', params);
            return result;
        } catch (error) {
            if (error instanceof RpcError) {
                const message = error.message.toLowerCase();

                if (message.includes('not found') ||
                    message.includes('does not exist') ||
                    message.includes('null') ||
                    message.includes('undefined') ||
                    message.includes('could not find')) {
                    throw new NotFoundError(`Transaction not found: ${digest}`);
                }

                if (message.includes('invalid') && message.includes('digest')) {
                    throw new RpcError(`Invalid transaction digest: ${digest}`);
                }
            }
            throw error;
        }
    }

    /**
     * Fetch an object by ID
     */
    async getObject(objectId: string) {
        return this.call('sui_getObject', [objectId]);
    }

    /**
     * Get the RPC URL
     */
    getRpcUrl(): string {
        return this.rpcUrl;
    }
}

// Export singleton instance
export const suiRpcService = new SuiRpcService();
