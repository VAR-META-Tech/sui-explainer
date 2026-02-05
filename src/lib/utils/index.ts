// Re-export all utilities
export * from './formatting';
export * from './validation';

// Common helper for class names
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
