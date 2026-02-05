// Formatting utilities for Sui transaction data

/**
 * Format a Sui address with truncation for display
 */
export function truncateAddress(address: string, prefixLength = 6, suffixLength = 4): string {
    if (!address || address.length <= prefixLength + suffixLength) {
        return address;
    }
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Format SUI amount from MIST to SUI
 */
export function mistToSui(mistAmount: number): number {
    return mistAmount / 1_000_000_000;
}

/**
 * Format SUI amount from SUI to MIST
 */
export function suiToMist(suiAmount: number): number {
    return Math.round(suiAmount * 1_000_000_000);
}

/**
 * Format currency value with locale formatting
 */
export function formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format large numbers with abbreviations
 */
export function formatNumber(value: number): string {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toLocaleString();
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestampMs: number): string {
    return new Date(timestampMs).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestampMs: number): string {
    const now = Date.now();
    const diff = now - timestampMs;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}

/**
 * Format gas fee with appropriate units
 */
export function formatGasFee(gasFeeMist: number): string {
    const suiAmount = mistToSui(gasFeeMist);
    if (suiAmount < 0.001) {
        return `${(suiAmount * 1_000_000).toFixed(0)} MIST`;
    }
    return `${suiAmount.toFixed(6)} SUI`;
}

/**
 * Format object type for display
 */
export function formatObjectType(type: string): string {
    // Remove package prefix if present
    const match = type.match(/<([^>]+)>/);
    if (match) {
        return match[1].split('::').pop() || type;
    }
    return type.split('::').pop() || type;
}

/**
 * Generate a unique ID for React keys
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case or kebab-case to Title Case
 */
export function toTitleCase(str: string): string {
    return str
        .split(/[-_]/)
        .map(word => capitalize(word))
        .join(' ');
}
