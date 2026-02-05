// Export all types
export * from './transaction';
export * from './visualization';

// Common utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ErrorInfo {
    message: string;
    code?: string;
    details?: string;
    suggestion?: string;
}

export interface APIResponse<T> {
    data: T | null;
    error: ErrorInfo | null;
    loading: boolean;
}
