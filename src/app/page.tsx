'use client';

import { useState, useCallback, useEffect } from 'react';
import { TransactionInput } from '@/components/transaction/TransactionInput';
import { TransactionSummary } from '@/components/transaction/TransactionSummary';
import { TransactionFlow } from '@/components/transaction/TransactionFlow';
import { TransactionSteps } from '@/components/transaction/TransactionSteps';
import { GeminiExplanationDisplay } from '@/components/transaction/GeminiExplanationDisplay';
import { SkeletonCard, SkeletonTransactionDetails } from '@/components/ui/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { TranslatedTransaction, TransactionHistoryItem } from '@/types/visualization';
import { useTransaction } from '@/hooks/useTransaction';
import { cn } from '@/lib/utils';
import { History, Trash2, ExternalLink, Copy, Check, AlertCircle, HelpCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// History management functions (keep locally since they're UI-related)
function getHistory(): TransactionHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('transactionHistory');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addToHistory(item: TransactionHistoryItem): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    const filtered = history.filter(h => h.digest !== item.digest);
    const updated = [item, ...filtered].slice(0, 50);
    localStorage.setItem('transactionHistory', JSON.stringify(updated));
  } catch {
    // Storage full, ignore
  }
}

function clearHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('transactionHistory');
  }
}

