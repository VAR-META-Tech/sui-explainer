// Blockberry API Types

/**
 * Raw transaction response from Blockberry API
 */
export interface BlockberryRawTransaction {
    transactionHash: string;
    sender: string;
    gasUsage: {
        computationCost: string;
        storageCost: string;
        storageRebate: string;
        nonRefundableStorageFee: string;
    };
    status: 'success' | 'failure';
    effects: BlockberryEffects;
    objectChanges: BlockberryObjectChange[];
    balanceChanges: BlockberryBalanceChange[];
    events: BlockberryEvent[];
    kind: string;
    timestamp?: string;
    checkpoint?: string;
}

/**
 * Effects from Blockberry
 */
export interface BlockberryEffects {
    created: BlockberryObjectReference[];
    mutated: BlockberryObjectReference[];
    deleted: BlockberryObjectReference[];
    wrapped: BlockberryObjectReference[];
}

/**
 * Object reference in Blockberry response
 */
export interface BlockberryObjectReference {
    owner?: string;
    reference: {
        objectId: string;
        version: string;
        digest: string;
    };
    objectType?: string;
}

/**
 * Object change from Blockberry
 */
export interface BlockberryObjectChange {
    type: 'created' | 'mutated' | 'deleted' | 'transferred';
    objectId: string;
    objectType: string;
    sender: string;
    owner?: string;
    version: string;
    previousVersion?: string;
    digest?: string;
}

/**
 * Balance change from Blockberry
 */
export interface BlockberryBalanceChange {
    owner: string;
    coinType: string;
    amount: string;
}

/**
 * Event from Blockberry
 */
export interface BlockberryEvent {
    id: {
        txDigest: string;
        eventSeq: string;
    };
    type: string;
    sender?: string;
    module?: string;
    parsedJson?: Record<string, unknown>;
    bcsEncoding?: string;
}

/**
 * Transaction metadata from Blockberry
 */
export interface BlockberryMetadata {
    transactionKind: string;
    module?: string;
    function?: string;
    packageId?: string;
}

/**
 * Error response from Blockberry API
 */
export interface BlockberryError {
    error: string;
    message?: string;
    status?: number;
}
