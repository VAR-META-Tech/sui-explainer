// Validation utilities for transaction inputs

/**
 * Validate Sui transaction digest
 * Supports both formats:
 * - Hex: 64-character hex string (0x + 64 hex chars)
 * - Base58: Sui native format (starts with letter, alphanumeric)
 */
export function isValidTransactionDigest(digest: string): boolean {
    const cleaned = digest.trim();

    // Hex format with 0x prefix: 0x + 64 hex characters
    if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
        const hexPart = cleaned.slice(2);
        const hexRegex = /^[0-9a-fA-F]{64}$/;
        return hexRegex.test(hexPart);
    }

    // Base58 format (Sui's native format without 0x prefix)
    // Sui Base58 transaction digests are typically 44 characters
    // They start with a letter and contain alphanumeric characters (no 0, O, I, l)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (base58Regex.test(cleaned)) {
        return true;
    }

    // Plain hex without prefix (64 chars)
    const hexRegex = /^[0-9a-fA-F]{64}$/;
    return hexRegex.test(cleaned);
}

/**
 * Normalize transaction digest to standard format
 */
export function normalizeDigest(digest: string): string {
    const cleaned = digest.trim();

    // Already in standard format
    if (isValidTransactionDigest(cleaned)) {
        // If it's Base58, keep as-is
        if (!cleaned.startsWith('0x') && !cleaned.startsWith('0X')) {
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
            if (base58Regex.test(cleaned)) {
                return cleaned;
            }
        }
        // If it has 0x prefix, keep as-is
        if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
            return cleaned;
        }
        // Plain hex, add 0x prefix for consistency
        return `0x${cleaned}`;
    }

    return cleaned;
}

/**
 * Extract transaction digest from Sui Explorer URL
 */
export function extractDigestFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url.trim());

        // Sui Explorer URLs patterns
        const patterns = [
            // /transaction/...
            /\/transaction\/([a-zA-Z0-9]+)/,
            // /txn/...
            /\/txn\/([a-zA-Z0-9]+)/,
            // Query parameter ?digest=...
            /[\?&]digest=([a-zA-Z0-9]+)/,
            // Object/transaction in path
            /\/objects\/([a-zA-Z0-9]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                const extracted = match[1];
                if (isValidTransactionDigest(extracted)) {
                    return normalizeDigest(extracted);
                }
            }
        }

        // Try to validate the last path segment
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && isValidTransactionDigest(lastPart)) {
            return normalizeDigest(lastPart);
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Detect input format and validate
 */
export interface InputValidation {
    value: string;
    format: 'hex' | 'base58' | 'url' | 'invalid';
    isValid: boolean;
    digest?: string;
    error?: string;
}

export function validateInput(input: string): InputValidation {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            value: input,
            format: 'invalid',
            isValid: false,
            error: 'Input cannot be empty',
        };
    }

    // Check if it's a URL
    try {
        const url = new URL(trimmed);

        // Check if it's a Sui Explorer URL
        if (url.hostname.includes('sui') || url.hostname.includes('explorer')) {
            const digest = extractDigestFromUrl(trimmed);
            if (digest) {
                return {
                    value: trimmed,
                    format: 'url',
                    isValid: true,
                    digest,
                };
            }
            return {
                value: trimmed,
                format: 'invalid',
                isValid: false,
                error: 'Could not extract transaction digest from URL',
            };
        }

        return {
            value: trimmed,
            format: 'invalid',
            isValid: false,
            error: 'URL is not from a Sui Explorer',
        };
    } catch {
        // Not a valid URL, check if it's a direct digest
    }

    // Check if it's a valid digest
    if (!isValidTransactionDigest(trimmed)) {
        return {
            value: input,
            format: 'invalid',
            isValid: false,
            error: 'Invalid digest format. Must be 64-char hex (0x...) or Base58 (HqJ...)',
        };
    }

    const normalized = normalizeDigest(trimmed);
    const format = normalized.startsWith('0x') ? 'hex' : 'base58';

    return {
        value: normalized,
        format,
        isValid: true,
        digest: normalized,
    };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
    return input.trim();
}

/**
 * Check if a string looks like an object ID
 */
export function isValidObjectId(id: string): boolean {
    const cleaned = id.trim();

    // Check hex format with 0x
    if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
        const hexPart = cleaned.slice(2);
        return /^[0-9a-fA-F]{64}$/.test(hexPart);
    }

    // Check Base58 format
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(cleaned);
}

/**
 * Check if a string is a valid address
 */
export function isValidAddress(address: string): boolean {
    const cleaned = address.trim();

    // Sui addresses can be 0x + 1-64 hex chars
    const suiAddressRegex = /^0x[a-fA-F0-9]{1,64}$/;
    return suiAddressRegex.test(cleaned);
}
