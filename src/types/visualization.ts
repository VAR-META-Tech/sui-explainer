// Application-specific types for visualization and UI

import { SuiTransaction } from './transaction';

export type TransactionType = 'buy' | 'sell' | 'swap' | 'transfer' | 'mint' | 'burn' | 'call' | 'unknown';

export interface FinancialAsset {
    coinType: string;
    symbol: string;
    name: string;
    amount: number;
    valueUSD?: number;
}

export interface FinancialSummary {
    type: TransactionType;
    typeDescription: string;
    primaryAsset?: FinancialAsset;
    secondaryAsset?: FinancialAsset;
    totalValueUSD?: number;
    isIncoming: boolean;
}

export interface FlowNode {
    id: string;
    type: 'sender' | 'recipient' | 'contract' | 'object' | 'initiation' | 'verification' | 'processing' | 'confirmation' | 'completion';
    label: string;
    address?: string;
    truncated?: string;
    package?: string;
    module?: string;
    objectId?: string;
    position?: { x: number; y: number };
    annotation?: string;  // Data annotation showing what's transferred/processed
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    type: 'transfer' | 'action' | 'result' | 'initiate' | 'verify' | 'process' | 'confirm';
    animated?: boolean;
}

export interface TransactionStep {
    id: string;
    type: 'input' | 'output' | 'action' | 'transfer';
    title: string;
    description: string;
    from?: string;
    to?: string;
    amount?: string;
    asset?: string;
    assetType?: 'sui' | 'token' | 'nft' | 'object';
    details?: string;
}

export interface TransactionNode {
    id: string;
    type: 'address' | 'object' | 'contract' | 'gas';
    label: string;
    shortLabel?: string;
    details?: string;
    metadata?: Record<string, unknown>;
    position?: { x: number; y: number };
}

export interface TransactionEdge {
    id: string;
    source: string;
    target: string;
    type: 'transfer' | 'call' | 'create' | 'modify' | 'delete';
    label?: string;
    asset?: AssetInfo;
    animated?: boolean;
}

export interface AssetFlow {
    nodes: TransactionNode[];
    edges: TransactionEdge[];
}

export interface AssetInfo {
    type: string;
    amount?: number;
    coinType?: string;
    objectId?: string;
    name?: string;
}

export interface ObjectStats {
    created: number;
    modified: number;
    deleted: number;
    transferred: number;
}

// Main translated transaction type
export type TranslatedTransaction = {
    digest: string;
    summary: string;
    technicalSummary: string;
    plainEnglish: string;
    objectSummary: string;
    gasSummary: string;
    sender: TranslatedAddress;
    recipients: TranslatedAddress[];
    assets: TranslatedAsset[];
    gasInfo: GasInfo;
    moveCalls: MoveCallInfo[];
    objects: TranslatedObject[];
    events: TranslatedEvent[];
    timestamp?: string;
    status: 'success' | 'failure';
    error?: string;
    objectStats?: ObjectStats;
    flowNodes?: FlowNode[];
    flowEdges?: FlowEdge[];
    steps?: TransactionStep[];
    transactionType?: TransactionType;
    financialSummary?: FinancialSummary;
    // Enhanced fields (optional)
    enhancedMetadata?: EnhancedMetadata;
    detailedEffects?: DetailedEffects;
    comprehensiveEvents?: ComprehensiveEvent[];
    enrichedBalanceChanges?: EnrichedBalanceChange[];
    completeObjectChanges?: EnrichedObjectChange[];
    dataSource?: DataSourceInfo;
    // Transaction type explanation
    transactionTypeExplanation?: TransactionTypeExplanation;
    // Detailed transaction flow
    detailedFlow?: DetailedTransactionFlow;
};

export interface TranslatedAddress {
    address: string;
    truncated: string;
    label?: string;
    type: 'sender' | 'recipient' | 'owner';
}

export interface TranslatedAsset {
    type: 'coin' | 'nft' | 'custom';
    name: string;
    symbol?: string;
    amount?: number;
    coinType?: string;
    objectId?: string;
    description?: string;
}

export interface GasInfo {
    gasUsed: number;
    gasFee: number;
    gasFeeUSD?: number;
    storageRebate: number;
    netGasFee: number;
}

export interface MoveCallInfo {
    package: string;
    module: string;
    function: string;
    description: string;
    plainEnglish: string;
    arguments: MoveArgument[];
    typeArguments?: string[];
}

export interface MoveArgument {
    name?: string;
    type: string;
    value: string;
    plainEnglish: string;
}

export interface TranslatedObject {
    objectId: string;
    type: string;
    category: 'nft' | 'coin' | 'custom' | 'package';
    name?: string;
    description?: string;
    operation: 'created' | 'transferred' | 'mutated' | 'deleted';
    owner?: string;
}

export interface TranslatedEvent {
    type: string;
    sender?: string;
    module?: string;
    description: string;
    plainEnglish: string;
    data?: Record<string, unknown>;
}

export interface TransactionHistoryItem {
    digest: string;
    summary: string;
    timestamp: number;
    status: 'success' | 'failure';
    transactionType?: TransactionType;
    totalValueUSD?: number;
}

export interface SearchInput {
    value: string;
    format: 'digest' | 'url' | 'invalid';
    isValid: boolean;
}

export interface UIState {
    isLoading: boolean;
    error: string | null;
    theme: 'light' | 'dark' | 'system';
}

// ============================================
// Enhanced Types for Blockberry Integration
// ============================================

