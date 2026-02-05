// Digest validation utilities

/**
 * Validate Sui transaction digest
 * Supports both formats:
 * - Hex: 64-character hex string (0x + 64 hex chars)
 * - Base58: Sui native format (starts with letter, alphanumeric)
 */
export function isValidDigest(digest: string): boolean {
    const cleaned = digest.trim();

    // Hex format with 0x prefix: 0x + 64 hex characters
    if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
        const hexPart = cleaned.slice(2);
        const hexRegex = /^[0-9a-fA-F]{64}$/;
        return hexRegex.test(hexPart);
    }

    // Base58 format
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

    if (isValidDigest(cleaned)) {
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
        // Plain hex, add 0x prefix
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

        const patterns = [
            /\/transaction\/([a-zA-Z0-9]+)/,
            /\/txn\/([a-zA-Z0-9]+)/,
            /[\?&]digest=([a-zA-Z0-9]+)/,
            /\/objects\/([a-zA-Z0-9]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                const extracted = match[1];
                if (isValidDigest(extracted)) {
                    return normalizeDigest(extracted);
                }
            }
        }

        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && isValidDigest(lastPart)) {
            return normalizeDigest(lastPart);
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Validate and normalize input
 */
export interface ValidationResult {
    value: string;
    isValid: boolean;
    digest?: string;
    format?: 'hex' | 'base58' | 'url' | 'invalid';
    error?: string;
}

export function validateInput(input: string): ValidationResult {
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
        // Not a URL, check if it's a digest
    }

    if (!isValidDigest(trimmed)) {
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
