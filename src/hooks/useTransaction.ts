// React hook for fetching and managing transaction data

import { useState, useCallback } from 'react';
import { TranslatedTransaction } from '@/types/visualization';
import { LLMTransactionExplanation } from '@/lib/gemini/types';

interface UseTransactionError {
    message: string;
    code: string;
}

interface GeminiInfo {
    enabled: boolean;
    configured: boolean;
    mode: string;
}

interface UseTransactionReturn {
    transaction: TranslatedTransaction | null;
    geminiExplanation: LLMTransactionExplanation | null;
    geminiInfo: GeminiInfo | null;
    isLoading: boolean;
    error: UseTransactionError | null;
    fetchTransaction: (digest: string) => Promise<void>;
    clearTransaction: () => void;
}

export function useTransaction(): UseTransactionReturn {
    const [transaction, setTransaction] = useState<TranslatedTransaction | null>(null);
    const [geminiExplanation, setGeminiExplanation] = useState<LLMTransactionExplanation | null>(null);
    const [geminiInfo, setGeminiInfo] = useState<GeminiInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<UseTransactionError | null>(null);

    const fetchTransaction = useCallback(async (digest: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Always request enhanced explanation
            const response = await fetch(`/api/transactions/${digest}?explain=enhanced`);

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch transaction');
            }

            setTransaction(data.data);

            // Extract Gemini explanation if available
            if (data.gemini && data.gemini.explanation) {
                setGeminiExplanation(data.gemini.explanation);
            } else {
                setGeminiExplanation(null);
            }

            // Store Gemini info
            if (data.explainer) {
                setGeminiInfo({
                    enabled: data.explainer.enabled,
                    configured: data.explainer.configured,
                    mode: data.explainer.mode,
                });
            } else {
                setGeminiInfo(null);
            }
        } catch (err) {
            setError({
                message: err instanceof Error ? err.message : 'Unknown error',
                code: (err as Error).name || 'FETCH_ERROR',
            });
            setGeminiExplanation(null);
            setGeminiInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearTransaction = useCallback(() => {
        setTransaction(null);
        setGeminiExplanation(null);
        setGeminiInfo(null);
        setError(null);
    }, []);

    return {
        transaction,
        geminiExplanation,
        geminiInfo,
        isLoading,
        error,
        fetchTransaction,
        clearTransaction,
    };
}
