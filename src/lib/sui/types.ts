// Sui SDK type definitions matching the actual RPC response

export interface SuiTransactionResponse {
    digest: string;
    transaction: {
        data: {
            messageVersion: string;
            transaction: {
                kind: string; // "ProgrammableTransaction" or "Single"
                inputs?: TransactionInput[];
                transactions?: TransactionCommand[];
            };
            sender: string;
            gasData: {
                budget: string;
                price: string;
                owner: string;
                payment: Array<{
                    objectId: string;
                    version: string;
                    digest: string;
                }>;
            };
        };
        txSignatures: string[];
    };
    effects: {
        messageVersion: string;
        status: {
            status: string;
            error?: string;
        };
        gasUsed: {
            computationCost: string;
            storageCost: string;
            storageRebate: string;
            nonRefundableStorageFee: string;
        };
        transactionDigest: string;
        executedEpoch: string;
        modifiedAtVersions?: Array<{
            objectId: string;
            sequenceNumber: string;
        }>;
        sharedObjects?: Array<{
            objectId: string;
            version: string;
            digest: string;
        }>;
        mutated?: Array<{
            owner: Owner;
            reference: ObjectReference;
        }>;
        created?: Array<{
            owner: Owner;
            reference: ObjectReference;
        }>;
        deleted?: Array<{
            owner?: Owner;
            reference: ObjectReference;
        }>;
        gasObject?: {
            owner: Owner;
            reference: ObjectReference;
        };
        eventsDigest?: string;
        dependencies?: string[];
    };
    events?: SuiEvent[];
    objectChanges?: ObjectChange[];
    balanceChanges?: BalanceChange[];
    timestampMs?: string;
    checkpoint?: string;
}

export interface Owner {
    AddressOwner?: string;
    ObjectOwner?: string;
    Shared?: { initial_shared_version: string };
}

export interface ObjectReference {
    objectId: string;
    version: string;
    digest: string;
}

export interface SuiEvent {
    id: { txDigest: string; eventSeq: string };
    packageId: string;
    transactionModule: string;
    sender: string;
    type: string;
    parsedJson?: Record<string, unknown>;
    bcsEncoding?: string;
    bcs?: string;
}

export interface ObjectChange {
    type: string;
    sender: string;
    owner?: Owner;
    objectType: string;
    objectId: string;
    version: string;
    previousVersion?: string;
    digest?: string;
}

export interface BalanceChange {
    owner: Owner;
    coinType: string;
    amount: string;
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
    valueType?: string;
    objectType?: string;
    objectId?: string;
    initialSharedVersion?: string;
    mutable?: boolean;
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
    Result?: number;
    Input?: number;
}

export interface MoveFunctionCall {
    package: string;
    module: string;
    function: string;
    typeArguments?: string[];
    arguments?: TransactionInput[];
}
