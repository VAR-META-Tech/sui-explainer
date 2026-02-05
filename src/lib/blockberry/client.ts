// Blockberry API Client

import { BlockberryRawTransaction, BlockberryError } from './types';

const DEFAULT_BASE_URL = 'https://api.blockberry.one/sui/v1';

export interface BlockberryClientConfig {
    baseUrl?: string;
    apiKey?: string;
}

export interface BlockberryClient {
    getRawTransaction(transactionHash: string): Promise<BlockberryRawTransaction | null>;
}

export function createBlockberryClient(config: BlockberryClientConfig = {}): BlockberryClient {
    const baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_BLOCKBERRY_API_URL || DEFAULT_BASE_URL;
    const apiKey = config.apiKey || process.env.BLOCKBERRY_API_KEY;

    return {
        /**
         * Fetch raw transaction by hash from Blockberry API
         * @param transactionHash - The transaction hash to fetch
         * @returns The raw transaction data or null if not found
         */
        async getRawTransaction(transactionHash: string): Promise<BlockberryRawTransaction | null> {
            const url = `${baseUrl}/raw-transactions/${transactionHash}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        ...(apiKey && { 'x-api-key': apiKey }),
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        return null;
                    }

                    const errorData: BlockberryError = await response.json().catch(() => ({
                        error: `HTTP ${response.status}`,
                        message: response.statusText,
                    }));

                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }

                const data: BlockberryRawTransaction = await response.json();
                return data;
            } catch (error) {
                if (error instanceof Error) {
                    console.error('Blockberry API error:', error.message);
                    throw error;
                }
                console.error('Blockberry API error:', error);
                throw new Error('Failed to fetch transaction from Blockberry');
            }
        },
    };
}

// Export default client instance
export const blockberryClient = createBlockberryClient();

// Export helper to create client with custom config
export { createBlockberryClient as blockberry };
