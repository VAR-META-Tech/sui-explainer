'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { TransactionStep } from '@/types/visualization';
import { cn } from '@/lib/utils';
import { 
    ArrowRight, 
    ArrowDown, 
    Coins, 
    Box, 
    Zap, 
    FileCode, 
    ChevronDown, 
    ChevronUp,
    Wallet,
    User
} from 'lucide-react';

interface TransactionStepsProps {
    steps: TransactionStep[];
    senderAddress: string;
    className?: string;
}

export function TransactionSteps({ steps, senderAddress, className }: TransactionStepsProps) {
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

    const toggleStep = (stepId: string) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepId)) {
            newExpanded.delete(stepId);
        } else {
            newExpanded.add(stepId);
        }
        setExpandedSteps(newExpanded);
    };

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'input':
                return <ArrowDown className="h-4 w-4 text-blue-500" />;
            case 'output':
                return <ArrowRight className="h-4 w-4 text-green-500" />;
            case 'transfer':
                return <Wallet className="h-4 w-4 text-purple-500" />;
            case 'action':
                return <FileCode className="h-4 w-4 text-orange-500" />;
            default:
                return <Zap className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStepColor = (type: string) => {
        switch (type) {
            case 'input':
                return 'border-l-blue-400 bg-blue-50';
            case 'output':
                return 'border-l-green-400 bg-green-50';
            case 'transfer':
                return 'border-l-purple-400 bg-purple-50';
            case 'action':
                return 'border-l-orange-400 bg-orange-50';
            default:
                return 'border-l-gray-400 bg-gray-50';
        }
    };

    const getAssetBadge = (assetType?: string) => {
        switch (assetType) {
            case 'sui':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">SUI</span>;
            case 'nft':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">NFT</span>;
            case 'token':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Token</span>;
            case 'object':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Object</span>;
            default:
                return null;
        }
    };

    if (steps.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="py-8 text-center">
                    <p className="text-gray-500">No transaction steps available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('', className)}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-indigo-600" />
                    Transaction Steps
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const isExpanded = expandedSteps.has(step.id);
                        const hasDetails = step.details || step.from || step.to;

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    'relative pl-4 py-3 rounded-lg border-l-4 transition-all duration-200',
                                    getStepColor(step.type),
                                    hasDetails && 'cursor-pointer hover:shadow-md',
                                    !hasDetails && 'cursor-default'
                                )}
                                onClick={() => hasDetails && toggleStep(step.id)}
                            >
                                {/* Timeline connector */}
                                {index < steps.length - 1 && (
                                    <div className="absolute left-[7px] top-10 bottom-[-12px] w-0.5 bg-gray-300" />
                                )}

                                {/* Step header */}
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getStepIcon(step.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold text-gray-900">{step.title}</h4>
                                            {getAssetBadge(step.assetType)}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                                        {/* Expandable details */}
                                        {hasDetails && (
                                            <div className={cn(
                                                'mt-3 overflow-hidden transition-all duration-200',
                                                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                            )}>
                                                <div className="bg-white/60 rounded-lg p-3 space-y-2 text-sm">
                                                    {/* From address */}
                                                    {step.from && (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-3 w-3 text-gray-400" />
                                                            <span className="text-gray-500">From:</span>
                                                            <span className="font-mono text-gray-700 break-all">{step.from}</span>
                                                        </div>
                                                    )}

                                                    {/* To address */}
                                                    {step.to && (
                                                        <div className="flex items-center gap-2">
                                                            <Wallet className="h-3 w-3 text-gray-400" />
                                                            <span className="text-gray-500">To:</span>
                                                            <span className="font-mono text-gray-700 break-all">{step.to}</span>
                                                        </div>
                                                    )}

                                                    {/* Amount */}
                                                    {step.amount && (
                                                        <div className="flex items-center gap-2">
                                                            <Coins className="h-3 w-3 text-gray-400" />
                                                            <span className="text-gray-500">Amount:</span>
                                                            <span className="font-semibold text-gray-700">{step.amount}</span>
                                                        </div>
                                                    )}

                                                    {/* Asset details */}
                                                    {step.asset && step.assetType !== 'object' && (
                                                        <div className="flex items-center gap-2">
                                                            <Box className="h-3 w-3 text-gray-400" />
                                                            <span className="text-gray-500">Asset:</span>
                                                            <span className="font-medium text-gray-700">{step.asset}</span>
                                                        </div>
                                                    )}

                                                    {/* Object ID */}
                                                    {step.assetType === 'object' && step.details && (
                                                        <div className="flex items-center gap-2">
                                                            <Box className="h-3 w-3 text-gray-400" />
                                                            <span className="text-gray-500">Object ID:</span>
                                                            <span className="font-mono text-gray-700 break-all">{step.details}</span>
                                                        </div>
                                                    )}

                                                    {/* Additional details */}
                                                    {step.details && !step.assetType && (
                                                        <div className="flex items-start gap-2">
                                                            <FileCode className="h-3 w-3 text-gray-400 mt-1" />
                                                            <div>
                                                                <span className="text-gray-500">Details:</span>
                                                                <p className="text-gray-700 mt-1">{step.details}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Expand/collapse indicator */}
                                        {hasDetails && (
                                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronUp className="h-3 w-3" />
                                                        <span>Show less</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="h-3 w-3" />
                                                        <span>Show details</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
