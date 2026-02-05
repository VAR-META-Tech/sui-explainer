// Enhanced Data Display Component - Shows detailed transaction information

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { 
    DetailedEffects,
    ComprehensiveEvent,
    EnrichedBalanceChange,
    EnrichedObjectChange,
    DataSourceInfo,
    EnrichedObject
} from '@/types/visualization';
import { truncateAddress } from '@/lib/utils/formatting';

interface EnhancedDataDisplayProps {
    detailedEffects?: DetailedEffects;
    events?: ComprehensiveEvent[];
    balanceChanges?: EnrichedBalanceChange[];
    objectChanges?: EnrichedObjectChange[];
    dataSource?: DataSourceInfo;
}

export function EnhancedDataDisplay({
    detailedEffects,
    events,
    balanceChanges,
    objectChanges,
    dataSource,
}: EnhancedDataDisplayProps) {
    return (
        <div className="space-y-6">
            {/* Data Source Indicator */}
            {dataSource && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Data Source:</span>
                    {dataSource.suiRpc && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            Sui RPC
                        </span>
                    )}
                    {dataSource.blockberry && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            Blockberry
                        </span>
                    )}
                    {!dataSource.blockberry && !dataSource.suiRpc && (
                        <span className="text-yellow-600">
                            Limited data available
                        </span>
                    )}
                </div>
            )}

            {/* State Changes Summary */}
            {detailedEffects && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            State Changes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">
                                    {detailedEffects.created.totalCount}
                                </p>
                                <p className="text-sm text-gray-600">Created</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">
                                    {detailedEffects.mutated.totalCount}
                                </p>
                                <p className="text-sm text-gray-600">Modified</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">
                                    {detailedEffects.deleted.totalCount}
                                </p>
                                <p className="text-sm text-gray-600">Deleted</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <p className="text-2xl font-bold text-yellow-600">
                                    {detailedEffects.wrapped.totalCount}
                                </p>
                                <p className="text-sm text-gray-600">Wrapped</p>
                            </div>
                        </div>

                        {/* Detailed Object Lists */}
                        {detailedEffects.created.objects.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-medium text-green-700 mb-2">Created Objects</h4>
                                <div className="space-y-1">
                                    {detailedEffects.created.objects.slice(0, 5).map((obj: EnrichedObject, i: number) => (
                                        <div key={i} className="flex justify-between text-sm p-2 bg-green-50 rounded">
                                            <span className="font-mono">{truncateAddress(obj.objectId)}</span>
                                            <span className="text-gray-500">{obj.objectType?.split('::').pop()}</span>
                                        </div>
                                    ))}
                                    {detailedEffects.created.objects.length > 5 && (
                                        <p className="text-sm text-gray-500">
                                            ...and {detailedEffects.created.objects.length - 5} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {detailedEffects.mutated.objects.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-medium text-blue-700 mb-2">Modified Objects</h4>
                                <div className="space-y-1">
                                    {detailedEffects.mutated.objects.slice(0, 5).map((obj: EnrichedObject, i: number) => (
                                        <div key={i} className="flex justify-between text-sm p-2 bg-blue-50 rounded">
                                            <span className="font-mono">{truncateAddress(obj.objectId)}</span>
                                            <span className="text-gray-500">{obj.objectType?.split('::').pop()}</span>
                                        </div>
                                    ))}
                                    {detailedEffects.mutated.objects.length > 5 && (
                                        <p className="text-sm text-gray-500">
                                            ...and {detailedEffects.mutated.objects.length - 5} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Events */}
            {events && events.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Events ({events.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {events.map((event: ComprehensiveEvent, index: number) => (
                                <div 
                                    key={index}
                                    className="p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{event.type.split('::').pop()}</p>
                                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">#{index + 1}</span>
                                    </div>
                                    {event.parsedData && Object.keys(event.parsedData).length > 0 && (
                                        <details className="mt-2">
                                            <summary className="text-sm text-indigo-600 cursor-pointer">
                                                View Event Data
                                            </summary>
                                            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                                                {JSON.stringify(event.parsedData, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Balance Changes */}
            {balanceChanges && balanceChanges.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Balance Changes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {balanceChanges.map((change: EnrichedBalanceChange, index: number) => (
                                <div 
                                    key={index}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={change.isIncoming ? 'text-green-600' : 'text-red-600'}>
                                            {change.isIncoming ? '↓' : '↑'}
                                        </span>
                                        <div>
                                            <p className="font-mono text-sm">{truncateAddress(change.owner)}</p>
                                            <p className="text-xs text-gray-500">{change.coinType.split('::').pop()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-medium ${change.isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                                        {change.isIncoming ? '+' : '-'}{change.formattedAmount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Object Changes */}
            {objectChanges && objectChanges.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            Object Changes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {objectChanges.map((change: EnrichedObjectChange, index: number) => (
                                <div 
                                    key={index}
                                    className="p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs rounded ${
                                                    change.operation === 'created' ? 'bg-green-100 text-green-800' :
                                                    change.operation === 'mutated' ? 'bg-blue-100 text-blue-800' :
                                                    change.operation === 'deleted' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {change.operation}
                                                </span>
                                                <span className="font-mono text-sm">{truncateAddress(change.objectId)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {change.objectType.split('::').pop()}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <p>v{change.version}</p>
                                            {change.previousVersion && (
                                                <p>from v{change.previousVersion}</p>
                                            )}
                                        </div>
                                    </div>
                                    {change.owner && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Owner: {truncateAddress(change.owner)}
                                        </p>
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
