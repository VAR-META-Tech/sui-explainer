// Blockberry API Service - handles interactions with Blockberry API

import { BlockberryRawTransaction, BlockberryError } from '@/lib/blockberry/types';
import { ExternalApiError } from '../errors';

const DEFAULT_BASE_URL = 'https://api.blockberry.one/sui/v1';

export class BlockberryService {
    private baseUrl: string;
    private apiKey?: string;

    constructor(baseUrl?: string, apiKey?: string) {
        this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BLOCKBERRY_API_URL || DEFAULT_BASE_URL;
        this.apiKey = apiKey || process.env.BLOCKBERRY_API_KEY;
    }

    /**
     * Fetch raw transaction from Blockberry API
     */
    async getRawTransaction(transactionHash: string): Promise<BlockberryRawTransaction | null> {
        const url = `${this.baseUrl}/raw-transactions/${transactionHash}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    ...(this.apiKey && { 'x-api-key': this.apiKey }),
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

                throw new ExternalApiError('Blockberry', errorData.error || `HTTP ${response.status}`);
            }

            const data: BlockberryRawTransaction = await response.json();
            return data;
        } catch (error) {
            if (error instanceof ExternalApiError) {
                throw error;
            }

            if (error instanceof Error) {
                throw new ExternalApiError('Blockberry', error.message);
            }

            throw new ExternalApiError('Blockberry', 'Failed to fetch transaction');
        }
    }

    /**
     * Check if Blockberry API is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

// Export singleton instance
export const blockberryService = new BlockberryService();
