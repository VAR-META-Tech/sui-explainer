// Sui RPC query helpers

import { SuiTransactionResponse as SuiTransaction } from './types';

/**
 * Query configuration for transaction fetching
 */
export interface QueryOptions {
    maxRetries?: number;
    timeout?: number;
}

/**
 * Default query options
 */
export const DEFAULT_QUERY_OPTIONS: QueryOptions = {
    maxRetries: 3,
    timeout: 30000,
};

/**
 * Custom error class for RPC errors
 */
export class SuiRPCError extends Error {
    code: string;
    details?: string;

    constructor(message: string, code: string, details?: string) {
        super(message);
        this.name = 'SuiRPCError';
        this.code = code;
        this.details = details;
    }
}

/**
 * Parse Sui RPC error response
 */
export function parseSuiError(error: unknown): SuiRPCError {
    if (error instanceof SuiRPCError) {
        return error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const codeMatch = errorMessage.match(/code:\s*(\w+)/i);
    const code = codeMatch ? codeMatch[1] : 'UNKNOWN';

    return new SuiRPCError(errorMessage, code);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: QueryOptions = DEFAULT_QUERY_OPTIONS
): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Transform raw Sui transaction to our type
 */
export function transformTransaction(response: SuiTransaction) {
    return {
        digest: response.digest,
        sender: response.transaction.data.sender,
        gasUsed: response.effects?.gasUsed || {
            computationCost: 0,
            storageCost: 0,
            storageRebate: 0,
            nonRefundableStorageFee: 0,
        },
        gasObject: response.effects?.gasObject,
        created: response.effects?.created || [],
        mutated: response.effects?.mutated || [],
        deleted: response.effects?.deleted || [],
        events: [], // Events are in the response, not effects
        objectChanges: response.objectChanges || [],
        balanceChanges: response.balanceChanges || [],
        kind: response.transaction.data.transaction.kind,
        executionStatus: response.effects?.status || { status: 'success' },
        timestampMs: response.timestampMs,
        checkpoint: response.checkpoint ? parseInt(response.checkpoint) : undefined,
    };
}
