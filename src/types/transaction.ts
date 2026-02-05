// Sui Transaction Types

export interface SuiTransaction {
    digest: string;
    sender: string;
    gasUsed: GasUsed;
    gasObject: GasObject;
    created: ObjectReference[];
    mutated: ObjectReference[];
    deleted: ObjectReference[];
    wrapped: ObjectReference[];
    events: SuiEvent[];
    objectChanges: ObjectChange[];
    balanceChanges: BalanceChange[];
    inputObjects: ObjectReference[];
    kind: TransactionKind;
    executionStatus: ExecutionStatus;
    timestampMs?: number;
    checkpoint?: number;
    transactionBlockInfo?: TransactionBlockInfo;
}

export interface GasUsed {
    computationCost: number;
    storageCost: number;
    storageRebate: number;
    nonRefundableStorageFee: number;
}

export interface GasObject {
    owner: Owner;
    reference: ObjectReference;
}

export interface ObjectReference {
    objectId: string;
    version: number;
    digest: string;
}

export interface Owner {
    addressOwner?: string;
    objectOwner?: string;
    shared?: { initialSharedVersion: number };
}

export interface SuiEvent {
    id: { txDigest: string; eventSeq: string };
    packageId: string;
    transactionModule: string;
    sender: string;
    type: string;
    parsedJson?: Record<string, unknown>;
    bcs?: string;
}

export interface ObjectChange {
    type: 'created' | 'mutated' | 'deleted' | 'wrapped' | 'unwrapped';
    sender: string;
    objectType: string;
    objectId: string;
    version: number;
    digest?: string;
    previousVersion?: number;
    source?: string;
}

export interface BalanceChange {
    owner: Owner;
    amount: number;
    coinType: string;
}

export interface TransactionKind {
    Single?: SingleTransaction;
    Batch?: SingleTransaction[];
    ProgrammableTransaction?: ProgrammableTransaction;
}

export interface SingleTransaction {
    TransferObjects?: { objects: ObjectReference[]; address: string };
    TransferSui?: { objects: string[]; address: string; amount?: number };
    Pay?: { coins: ObjectReference[]; recipients: string[]; amounts: number[] };
    PaySui?: { coins: string[]; recipients: string[]; amounts: number[] };
    PayAllSui?: { coins: string[]; address: string };
    ChangeGasBudget?: number;
    Publish?: { modules: string[]; dependencies: string[] };
    Upgrade?: { modules: string[]; dependencies: string[]; packageId: string; ticket: string };
    Call?: MoveFunctionCall;
}

export interface ProgrammableTransaction {
    inputs: TransactionInput[];
    transactions: TransactionCommand[];
}

export interface TransactionInput {
    type: 'pure' | 'object';
    value?: unknown;
    objectType?: string;
    objectId?: string;
    version?: number;
    digest?: string;
}

export interface TransactionCommand {
    MoveFunction?: MoveFunctionCall;
    TransferObjects?: { objects: TransactionInput[]; address: TransactionInput };
    SplitCoins?: { coin: TransactionInput; amounts: TransactionInput[] };
    MergeCoins?: { destination: TransactionInput; sources: TransactionInput[] };
    Publish?: { modules: string[]; dependencies: string[] };
    Upgrade?: { modules: string[]; dependencies: string[]; package: string; ticket: TransactionInput };
    MakeMoveVec?: { type: string; elements: TransactionInput[] };
    GasCoin?: boolean;
    NativeTransfer?: { type: string; amount: number; recipient: TransactionInput };
}

export interface MoveFunctionCall {
    package: string;
    module: string;
    function: string;
    typeArguments?: string[];
    arguments?: TransactionInput[];
}

export interface ExecutionStatus {
    status: 'success' | 'failure';
    error?: string;
}

export interface TransactionBlockInfo {
    digest: string;
    cursor: string | null;
}

export interface TransactionResponse {
    digest: string;
    transaction: SuiTransaction;
    effects?: unknown;
}

export interface PaginatedTransactions {
    data: TransactionResponse[];
    nextCursor: string | null;
    hasNextPage: boolean;
}