/**
 * Enhanced metadata combining Sui RPC and Blockberry data
 */
export interface EnhancedMetadata {
    transactionHash: string;
    sender: string;
    gasUsage: {
        computationCost: number;
        storageCost: number;
        storageRebate: number;
        netGasFee: number;
    };
    status: 'success' | 'failure';
    timestamp?: string;
    checkpoint?: string;
    transactionKind: string;
    module?: string;
    function?: string;
    packageId?: string;
}

/**
 * Enriched object from Blockberry
 */
export interface EnrichedObject {
    objectId: string;
    version: string;
    digest: string;
    objectType?: string;
    owner?: string;
}

/**
 * Detailed effects from Blockberry
 */
export interface DetailedEffects {
    created: {
        objects: EnrichedObject[];
        totalCount: number;
    };
    mutated: {
        objects: EnrichedObject[];
        totalCount: number;
    };
    deleted: {
        objects: string[];
        totalCount: number;
    };
    wrapped: {
        objects: string[];
        totalCount: number;
    };
}

/**
 * Comprehensive event with parsed data
 */
export interface ComprehensiveEvent {
    type: string;
    sender?: string;
    module?: string;
    description: string;
    parsedData?: Record<string, unknown>;
    rawEncoding?: string;
    index: number;
}

/**
 * Enriched balance change with formatted amount
 */
export interface EnrichedBalanceChange {
    owner: string;
    coinType: string;
    amount: number;
    isIncoming: boolean;
    formattedAmount: string;
}

/**
 * Complete object change with before/after state
 */
export interface EnrichedObjectChange {
    objectId: string;
    objectType: string;
    operation: 'created' | 'mutated' | 'deleted' | 'transferred';
    sender: string;
    owner?: string;
    version: string;
    previousVersion?: string;
    digest?: string;
}

/**
 * Data source information
 */
export interface DataSourceInfo {
    suiRpc: boolean;
    blockberry: boolean;
}

/**
 * Explanation of transaction kind/type
 */
export interface TransactionTypeExplanation {
    kind: string;                          // Original kind (e.g., "ProgrammableTransaction")
    simplifiedType: string;                // Simplified type for display (e.g., "Smart Contract")
    description: string;                   // Human-readable explanation
    capabilities: string[];                // What this transaction type enables
    difference: string;                    // How it differs from other types
}

/**
 * Step in the transaction execution flow
 */
export interface ExecutionStep {
    stepNumber: number;
    stepType: 'input' | 'command' | 'object_change' | 'gas_payment' | 'finalize';
    title: string;
    description: string;
    details?: string;
    objectId?: string;
    objectType?: string;
    changeType?: 'created' | 'mutated' | 'deleted' | 'transferred';
    inputObjects?: string[];
    outputObjects?: string[];
}

/**
 * Detailed transaction flow analysis
 */
export interface DetailedTransactionFlow {
    entryPoint: string;                    // What initiated this transaction
    totalSteps: number;
    executionSteps: ExecutionStep[];
    crossContractCalls: Array<{
        package: string;
        module: string;
        function: string;
        description: string;
    }>;
    objectLifecycle: Array<{
        objectId: string;
        objectType: string;
        operations: string[];
    }>;
    valueFlow: Array<{
        from: string;
        to: string;
        asset: string;
        amount: string;
    }>;
    protocolInteractions: string[];
    executionSummary: string;
}

/**
 * Sui transaction kinds and their explanations
 */
export const SUI_TRANSACTION_KINDS: Record<string, {
    displayName: string;
    description: string;
    capabilities: string[];
    difference: string;
}> = {
    'ProgrammableTransaction': {
        displayName: 'Smart Contract (Programmable)',
        description: 'A flexible transaction that executes one or more Move commands in sequence. This is the most common type for DeFi interactions, NFT operations, and complex multi-step transactions on Sui.',
        capabilities: [
            'Execute multiple Move functions in a single transaction',
            'Perform complex DeFi operations (swaps, lending, staking)',
            'Interact with multiple smart contracts',
            'Create, modify, and transfer custom objects',
            'Handle conditional logic and branching',
            'Bundle multiple operations for atomic execution'
        ],
        difference: 'Unlike simple transfers, programmable transactions can execute arbitrary Move code, enabling sophisticated applications like DEXs, lending protocols, and NFT marketplaces. All operations execute atomically - either all succeed or all fail.'
    },
    'Single': {
        displayName: 'Single Operation',
        description: 'A simple transaction containing exactly one operation. This is the most basic type of transaction on Sui, designed for straightforward actions.',
        capabilities: [
            'Transfer SUI coins to a single recipient',
            'Transfer objects to a single recipient',
            'Pay multiple recipients from coin inputs'
        ],
        difference: 'Single operations are limited to predefined transfer types. They cannot execute arbitrary smart contract code or perform complex multi-step operations. They are simpler and cheaper gas-wise but less flexible than programmable transactions.'
    },
    'Batch': {
        displayName: 'Batch Transaction',
        description: 'A transaction that executes multiple single operations in sequence. Similar to programmable but limited to predefined operation types.',
        capabilities: [
            'Execute multiple transfers in one transaction',
            'Combine different transfer types',
            'Atomic execution of multiple transfers'
        ],
        difference: 'Batch transactions can only contain transfer-type operations, not arbitrary Move calls. They are a middle ground between single and programmable transactions, offering simplicity with some flexibility.'
    }
};
