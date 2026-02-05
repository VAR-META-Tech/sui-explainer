'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { StatusBadge } from '@/components/ui/Badge';
import { TranslatedTransaction } from '@/types/visualization';
import { mistToSui, formatCurrency, formatTimestamp } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';
import { 
    User, 
    ArrowRight, 
    Coins, 
    FileCode, 
    Box, 
    Zap, 
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    Sparkles,
    Flame
} from 'lucide-react';

export interface TransactionSummaryProps {
  transaction: TranslatedTransaction;
  className?: string;
}

// Transaction type badge colors and icons
const transactionTypeConfig: Record<string, { 
    icon: React.ElementType; 
    color: string; 
    bgColor: string;
    label: string;
}> = {
    swap: { icon: RefreshCw, color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Swap' },
    transfer: { icon: ArrowRight, color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Transfer' },
    buy: { icon: ArrowDownLeft, color: 'text-green-700', bgColor: 'bg-green-100', label: 'Buy' },
    sell: { icon: ArrowUpRight, color: 'text-red-700', bgColor: 'bg-red-100', label: 'Sell' },
    mint: { icon: Sparkles, color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'Mint' },
    burn: { icon: Flame, color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Burn' },
    call: { icon: Activity, color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'Contract Call' },
    unknown: { icon: Coins, color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Other' },
};

export function TransactionSummary({ transaction, className }: TransactionSummaryProps) {
  const { 
    plainEnglish, 
    sender, 
    recipients, 
    gasInfo, 
    status, 
    timestamp, 
    error,
    objectSummary,
    objects,
    moveCalls,
    objectStats,
    transactionType,
    financialSummary,
  } = transaction;
  
  const typeConfig = transactionTypeConfig[transactionType || 'unknown'];
  const TypeIcon = typeConfig.icon;

  // Calculate total value
  const totalValueUSD = financialSummary?.totalValueUSD || 0;
  const primaryAsset = financialSummary?.primaryAsset;
  const secondaryAsset = financialSummary?.secondaryAsset;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Transaction Type Badge */}
      <Card className={cn('border-2', typeConfig.bgColor.replace('100', '200'))}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
                <TypeIcon className={cn('h-6 w-6', typeConfig.color)} />
              </div>
              <div>
                <p className={cn('text-lg font-bold', typeConfig.color)}>
                  {typeConfig.label}
                </p>
                {financialSummary?.typeDescription && (
                  <p className="text-sm text-gray-600">{financialSummary.typeDescription}</p>
                )}
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardContent>
      </Card>

      {/* Main Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Transaction Summary</CardTitle>
            {timestamp && (
              <p className="text-sm text-gray-500">{timestamp}</p>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Main explanation */}
          <div className="text-lg text-gray-800 mb-6 leading-relaxed">
            {plainEnglish}
          </div>
          
          {/* Error message if failed */}
          {status === 'failure' && error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Transaction Failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
          
          {/* Financial Summary */}
          {totalValueUSD > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Transaction Value</span>
              </div>
              
              {/* Primary Asset */}
              {primaryAsset && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">You {financialSummary?.isIncoming ? 'received' : 'sent'}:</span>
                    <span className="font-semibold text-gray-900">
                      {primaryAsset.amount.toFixed(4)} {primaryAsset.symbol}
                    </span>
                  </div>
                  <span className="text-green-700 font-medium">
                    ~{formatCurrency(primaryAsset.valueUSD || 0)}
                  </span>
                </div>
              )}
              
              {/* Secondary Asset (for swaps) */}
              {secondaryAsset && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">
                      {financialSummary?.type === 'swap' ? 'You received:' : 'Also involved:'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {secondaryAsset.amount.toFixed(4)} {secondaryAsset.symbol}
                    </span>
                  </div>
                  <span className="text-green-700 font-medium">
                    ~{formatCurrency(secondaryAsset.valueUSD || 0)}
                  </span>
                </div>
              )}
              
              {/* Total Value */}
              <div className="flex items-center justify-between py-3 mt-2 bg-green-100 rounded-lg px-4">
                <span className="font-bold text-green-900">Total Value</span>
                <span className="text-xl font-bold text-green-800">
                  ~{formatCurrency(totalValueUSD)}
                </span>
              </div>
            </div>
          )}
          
          {/* Addresses */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sender */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sender</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {sender.address}
                </p>
                <p className="text-xs text-gray-400">{sender.truncated}</p>
              </div>
            </div>
            
            {/* Recipients */}
            {recipients.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Recipient{recipients.length > 1 ? 's' : ''}
                  </p>
                  {recipients.map((recipient) => (
                    <div key={recipient.address}>
                      <p className="font-mono text-sm text-gray-900 break-all">
                        {recipient.address}
                      </p>
                      <p className="text-xs text-gray-400">{recipient.truncated}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Gas Information */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Gas & Fees</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Gas Fee</p>
                <p className="font-semibold text-gray-900">
                  {mistToSui(gasInfo.gasFee).toFixed(6)} SUI
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Storage Rebate</p>
                <p className="font-semibold text-green-600">
                  +{mistToSui(gasInfo.storageRebate).toFixed(6)} SUI
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Net Fee</p>
                <p className="font-semibold text-gray-900">
                  {mistToSui(gasInfo.netGasFee).toFixed(6)} SUI
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Est. USD</p>
                <p className="font-semibold text-gray-900">
                  ~{formatCurrency(gasInfo.gasFeeUSD || 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Object Summary Card */}
      {objects.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Object Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Object stats */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-100 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{objectStats?.created || 0}</p>
                <p className="text-xs text-green-700">Created</p>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{objectStats?.modified || 0}</p>
                <p className="text-xs text-blue-700">Modified</p>
              </div>
              <div className="text-center p-3 bg-yellow-100 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{objectStats?.transferred || 0}</p>
                <p className="text-xs text-yellow-700">Transferred</p>
              </div>
              <div className="text-center p-3 bg-red-100 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{objectStats?.deleted || 0}</p>
                <p className="text-xs text-red-700">Deleted</p>
              </div>
            </div>
            
            {/* Object summary text */}
            <p className="text-gray-700">{objectSummary}</p>
            
            {/* Object list */}
            {objects.length > 0 && (
              <div className="mt-4 space-y-2">
                {objects.slice(0, 5).map((obj) => (
                  <div key={obj.objectId} className="flex items-center gap-2 text-sm p-2 bg-white rounded-lg">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      obj.operation === 'created' && 'bg-green-100 text-green-700',
                      obj.operation === 'mutated' && 'bg-blue-100 text-blue-700',
                      obj.operation === 'transferred' && 'bg-yellow-100 text-yellow-700',
                      obj.operation === 'deleted' && 'bg-red-100 text-red-700',
                    )}>
                      {obj.operation}
                    </span>
                    <span className="font-mono text-xs text-gray-600 truncate flex-1">
                      {obj.objectId}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {obj.category}
                    </span>
                  </div>
                ))}
                {objects.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{objects.length - 5} more objects
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gas & Resources Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Gas & Resources</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Gas breakdown */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">Computation Cost</span>
              <span className="font-semibold">{mistToSui(gasInfo.gasUsed - (gasInfo.storageRebate > 0 ? 10000000 : 0)).toFixed(6)} SUI</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">Storage Cost</span>
              <span className="font-semibold">{mistToSui(gasInfo.storageRebate > 0 ? 10000000 : 0).toFixed(6)} SUI</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600">Storage Rebate (refund)</span>
              <span className="font-semibold text-green-600">+{mistToSui(gasInfo.storageRebate).toFixed(6)} SUI</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
              <span className="font-medium">Net Gas Fee</span>
              <span className="font-bold text-lg">{mistToSui(gasInfo.netGasFee).toFixed(6)} SUI</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            💡 Storage rebate is returned to the sender when the transaction frees up storage space.
          </p>
        </CardContent>
      </Card>

      {/* Move Calls Card */}
      {moveCalls.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Smart Contract Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moveCalls.map((call, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    <span className="font-mono text-sm text-indigo-600">
                      {call.package}
                    </span>
                    <span className="text-gray-400">::</span>
                    <span className="font-medium text-gray-900">{call.module}</span>
                    <span className="text-gray-400">::</span>
                    <span className="font-medium text-gray-900">{call.function}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{call.plainEnglish}</p>
                  {call.arguments.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Arguments</p>
                      {call.arguments.map((arg, argIndex) => (
                        <div key={argIndex} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-400">•</span>
                          <div>
                            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{arg.type}</span>
                            <span className="text-gray-600 ml-2">{arg.plainEnglish}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
