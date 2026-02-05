'use client';

import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { validateInput } from '@/lib/utils/validation';
import { cn } from '@/lib/utils';

export interface TransactionInputProps {
  onSubmit: (digest: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function TransactionInput({ onSubmit, isLoading, className }: TransactionInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [validation, setValidation] = useState<ReturnType<typeof validateInput> | null>(null);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setValue(input);
    setError('');
    
    if (input.trim()) {
      const result = validateInput(input);
      setValidation(result);
      if (!result.isValid && result.error) {
        setError(result.error);
      }
    } else {
      setValidation(null);
    }
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim()) {
      setError('Please enter a transaction digest or URL');
      return;
    }
    
    const result = validateInput(value);
    if (!result.isValid || !result.digest) {
      setError(result.error || 'Invalid input');
      return;
    }
    
    onSubmit(result.digest);
  }, [value, onSubmit]);
  
  const handleClear = useCallback(() => {
    setValue('');
    setError('');
    setValidation(null);
  }, []);
  
  return (
    <form onSubmit={handleSubmit} className={cn('w-full max-w-2xl mx-auto', className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            value={value}
            onChange={handleChange}
            placeholder="Paste transaction digest (64-char hex) or Sui Explorer URL"
            error={error}
            icon={<Search className="h-5 w-5" />}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {value && (
            <Button type="button" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
          )}
          <Button type="submit" isLoading={isLoading} disabled={!validation?.isValid}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
      
      {validation && validation.isValid && !error && (
        <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
          <span>✓ Valid {validation.format === 'url' ? 'URL' : 'digest'} detected</span>
          {validation.digest && (
            <span className="text-gray-500 font-mono">
              {validation.digest.slice(0, 16)}...
            </span>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Examples:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Raw digest: <code className="bg-gray-100 px-1 rounded">0x1234...5678</code></li>
          <li>Explorer URL: <code className="bg-gray-100 px-1 rounded">https://explorer.sui.io/transaction/...</code></li>
        </ul>
      </div>
    </form>
  );
}