export default function HomePage() {
  // Use the transaction hook for API calls
  const { transaction, geminiExplanation, geminiInfo, isLoading, error, fetchTransaction, clearTransaction } = useTransaction();
  
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  // Load history on mount
  useEffect(() => {
    const savedHistory = getHistory();
    setHistory(savedHistory);
    
    const savedPage = localStorage.getItem('historyPage');
    if (savedPage) {
      const page = parseInt(savedPage, 10);
      const maxPage = Math.ceil(savedHistory.length / ITEMS_PER_PAGE);
      setCurrentPage(page <= maxPage && page > 0 ? page : 1);
    }
  }, []);
  
  // Save page number when it changes
  const handlePageChange = useCallback((newPage: number) => {
    const maxPage = Math.ceil(history.length / ITEMS_PER_PAGE);
    if (newPage >= 1 && newPage <= maxPage) {
      setCurrentPage(newPage);
      localStorage.setItem('historyPage', String(newPage));
    }
  }, [history.length]);
  
  const handleSubmit = useCallback(async (digest: string) => {
    await fetchTransaction(digest);
    
    // Add to history after successful fetch
    if (transaction) {
      addToHistory({
        digest: transaction.digest,
        summary: transaction.plainEnglish.slice(0, 100),
        timestamp: Date.now(),
        status: transaction.status,
      });
      const savedHistory = getHistory();
      setHistory(savedHistory);
    }
  }, [fetchTransaction, transaction]);
  
  const handleCopyDigest = useCallback(async () => {
    if (transaction) {
      await navigator.clipboard.writeText(transaction.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [transaction]);
  
  const handleClearHistory = useCallback(() => {
    clearHistory();
    const savedHistory = getHistory();
    setHistory(savedHistory);
  }, []);
  
  const handleViewTransaction = useCallback((digest: string) => {
    handleSubmit(digest);
  }, [handleSubmit]);
  
  // Get user-friendly error message
  const getErrorDisplay = () => {
    if (!error) return null;
    
    const errorMessages: Record<string, { title: string; message: string; suggestion: string }> = {
      NOT_FOUND: {
        title: 'Transaction Not Found',
        message: 'The transaction you requested does not exist on the blockchain.',
        suggestion: 'Please verify the transaction digest is correct and try again.',
      },
      INVALID_DIGEST: {
        title: 'Invalid Transaction Format',
        message: 'The transaction digest format is not recognized.',
        suggestion: 'Ensure you\'re using a valid 64-character hex digest or Base58 format.',
      },
      RPC_ERROR: {
        title: 'Network Error',
        message: 'Unable to connect to the Sui blockchain.',
        suggestion: 'Please check your internet connection and try again.',
      },
      VALIDATION_ERROR: {
        title: 'Validation Error',
        message: 'The input format is not valid.',
        suggestion: 'Please enter a valid transaction digest or Sui Explorer URL.',
      },
      EXTERNAL_API_ERROR: {
        title: 'External Service Error',
        message: 'Unable to fetch data from external service.',
        suggestion: 'Please try again later.',
      },
      UNKNOWN: {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred while processing your request.',
        suggestion: 'Please try again or contact support if the issue persists.',
      },
      FETCH_ERROR: {
        title: 'Connection Error',
        message: 'Unable to connect to the server.',
        suggestion: 'Please check your internet connection and try again.',
      },
      INTERNAL_ERROR: {
        title: 'Server Error',
        message: 'An internal server error occurred.',
        suggestion: 'Please try again later.',
      },
    };
    
    const errorInfo = errorMessages[error.code] || errorMessages.UNKNOWN;
    
    return (
      <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">{errorInfo.title}</h3>
            <p className="text-red-700 mt-1">{errorInfo.message}</p>
            <div className="mt-3 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-red-600">
                <strong>Tip:</strong> {errorInfo.suggestion}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sui Transaction Explainer
              </h1>
              <p className="text-sm text-gray-500">
                Understand any Sui blockchain transaction in plain English
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(`https://explorer.sui.io/transaction/${transaction?.digest}`, '_blank')}
              disabled={!transaction}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <section className="mb-8">
          <TransactionInput onSubmit={handleSubmit} isLoading={isLoading} />
        </section>
        
        {/* Error Display */}
        {error && getErrorDisplay()}
        
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 animate-fade-in">
            <SkeletonCard />
            <SkeletonTransactionDetails />
          </div>
        )}
        
        {/* Transaction Results */}
        {transaction && !isLoading && !error && (
          <div className="space-y-6 animate-slide-up">
            {/* Transaction Summary */}
            <TransactionSummary transaction={transaction} />
            
            {/* AI-Powered 3-Tier Explanation */}
            {(geminiExplanation || geminiInfo) && (
              <GeminiExplanationDisplay 
                explanation={geminiExplanation}
                geminiInfo={geminiInfo}
              />
            )}
            
            {/* Interactive Step-by-Step Breakdown */}
            {transaction.steps && transaction.steps.length > 0 && (
              <TransactionSteps 
                steps={transaction.steps} 
                senderAddress={transaction.sender.address}
              />
            )}
            
            {/* Visual Flow Diagram */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Transaction Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionFlow transaction={transaction} />
              </CardContent>
            </Card>
            
            {/* Digest Copy Section */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Transaction Digest</p>
                    <p className="font-mono text-sm text-gray-900 break-all">
                      {transaction.digest}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleCopyDigest}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* History Section */}
        {history.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </h2>
              <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, history.length)} of {history.length} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(history.length / ITEMS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(history.length / ITEMS_PER_PAGE)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {history
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((item) => (
                <Card
                  key={item.digest}
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300',
                    transaction?.digest === item.digest
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200'
                  )}
                  onClick={() => handleViewTransaction(item.digest)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Selected indicator */}
                        {transaction?.digest === item.digest && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          </div>
                        )}
                        <div className={cn('flex-1 min-w-0', transaction?.digest === item.digest && 'ml-2')}>
                          <div className="flex items-center gap-2">
                            <FileText className={cn(
                              'h-4 w-4',
                              transaction?.digest === item.digest ? 'text-indigo-600' : 'text-gray-400'
                            )} />
                            <p className={cn(
                              'text-sm truncate',
                              transaction?.digest === item.digest ? 'text-indigo-900 font-medium' : 'text-gray-900'
                            )}>
                              {item.summary}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          item.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        )}>
                          {item.status}
                        </span>
                        {transaction?.digest === item.digest && (
                          <span className="text-xs text-indigo-600 font-medium">
                            Currently viewing
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
        
        {/* Empty State */}
        {!transaction && !isLoading && error && history.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No transactions yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter a Sui transaction digest or explorer URL above to get a human-readable explanation.
            </p>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Built for the Sui ecosystem
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.sui.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Sui Documentation
              </a>
              <a
                href="https://github.com/sui-foundation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
