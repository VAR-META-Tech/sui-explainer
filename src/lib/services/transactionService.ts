// Transaction fetching service

import { suiProvider } from '@/lib/sui/client';
import { SuiTransactionResponse } from '@/lib/sui/types';
import { TransactionHistoryItem } from '@/types/visualization';
import { validateInput, isValidTransactionDigest, normalizeDigest } from '@/lib/utils/validation';

/**
 * Custom error class for transaction errors
 */
export class TransactionError extends Error {
    code: 'NOT_FOUND' | 'INVALID_DIGEST' | 'RPC_ERROR' | 'UNKNOWN';

    constructor(message: string, code: 'NOT_FOUND' | 'INVALID_DIGEST' | 'RPC_ERROR' | 'UNKNOWN' = 'UNKNOWN') {
        super(message);
        this.name = 'TransactionError';
        this.code = code;
    }
}

/**
 * Validate digest before making RPC call
 */
function validateDigestForRPC(digest: string): void {
    const normalized = normalizeDigest(digest);

    if (!isValidTransactionDigest(normalized)) {
        throw new TransactionError(
            `Invalid transaction digest format: ${digest}`,
            'INVALID_DIGEST'
        );
    }
}

/**
 * Fetch transaction from RPC
 */
export async function fetchTransaction(digest: string): Promise<SuiTransactionResponse> {
    const normalizedDigest = normalizeDigest(digest);

    // Validate digest before RPC call
    validateDigestForRPC(normalizedDigest);

    try {
        // Fetch from RPC using the correct method
        const transaction = await suiProvider.getTransactionBlock(normalizedDigest) as SuiTransactionResponse;

        return transaction;
    } catch (error) {
        // Handle specific RPC errors
        if (error instanceof Error) {
            const message = error.message.toLowerCase();

            // Check for "not found" errors
            if (message.includes('not found') ||
                message.includes('does not exist') ||
                message.includes('null') ||
                message.includes('undefined') ||
                message.includes('could not find')) {
                throw new TransactionError(
                    `Transaction not found: The transaction with digest ${normalizedDigest} does not exist on the blockchain.`,
                    'NOT_FOUND'
                );
            }

            // Check for invalid digest errors
            if (message.includes('invalid') && message.includes('digest')) {
                throw new TransactionError(
                    `Invalid transaction digest: ${normalizedDigest}`,
                    'INVALID_DIGEST'
                );
            }

            // RPC errors
            throw new TransactionError(
                `RPC Error: ${error.message}`,
                'RPC_ERROR'
            );
        }

        throw new TransactionError(
            'An unknown error occurred while fetching the transaction',
            'UNKNOWN'
        );
    }
}

/**
 * Fetch transaction with validation and proper error handling
 */
export async function getTransaction(input: string) {
    const validation = validateInput(input);

    if (!validation.isValid || !validation.digest) {
        throw new TransactionError(
            validation.error || 'Invalid input format',
            'INVALID_DIGEST'
        );
    }

    const transaction = await fetchTransaction(validation.digest);

    return {
        transaction,
        digest: validation.digest,
        format: validation.format
    };
}

/**
 * Add to transaction history
 */
export function addToHistory(item: TransactionHistoryItem): void {
    if (typeof window === 'undefined') return;

    try {
        const history = getHistory();
        // Remove duplicates
        const filtered = history.filter(h => h.digest !== item.digest);
        // Add new item at the beginning
        const updated = [item, ...filtered].slice(0, 50); // Keep last 50
        localStorage.setItem('transactionHistory', JSON.stringify(updated));
    } catch {
        // Storage full, ignore
    }
}

/**
 * Get transaction history
 */
export function getHistory(): TransactionHistoryItem[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem('transactionHistory');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Clear transaction history
 */
export function clearHistory(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('transactionHistory');
    }
}
