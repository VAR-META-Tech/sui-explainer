// Enhanced Transaction Service - combines Sui RPC + Blockberry data with translation

import { SuiTransactionResponse } from '@/lib/sui/types';
import { BlockberryRawTransaction } from '@/lib/blockberry/types';
import { TranslatedTransaction, TransactionType, FinancialSummary, FinancialAsset, TransactionTypeExplanation, DetailedTransactionFlow, ExecutionStep, SUI_TRANSACTION_KINDS, FlowNode, FlowEdge } from '@/types/visualization';
import { suiRpcService } from './suiRpcService';
import { blockberryService } from './blockberryService';
import { NotFoundError } from '../errors';

// Known DeFi protocol package IDs for event analysis
const DEFI_PROTOCOLS = [
    '0x0000000000000000000000000000000000000000000000000000000000000001', // DeepBook
    '0x0000000000000000000000000000000000000000000000000000000000000002', // Cetus
    '0x0000000000000000000000000000000000000000000000000000000000000003', // Turbos
];

// Move function descriptions
const MOVE_FUNCTION_DESCRIPTIONS: Record<string, { description: string; plainEnglish: string; action: string }> = {
    'transfer': { description: 'Transfer an object', plainEnglish: 'transfers ownership of a digital asset', action: 'transferred ownership' },
    'transfer_sui': { description: 'Transfer SUI coins', plainEnglish: 'sends SUI cryptocurrency', action: 'sent SUI coins' },
    'pay': { description: 'Pay multiple recipients', plainEnglish: 'distributes coins to multiple recipients', action: 'made payments' },
    'pay_sui': { description: 'Pay SUI to multiple', plainEnglish: 'sends SUI to multiple recipients', action: 'sent SUI to multiple recipients' },
    'mint': { description: 'Mint new tokens or NFTs', plainEnglish: 'creates new tokens or NFTs', action: 'created new tokens' },
    'burn': { description: 'Burn tokens', plainEnglish: 'permanently removes tokens from circulation', action: 'burned tokens' },
    'swap': { description: 'Swap tokens on a DEX', plainEnglish: 'exchanges one type of token for another', action: 'swapped tokens' },
    'add_liquidity': { description: 'Add liquidity to a pool', plainEnglish: 'adds funds to a liquidity pool', action: 'added liquidity' },
    'remove_liquidity': { description: 'Remove liquidity from a pool', plainEnglish: 'withdraws funds from a liquidity pool', action: 'removed liquidity' },
    'create': { description: 'Create a new object', plainEnglish: 'creates a new object on the blockchain', action: 'created an object' },
    'update': { description: 'Update an object', plainEnglish: 'modifies an existing object', action: 'updated an object' },
    'delete': { description: 'Delete an object', plainEnglish: 'removes an object from the blockchain', action: 'deleted an object' },
    'claim': { description: 'Claim assets', plainEnglish: 'claims assets from a contract', action: 'claimed assets' },
    'deposit': { description: 'Deposit assets', plainEnglish: 'deposits assets into a contract', action: 'deposited assets' },
    'withdraw': { description: 'Withdraw assets', plainEnglish: 'withdraws assets from a contract', action: 'withdrew assets' },
};

/**
 * Convert MIST to SUI
 */
function mistToSui(mistAmount: number): number {
    return mistAmount / 1_000_000_000;
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string, prefixLength = 6, suffixLength = 4): string {
    if (!address || address.length <= prefixLength + suffixLength) {
        return address;
    }
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Result of balance change analysis
 */
interface BalanceAnalysis {
    suiChange: number;              // Net SUI change (positive = incoming, negative = outgoing)
    tokenChanges: Map<string, number>; // Coin type -> net change
    hasIncoming: boolean;           // Any incoming transfers
    hasOutgoing: boolean;           // Any outgoing transfers
    uniqueCoinTypes: number;         // Number of different coin types involved
    senderBalanceChange: number;    // Sender's net balance change
}

/**
 * Result of object change analysis  
 */
interface ObjectAnalysis {
    created: number;
    deleted: number;
    mutated: number;
    transferred: number;
    isNftCreation: boolean;        // NFT-like object created
    isTokenMint: boolean;          // Token/coin object created
    isTokenBurn: boolean;          // Token/coin object deleted
}

/**
 * Result of event analysis
 */
interface EventAnalysis {
    eventTypes: string[];           // Types of events emitted
    isSwapEvent: boolean;          // Swap-related events detected
    isMintEvent: boolean;          // Mint events detected
    isBurnEvent: boolean;          // Burn events detected
    protocol?: string;              // Detected protocol name
}

/**
 * Analyze balance changes from transaction
 * Returns net changes per coin type and sender/receiver status
 */
function analyzeBalanceChanges(tx: SuiTransactionResponse): BalanceAnalysis {
    const balanceChanges = tx.balanceChanges || [];
    const sender = tx.transaction.data.sender;

    let suiChange = 0;
    const tokenChanges = new Map<string, number>();
    let hasIncoming = false;
    let hasOutgoing = false;
    let senderBalanceChange = 0;

    for (const change of balanceChanges) {
        const amount = parseInt(change.amount) || 0;
        const owner = change.owner.AddressOwner || change.owner.ObjectOwner || '';
        const coinType = change.coinType;

        const isSender = owner === sender;

        // Track SUI separately
        if (coinType === '0x2::sui::SUI' || coinType === 'SUI') {
            suiChange += amount;
            if (isSender) senderBalanceChange += amount;
        } else {
            const existing = tokenChanges.get(coinType) || 0;
            tokenChanges.set(coinType, existing + amount);
            if (isSender) senderBalanceChange += amount;
        }

        if (amount > 0) hasIncoming = true;
        if (amount < 0) hasOutgoing = true;
    }

    return {
        suiChange,
        tokenChanges,
        hasIncoming,
        hasOutgoing,
        uniqueCoinTypes: tokenChanges.size + 1,
        senderBalanceChange
    };
}

/**
 * Analyze object changes for mint/burn detection
 * Looks for creation/deletion patterns that indicate token operations
 */
function analyzeObjectChanges(tx: SuiTransactionResponse): ObjectAnalysis {
    const objectChanges = tx.objectChanges || [];

    let created = 0;
    let deleted = 0;
    let mutated = 0;
    let transferred = 0;
    let isNftCreation = false;
    let isTokenMint = false;
    let isTokenBurn = false;

    for (const change of objectChanges) {
        switch (change.type) {
            case 'created':
                created++;
                // Check if this looks like NFT creation
                const typeLower = change.objectType.toLowerCase();
                if (typeLower.includes('nft') ||
                    typeLower.includes('collectible') ||
                    typeLower.includes('cap::') ||
                    typeLower.includes('supply') ||
                    typeLower.includes('treasury')) {
                    isNftCreation = true;
                    isTokenMint = true;
                }
                break;
            case 'deleted':
                deleted++;
                // Check if this looks like token burn
                const deletedType = change.objectType.toLowerCase();
                if (deletedType.includes('burn') ||
                    deletedType.includes('treasury') ||
                    deletedType.includes('cap::')) {
                    isTokenBurn = true;
                }
                break;
            case 'mutated':
                mutated++;
                break;
            case 'transferred':
                transferred++;
                break;
        }
    }

    return {
        created,
        deleted,
        mutated,
        transferred,
        isNftCreation,
        isTokenMint,
        isTokenBurn
    };
}

/**
 * Analyze events for protocol detection and swap patterns
 */
function analyzeEvents(tx: SuiTransactionResponse): EventAnalysis {
    const events = tx.events || [];
    const eventTypes: string[] = [];
    let isSwapEvent = false;
    let isMintEvent = false;
    let isBurnEvent = false;
    let protocol: string | undefined;

    for (const event of events) {
        const eventType = event.type.toLowerCase();
        eventTypes.push(event.type);

        // Detect swap events from various protocols
        if (eventType.includes('swap') ||
            eventType.includes('exchange') ||
            eventType.includes('pool') ||
            eventType.includes('tick') ||
            eventType.includes('order')) {
            isSwapEvent = true;
        }

        // Detect mint events
        if (eventType.includes('mint') ||
            eventType.includes('new_coin') ||
            eventType.includes('coin_added')) {
            isMintEvent = true;
        }

        // Detect burn events
        if (eventType.includes('burn') ||
            eventType.includes('coin_removed')) {
            isBurnEvent = true;
        }

        // Identify protocol by package/module
        if (event.packageId) {
            if (event.transactionModule?.toLowerCase().includes('deepbook')) {
                protocol = 'DeepBook';
            } else if (event.transactionModule?.toLowerCase().includes('cetus')) {
                protocol = 'Cetus';
            } else if (event.transactionModule?.toLowerCase().includes('turbo')) {
                protocol = 'Turbos';
            }
        }
    }

    return {
        eventTypes,
        isSwapEvent,
        isMintEvent,
        isBurnEvent,
        protocol
    };
}

/**
 * Check if this is a simple SUI transfer
 * Simple transfer: single recipient, only SUI balance change
 */
function isSimpleTransfer(balance: BalanceAnalysis): boolean {
    // Only SUI involved
    if (balance.uniqueCoinTypes > 1) return false;

    // Has outgoing (sending SUI)
    if (!balance.hasOutgoing) return false;

    // Not a complex operation (no complex patterns)
    return true;
}

/**
 * Detect swap pattern from balance changes
 * Swap: multiple coin types with opposite changes, net ~0 for sender
 */
function isSwapPattern(balance: BalanceAnalysis): boolean {
    // Multiple coin types involved
    if (balance.uniqueCoinTypes < 2) return false;

    // Both incoming and outgoing
    if (!balance.hasIncoming || !balance.hasOutgoing) return false;

    // Swap typically has near-zero net change for sender
    // (sending one token, receiving another)
    return true;
}

/**
 * Detect buy pattern
 * Buy: Sender spends tokens/SUI to receive assets
 * Net decrease in token balance, assets received
 */
function isBuyPattern(balance: BalanceAnalysis): boolean {
    // Has outgoing (sending payment)
    if (!balance.hasOutgoing) return false;

    // Has incoming (receiving assets)
    if (!balance.hasIncoming) return false;

    // Not a swap (only SUI or single token involved)
    return balance.uniqueCoinTypes === 1;
}

/**
 * Detect sell pattern
 * Sell: Sender sends assets, receives tokens/SUI
 * Net increase in token balance, assets sent
 */
function isSellPattern(balance: BalanceAnalysis): boolean {
    // Has incoming (receiving payment)
    if (!balance.hasIncoming) return false;

    // Has outgoing (sending assets)
    if (!balance.hasOutgoing) return false;

    // Not a swap (only SUI or single token involved)
    return balance.uniqueCoinTypes === 1;
}

/**
 * Check if transaction is a direct SUI transfer
 * Simple case: TransferSui or PaySui with single recipient
 */
function isDirectSuiTransfer(tx: SuiTransactionResponse): boolean {
    const txData = tx.transaction.data.transaction;

    if (txData.kind === 'Single' && txData.transactions) {
        for (const cmd of txData.transactions) {
            if (cmd && typeof cmd === 'object') {
                // Check for direct SUI transfer
                if ('TransferSui' in cmd && !('TransferObjects' in cmd)) {
                    return true;
                }
                // Check for simple pay
                if ('PaySui' in cmd && !('Pay' in cmd)) {
                    const payCmd = cmd as Record<string, unknown>;
                    const recipients = payCmd.recipients as string[] | undefined;
                    // Single recipient simple pay
                    return !!(recipients && recipients.length === 1);
                }
            }
        }
    }

    return false;
}

/**
 * Get a user-friendly description of the transaction type
 */
function getTransactionTypeDescription(type: TransactionType): string {
    const descriptions: Record<TransactionType, string> = {
        buy: 'Purchased assets using SUI or tokens',
        sell: 'Sold assets for SUI or tokens',
        swap: 'Exchanged one asset for another',
        transfer: 'Transferred assets between addresses',
        mint: 'Created new tokens or NFTs',
        burn: 'Destroyed tokens or NFTs',
        call: 'Executed a smart contract interaction',
        unknown: 'Transaction type could not be determined'
    };

    return descriptions[type] || descriptions.unknown;
}

/**
 * Detect transaction type with comprehensive analysis
 * 
 * Detection Priority:
 * 1. Mint: Object creation with token/NFT characteristics
 * 2. Burn: Object deletion with burn characteristics
 * 3. Swap: Multiple coin types, bidirectional flow, or swap events
 * 4. Buy: SUI/tokens outgoing, assets incoming
 * 5. Sell: Assets outgoing, SUI/tokens incoming
 * 6. Transfer: Direct SUI/object transfer
 * 7. Call: Smart contract interaction (default)
 */
export function detectTransactionType(tx: SuiTransactionResponse): TransactionType {
    // Analyze all aspects of the transaction
    const balance = analyzeBalanceChanges(tx);
    const objects = analyzeObjectChanges(tx);
    const events = analyzeEvents(tx);

    // 1. Detect Mint
    // Mint: New tokens/NFTs created (not from transfer)
    if (objects.isTokenMint || objects.isNftCreation) {
        // Additional check: no incoming balance (minted from nothing)
        if (!balance.hasIncoming) {
            return 'mint';
        }
    }

    // 2. Detect Burn
    // Burn: Tokens destroyed (not transferred out)
    if (objects.isTokenBurn) {
        // Additional check: no outgoing to another address
        if (!balance.hasOutgoing || tx.balanceChanges?.length === 0) {
            return 'burn';
        }
    }

    // 3. Detect Swap
    // Swap: Multiple tokens exchanged
    if (events.isSwapEvent || isSwapPattern(balance)) {
        return 'swap';
    }

    // 4. Detect Buy
    // Buy: Sending payment, receiving assets
    if (isBuyPattern(balance)) {
        return 'buy';
    }

    // 5. Detect Sell
    // Sell: Sending assets, receiving payment
    if (isSellPattern(balance)) {
        return 'sell';
    }

    // 6. Detect Transfer
    // Simple SUI or object transfer
    if (isDirectSuiTransfer(tx)) {
        return 'transfer';
    }

    // 7. Default to Call
    // Complex smart contract interaction
    return 'call';
}

/**
 * Generate financial summary from transaction
 */
function generateFinancialSummary(
    tx: SuiTransactionResponse,
    type: TransactionType
): FinancialSummary {
    const balanceChanges = tx.balanceChanges || [];
    const sender = tx.transaction.data.sender;

    let primaryAsset: FinancialAsset | undefined;
    let secondaryAsset: FinancialAsset | undefined;
    let totalValueUSD: number | undefined;
    let isIncoming = false;

    // Analyze balance changes for financial summary
    const senderChanges = balanceChanges.filter(c =>
        (c.owner.AddressOwner === sender || c.owner.ObjectOwner === sender)
    );

    if (senderChanges.length > 0) {
        const incomingChanges = senderChanges.filter(c => parseInt(c.amount) > 0);
        const outgoingChanges = senderChanges.filter(c => parseInt(c.amount) < 0);

        if (incomingChanges.length > 0 && outgoingChanges.length === 0) {
            isIncoming = true;
            // Receiving assets (likely buy or mint)
            const incoming = incomingChanges[0];
            primaryAsset = {
                coinType: incoming.coinType,
                symbol: incoming.coinType.split('::').pop() || 'Unknown',
                name: incoming.coinType,
                amount: parseInt(incoming.amount) / 1_000_000_000
            };
        } else if (outgoingChanges.length > 0 && incomingChanges.length === 0) {
            isIncoming = false;
            // Sending assets (likely sell or burn)
            const outgoing = outgoingChanges[0];
            primaryAsset = {
                coinType: outgoing.coinType,
                symbol: outgoing.coinType.split('::').pop() || 'Unknown',
                name: outgoing.coinType,
                amount: Math.abs(parseInt(outgoing.amount)) / 1_000_000_000
            };
        } else if (incomingChanges.length > 0 && outgoingChanges.length > 0) {
            // Exchange (swap)
            const incoming = incomingChanges[0];
            const outgoing = outgoingChanges[0];

            primaryAsset = {
                coinType: outgoing.coinType,
                symbol: outgoing.coinType.split('::').pop() || 'Unknown',
                name: outgoing.coinType,
                amount: Math.abs(parseInt(outgoing.amount)) / 1_000_000_000
            };

            secondaryAsset = {
                coinType: incoming.coinType,
                symbol: incoming.coinType.split('::').pop() || 'Unknown',
                name: incoming.coinType,
                amount: parseInt(incoming.amount) / 1_000_000_000
            };
        }
    }

    return {
        type,
        typeDescription: getTransactionTypeDescription(type),
        primaryAsset,
        secondaryAsset,
        totalValueUSD,
        isIncoming
    };
}

/**
 * Get the sender address
 */
function getSender(tx: SuiTransactionResponse): string {
    return tx.transaction.data.sender;
}

/**
 * Extract recipients from transaction
 */
function getRecipients(tx: SuiTransactionResponse): Array<{ address: string; amount?: string }> {
    const recipients: Array<{ address: string; amount?: string }> = [];
    const sender = getSender(tx);

    for (const change of tx.balanceChanges || []) {
        if (change.owner.AddressOwner && change.owner.AddressOwner !== sender) {
            const existing = recipients.find(r => r.address === change.owner.AddressOwner);
            if (!existing) {
                recipients.push({ address: change.owner.AddressOwner, amount: change.amount });
            }
        }
    }

    const txData = tx.transaction.data.transaction;
    if (txData.kind === 'Single') {
        for (const txCmd of txData.transactions || []) {
            if (txCmd && typeof txCmd === 'object') {
                const transfer = txCmd as Record<string, unknown>;
                if (transfer.TransferSui) {
                    const suiTransfer = transfer.TransferSui as Record<string, unknown>;
                    const recipient = suiTransfer.recipient as string;
                    if (recipient && !recipients.find(r => r.address === recipient)) {
                        recipients.push({ address: recipient, amount: String(suiTransfer.amount || 0) });
                    }
                }
            }
        }
    }

    return recipients;
}

/**
 * Get objects involved in transaction
 */
function getObjects(tx: SuiTransactionResponse): Array<{ objectId: string; type: string; operation: string }> {
    return (tx.objectChanges || []).map(change => ({
        objectId: change.objectId,
        type: change.objectType,
        operation: change.type,
    }));
}

/**
 * Parse Move calls from programmable transaction
 */
function parseMoveCalls(tx: SuiTransactionResponse) {
    const moveCalls: Array<{
        package: string;
        module: string;
        function: string;
        description: string;
        plainEnglish: string;
        arguments: Array<{ type: string; value: string; plainEnglish: string }>;
    }> = [];

    const txData = tx.transaction.data.transaction;
    if (txData.kind === 'ProgrammableTransaction' && txData.transactions) {
        for (const cmd of txData.transactions) {
            if (cmd && typeof cmd === 'object') {
                const cmdRecord = cmd as Record<string, unknown>;
                if ('MoveFunction' in cmdRecord) {
                    const moveCall = cmdRecord.MoveFunction as Record<string, unknown>;
                    const funcName = (moveCall.function as string) || 'unknown';
                    const module = (moveCall.module as string) || 'unknown';
                    const packageId = (moveCall.package as string) || 'unknown';

                    const desc = MOVE_FUNCTION_DESCRIPTIONS[funcName];

                    moveCalls.push({
                        package: packageId,
                        module,
                        function: funcName,
                        description: desc?.description || `Calls ${module}.${funcName}`,
                        plainEnglish: desc?.plainEnglish || `Executes the ${module}.${funcName} function`,
                        arguments: [],
                    });
                }
            }
        }
    }

    return moveCalls;
}

/**
 * Generate plain English summary
 */
function generatePlainEnglish(tx: SuiTransactionResponse, blockberry?: BlockberryRawTransaction): string {
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const type = detectTransactionType(tx);
    const status = tx.effects?.status?.status || 'unknown';
    const senderTruncated = truncateAddress(sender);

    if (status !== 'success') {
        return `This transaction failed.`;
    }

    const parts: string[] = [];

    switch (type) {
        case 'transfer': {
            const txData = tx.transaction.data.transaction;
            const suiTransfer = (txData.transactions?.[0] as Record<string, unknown>)?.TransferSui as Record<string, unknown> | undefined;
            const suiAmount = suiTransfer?.amount;
            if (typeof suiAmount === 'number' && suiAmount > 0) {
                parts.push(`${senderTruncated} sent ${mistToSui(suiAmount).toFixed(4)} SUI`);
            } else {
                parts.push(`${senderTruncated} sent SUI coins`);
            }
            if (recipients.length > 0) {
                parts.push(`to ${recipients.map(r => truncateAddress(r.address)).join(' and ')}`);
            }
            break;
        }
        case 'buy': {
            parts.push(`${senderTruncated} purchased assets`);
            if (recipients.length > 0) {
                parts.push(`from ${recipients.map(r => truncateAddress(r.address)).join(' and ')}`);
            }
            break;
        }
        case 'sell': {
            parts.push(`${senderTruncated} sold assets`);
            if (recipients.length > 0) {
                parts.push(`to ${recipients.map(r => truncateAddress(r.address)).join(' and ')}`);
            }
            break;
        }
        case 'swap': {
            parts.push(`${senderTruncated} swapped assets`);
            break;
        }
        case 'mint': {
            parts.push(`${senderTruncated} minted new tokens or NFTs`);
            break;
        }
        case 'burn': {
            parts.push(`${senderTruncated} burned tokens or NFTs`);
            break;
        }
        case 'call': {
            const moveCalls = parseMoveCalls(tx);
            if (moveCalls.length > 0) {
                const firstCall = moveCalls[0];
                const desc = MOVE_FUNCTION_DESCRIPTIONS[firstCall.function];
                if (desc) {
                    parts.push(`${senderTruncated} ${desc.action}`);
                } else {
                    parts.push(`${senderTruncated} executed ${firstCall.module}.${firstCall.function}`);
                }
            } else {
                parts.push(`${senderTruncated} executed smart contract calls`);
            }
            break;
        }
        default:
            return `${senderTruncated} performed a transaction on the Sui blockchain.`;
    }

    // Add gas fee
    if (tx.effects?.gasUsed) {
        const gasUsed = tx.effects.gasUsed;
        const totalGas = parseInt(gasUsed.computationCost) + parseInt(gasUsed.storageCost) - parseInt(gasUsed.storageRebate);
        parts.push(`, paying ${mistToSui(totalGas).toFixed(6)} SUI in gas fees`);
    }

    return parts.join(' ') + '.';
}

/**
 * Generate technical summary
 */
function generateTechnicalSummary(tx: SuiTransactionResponse): string {
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const objects = getObjects(tx);
    const type = detectTransactionType(tx);

    const parts: string[] = [];
    parts.push(`Transaction type: ${type}`);
    parts.push(`Sender: ${sender}`);
    if (recipients.length > 0) {
        parts.push(`Recipients: ${recipients.map(r => r.address).join(', ')}`);
    }
    parts.push(`Objects involved: ${objects.length}`);
    parts.push(`Status: ${tx.effects?.status?.status || 'unknown'}`);

    return parts.join(' | ');
}

/**
 * Generate object summary
 */
function generateObjectSummary(tx: SuiTransactionResponse): string {
    const objects = getObjects(tx);
    if (objects.length === 0) return 'No objects were involved.';

    const created = objects.filter(o => o.operation === 'created').length;
    const modified = objects.filter(o => o.operation === 'mutated').length;
    const deleted = objects.filter(o => o.operation === 'deleted').length;
    const transferred = objects.filter(o => o.operation === 'transferred').length;

    const parts: string[] = [];
    if (created > 0) parts.push(`${created} created`);
    if (modified > 0) parts.push(`${modified} modified`);
    if (transferred > 0) parts.push(`${transferred} transferred`);
    if (deleted > 0) parts.push(`${deleted} deleted`);

    return parts.length > 0 ? parts.join(', ') + '.' : `${objects.length} objects involved.`;
}

/**
 * Generate gas summary
 */
function generateGasSummary(tx: SuiTransactionResponse): string {
    const gasUsed = tx.effects?.gasUsed || {
        computationCost: '0',
        storageCost: '0',
        storageRebate: '0',
    };

    const computationCost = parseInt(gasUsed.computationCost) || 0;
    const storageCost = parseInt(gasUsed.storageCost) || 0;
    const storageRebate = parseInt(gasUsed.storageRebate) || 0;
    const netFee = computationCost + storageCost - storageRebate;

    return `Gas: ${mistToSui(computationCost).toFixed(6)} SUI (computation) + ${mistToSui(storageCost).toFixed(6)} SUI (storage) - ${mistToSui(storageRebate).toFixed(6)} SUI (rebate) = ${mistToSui(netFee).toFixed(6)} SUI net`;
}

/**
 * Generate transaction type explanation
 * Explains what the transaction kind means and how it differs from other types
 */
function generateTransactionTypeExplanation(tx: SuiTransactionResponse): TransactionTypeExplanation {
    const txKind = tx.transaction.data.transaction.kind;

    // Get the explanation from our predefined dictionary
    const kindInfo = SUI_TRANSACTION_KINDS[txKind] || {
        displayName: txKind,
        description: `Transaction of type ${txKind}`,
        capabilities: ['Unknown transaction capabilities'],
        difference: 'Unable to compare with other transaction types'
    };

    // For programmable transactions, add specific context
    let simplifiedType = kindInfo.displayName;
    if (txKind === 'ProgrammableTransaction') {
        // Check for specific patterns to give more context
        const moveCalls = parseMoveCalls(tx);
        if (moveCalls.length > 0) {
            const firstCall = moveCalls[0];
            simplifiedType = `Smart Contract (${firstCall.module})`;
        } else {
            simplifiedType = 'Smart Contract (Complex Operation)';
        }
    }

    return {
        kind: txKind,
        simplifiedType,
        description: kindInfo.description,
        capabilities: kindInfo.capabilities,
        difference: kindInfo.difference
    };
}

/**
 * Extract protocol name from package ID
 */
function getProtocolName(packageId: string): string {
    const protocolMap: Record<string, string> = {
        '0x78633b3c519af1f210a3c02533c5a6595c20d39e2a0ad6b2a5652e029a737a88': 'DeFi Protocol',
        '0x951a01360d85b06722edf896852bf8005b81cdb26375235c935138987f629502': 'Sponsored Fund',
        '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809': 'DeepBook',
        '0x0000000000000000000000000000000000000000000000000000000000000001': 'DeepBook',
        '0x0000000000000000000000000000000000000000000000000000000000000002': 'Cetus',
        '0x0000000000000000000000000000000000000000000000000000000000000003': 'Turbos',
    };

    return protocolMap[packageId] || 'Custom Contract';
}

/**
 * Generate detailed transaction flow
 * Breaks down the step-by-step execution of the transaction
 */
function generateDetailedFlow(tx: SuiTransactionResponse): DetailedTransactionFlow {
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const objects = getObjects(tx);
    const moveCalls = parseMoveCalls(tx);
    const txKind = tx.transaction.data.transaction.kind;

    const executionSteps: ExecutionStep[] = [];
    let stepNumber = 1;

    // Step 1: Transaction Initiation
    executionSteps.push({
        stepNumber: stepNumber++,
        stepType: 'input',
        title: 'Transaction Initiated',
        description: `Transaction was initiated by sender ${truncateAddress(sender)}`,
        details: `Transaction kind: ${txKind}`,
        inputObjects: tx.balanceChanges?.map(b => b.owner.AddressOwner || '').filter(Boolean)
    });

    // Step 2: Gas Payment
    const gasUsed = tx.effects?.gasUsed;
    const gasPayment = mistToSui((parseInt(gasUsed?.computationCost || '0') + parseInt(gasUsed?.storageCost || '0')));
    executionSteps.push({
        stepNumber: stepNumber++,
        stepType: 'gas_payment',
        title: 'Gas Fee Payment',
        description: `${gasPayment.toFixed(6)} SUI paid for transaction execution`,
        details: `Computation: ${mistToSui(parseInt(gasUsed?.computationCost || '0')).toFixed(6)} SUI | Storage: ${mistToSui(parseInt(gasUsed?.storageCost || '0')).toFixed(6)} SUI`
    });

    // Step 3: Object Inputs
    if (objects.length > 0) {
        executionSteps.push({
            stepNumber: stepNumber++,
            stepType: 'input',
            title: 'Object Inputs Loaded',
            description: `${objects.length} object(s) loaded into transaction context`,
            details: objects.map(o => `${truncateAddress(o.objectId)} (${o.type.split('::').pop()})`).join(', '),
            inputObjects: objects.map(o => o.objectId)
        });
    }

    // Step 4: Move Calls (or explain why there are none)
    if (moveCalls.length > 0) {
        for (const call of moveCalls) {
            executionSteps.push({
                stepNumber: stepNumber++,
                stepType: 'command',
                title: `Execute: ${call.module}.${call.function}`,
                description: call.plainEnglish,
                details: `Package: ${truncateAddress(call.package)}`
            });
        }
    } else if (txKind === 'ProgrammableTransaction') {
        // Explain that programmable transactions can have implicit operations
        executionSteps.push({
            stepNumber: stepNumber++,
            stepType: 'command',
            title: 'Smart Contract Execution',
            description: 'Transaction executed smart contract logic with internal operations',
            details: 'Programmable transactions can modify objects without explicit Move function calls'
        });
    }

    // Step 5: Object Changes
    if (objects.length > 0) {
        const created = objects.filter(o => o.operation === 'created');
        const mutated = objects.filter(o => o.operation === 'mutated');
        const deleted = objects.filter(o => o.operation === 'deleted');
        const transferred = objects.filter(o => o.operation === 'transferred');

        if (mutated.length > 0) {
            executionSteps.push({
                stepNumber: stepNumber++,
                stepType: 'object_change',
                title: 'Object Modifications',
                description: `${mutated.length} object(s) were modified`,
                details: mutated.map(o => `${truncateAddress(o.objectId)}`).join(', '),
                changeType: 'mutated'
            });
        }

        if (created.length > 0) {
            executionSteps.push({
                stepNumber: stepNumber++,
                stepType: 'object_change',
                title: 'Object Creation',
                description: `${created.length} new object(s) created`,
                details: created.map(o => `${truncateAddress(o.objectId)}`).join(', '),
                changeType: 'created'
            });
        }

        if (deleted.length > 0) {
            executionSteps.push({
                stepNumber: stepNumber++,
                stepType: 'object_change',
                title: 'Object Deletion',
                description: `${deleted.length} object(s) deleted`,
                details: deleted.map(o => `${truncateAddress(o.objectId)}`).join(', '),
                changeType: 'deleted'
            });
        }

        if (transferred.length > 0) {
            executionSteps.push({
                stepNumber: stepNumber++,
                stepType: 'object_change',
                title: 'Object Transfers',
                description: `${transferred.length} object(s) transferred`,
                details: transferred.map(o => `${truncateAddress(o.objectId)}`).join(', '),
                changeType: 'transferred'
            });
        }
    }

    // Step 6: Value Flow
    if (tx.balanceChanges && tx.balanceChanges.length > 0) {
        const valueFlow: Array<{ from: string; to: string; asset: string; amount: string }> = [];

        for (const change of tx.balanceChanges) {
            const amount = parseInt(change.amount);
            const owner = change.owner.AddressOwner || '';
            const coinType = change.coinType;
            const symbol = coinType.split('::').pop() || 'Unknown';

            if (amount < 0) {
                valueFlow.push({
                    from: owner,
                    to: 'Transaction', // Burns/fees go to network
                    asset: symbol,
                    amount: `${mistToSui(Math.abs(amount)).toFixed(4)} ${symbol}`
                });
            } else if (amount > 0) {
                valueFlow.push({
                    from: 'Transaction',
                    to: owner,
                    asset: symbol,
                    amount: `${mistToSui(amount).toFixed(4)} ${symbol}`
                });
            }
        }

        if (valueFlow.length > 0) {
            executionSteps.push({
                stepNumber: stepNumber++,
                stepType: 'finalize',
                title: 'Value Transfer',
                description: `${valueFlow.length} balance change(s) processed`,
                details: valueFlow.map(v => `${truncateAddress(v.from)} → ${truncateAddress(v.to)}: ${v.amount}`).join(' | ')
            });
        }
    }

    // Step 7: Finalization
    const status = tx.effects?.status?.status || 'unknown';
    executionSteps.push({
        stepNumber: stepNumber++,
        stepType: 'finalize',
        title: 'Transaction Finalized',
        description: `Transaction ${status === 'success' ? 'succeeded' : 'failed'}`,
        details: status === 'success' ? 'All operations completed successfully' : `Error: ${tx.effects?.status?.error || 'Unknown error'}`
    });

    // Cross-contract calls
    const crossContractCalls = moveCalls.map(call => ({
        package: call.package,
        module: call.module,
        function: call.function,
        description: call.plainEnglish
    }));

    // Object lifecycle
    const objectLifecycle = objects.map(obj => ({
        objectId: obj.objectId,
        objectType: obj.type,
        operations: [obj.operation]
    }));

    // Protocol interactions
    const protocolInteractions = Array.from(new Set(moveCalls.map(call => getProtocolName(call.package))));

    // Entry point
    let entryPoint = 'User Transaction';
    if (moveCalls.length > 0) {
        entryPoint = `${getProtocolName(moveCalls[0].package)}: ${moveCalls[0].module}.${moveCalls[0].function}`;
    }

    // Execution summary
    let executionSummary = '';
    if (status === 'success') {
        if (objects.length > 0) {
            executionSummary = `Successfully modified ${objects.length} object(s) with ${crossContractCalls.length} smart contract call(s).`;
        } else {
            executionSummary = 'Transaction executed successfully.';
        }
    } else {
        executionSummary = `Transaction failed: ${tx.effects?.status?.error || 'Unknown error'}`;
    }

    return {
        entryPoint,
        totalSteps: executionSteps.length,
        executionSteps,
        crossContractCalls,
        objectLifecycle,
        valueFlow: tx.balanceChanges?.map(change => ({
            from: change.owner.AddressOwner || '',
            to: recipients[0]?.address || '',
            asset: change.coinType.split('::').pop() || 'Unknown',
            amount: `${mistToSui(Math.abs(parseInt(change.amount))).toFixed(4)} ${change.coinType.split('::').pop()}`
        })) || [],
        protocolInteractions: protocolInteractions.length > 0 ? protocolInteractions : ['Custom Protocol'],
        executionSummary
    };
}

/**
 * Generate flow nodes for visualization with comprehensive transaction flow
 */
function generateFlowNodes(tx: SuiTransactionResponse): FlowNode[] {
    const nodes: FlowNode[] = [];
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const moveCalls = parseMoveCalls(tx);
    const status = tx.effects?.status?.status || 'unknown';
    const txKind = tx.transaction.data.transaction.kind;

    // 1. Sender node - Transaction initiator
    nodes.push({
        id: 'sender',
        type: 'sender',
        label: 'Sender',
        address: sender,
        truncated: truncateAddress(sender),
    });

    // 2. Initiation node - Transaction created
    nodes.push({
        id: 'initiation',
        type: 'initiation',
        label: 'Transaction Created',
        annotation: 'Digest & signatures',
    });

    // 3. Verification node - Authentication verified
    nodes.push({
        id: 'verification',
        type: 'verification',
        label: 'Verification',
        annotation: 'Signature validated',
    });

    // 4. Processing node - Smart contract execution
    if (moveCalls.length > 0) {
        nodes.push({
            id: 'processing',
            type: 'processing',
            label: 'Processing',
            package: moveCalls[0]?.package,
            module: moveCalls[0]?.module,
            annotation: `${moveCalls.length} Move call(s)`,
        });
    } else if (txKind === 'Single') {
        // Direct transaction (TransferSui, PaySui, etc.)
        nodes.push({
            id: 'processing',
            type: 'processing',
            label: 'Processing',
            annotation: 'Direct operation',
        });
    }

    // 5. Confirmation node - Transaction finalized
    nodes.push({
        id: 'confirmation',
        type: 'confirmation',
        label: 'Confirmation',
        annotation: status === 'success' ? 'Status: Success' : 'Status: Failed',
    });

    // 6. Completion node - Result delivered
    if (recipients.length > 0) {
        nodes.push({
            id: 'completion',
            type: 'completion',
            label: 'Completion',
            annotation: `${recipients.length} recipient(s)`,
        });

        // 7. Recipient nodes
        recipients.forEach((recipient, index) => {
            nodes.push({
                id: `recipient-${index}`,
                type: 'recipient',
                label: 'Recipient',
                address: recipient.address,
                truncated: truncateAddress(recipient.address),
            });
        });
    }

    return nodes;
}

/**
 * Generate flow edges for visualization with comprehensive transaction flow
 */
function generateFlowEdges(tx: SuiTransactionResponse, type: TransactionType): FlowEdge[] {
    const edges: FlowEdge[] = [];
    const recipients = getRecipients(tx);
    const moveCalls = parseMoveCalls(tx);
    const status = tx.effects?.status?.status || 'unknown';

    // Step 1: Sender -> Initiation
    edges.push({
        id: 'sender-initiation',
        source: 'sender',
        target: 'initiation',
        label: 'Initiates transaction',
        type: 'initiate',
        animated: true,
    });

    // Step 2: Initiation -> Verification
    edges.push({
        id: 'initiation-verification',
        source: 'initiation',
        target: 'verification',
        label: 'Submit for validation',
        type: 'verify',
        animated: true,
    });

    // Step 3: Verification -> Processing
    edges.push({
        id: 'verification-processing',
        source: 'verification',
        target: 'processing',
        label: 'Execute operations',
        type: 'process',
        animated: true,
    });

    // Step 4: Processing -> Confirmation
    edges.push({
        id: 'processing-confirmation',
        source: 'processing',
        target: 'confirmation',
        label: status === 'success' ? 'Success' : 'Failed',
        type: status === 'success' ? 'confirm' : 'result',
        animated: true,
    });

    // Step 5: Confirmation -> Completion
    if (recipients.length > 0) {
        edges.push({
            id: 'confirmation-completion',
            source: 'confirmation',
            target: 'completion',
            label: 'Deliver result',
            type: 'transfer',
            animated: true,
        });

        // Step 6: Completion -> Each Recipient
        recipients.forEach((_, index) => {
            let transferLabel = 'Assets';
            if (type === 'transfer') transferLabel = 'SUI tokens';
            else if (type === 'swap') transferLabel = 'Swapped assets';
            else if (type === 'buy') transferLabel = 'Purchased assets';
            else if (type === 'sell') transferLabel = 'Payment received';
            else if (type === 'mint') transferLabel = 'Minted tokens';
            else if (type === 'burn') transferLabel = 'Burn confirmation';
            else if (type === 'call') transferLabel = 'Contract result';

            edges.push({
                id: `completion-recipient-${index}`,
                source: 'completion',
                target: `recipient-${index}`,
                label: transferLabel,
                type: 'transfer',
                animated: true,
            });
        });
    }

    return edges;
}

/**
 * Main translation function
 */
export function translateTransaction(tx: SuiTransactionResponse, blockberry?: BlockberryRawTransaction): TranslatedTransaction {
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const objects = getObjects(tx);
    const type = detectTransactionType(tx);
    const moveCalls = parseMoveCalls(tx);

    const gasUsed = tx.effects?.gasUsed || {
        computationCost: '0',
        storageCost: '0',
        storageRebate: '0',
        nonRefundableStorageFee: '0',
    };

    const computationCost = parseInt(gasUsed.computationCost) || 0;
    const storageCost = parseInt(gasUsed.storageCost) || 0;
    const storageRebate = parseInt(gasUsed.storageRebate) || 0;
    const nonRefundableStorageFee = parseInt(gasUsed.nonRefundableStorageFee) || 0;
    const gasFee = computationCost + storageCost;
    const netGasFee = gasFee - storageRebate;

    const objectStats = {
        created: objects.filter(o => o.operation === 'created').length,
        modified: objects.filter(o => o.operation === 'mutated').length,
        deleted: objects.filter(o => o.operation === 'deleted').length,
        transferred: objects.filter(o => o.operation === 'transferred').length,
    };

    return {
        digest: tx.digest,
        summary: generateTechnicalSummary(tx),
        technicalSummary: generateTechnicalSummary(tx),
        plainEnglish: generatePlainEnglish(tx, blockberry),
        objectSummary: generateObjectSummary(tx),
        gasSummary: generateGasSummary(tx),
        sender: {
            address: sender,
            truncated: truncateAddress(sender),
            type: 'sender',
        },
        recipients: recipients.map(r => ({
            address: r.address,
            truncated: truncateAddress(r.address),
            type: 'recipient' as const,
        })),
        assets: [],
        gasInfo: {
            gasUsed: computationCost,
            gasFee,
            gasFeeUSD: 0,
            storageRebate,
            netGasFee,
        },
        moveCalls,
        objects: objects.map(o => ({
            objectId: o.objectId,
            type: o.type,
            category: o.type.toLowerCase().includes('nft') ? 'nft' : o.type.toLowerCase().includes('coin') ? 'coin' : 'custom',
            operation: o.operation as 'created' | 'transferred' | 'mutated' | 'deleted',
        })),
        events: [],
        timestamp: tx.timestampMs && !isNaN(Number(tx.timestampMs)) ? new Date(Number(tx.timestampMs)).toISOString() : undefined,
        status: (tx.effects?.status?.status || 'unknown') as 'success' | 'failure',
        error: tx.effects?.status?.error,
        objectStats,
        transactionType: type,
        financialSummary: generateFinancialSummary(tx, type),
        transactionTypeExplanation: generateTransactionTypeExplanation(tx),
        detailedFlow: generateDetailedFlow(tx),
        flowNodes: generateFlowNodes(tx),
        flowEdges: generateFlowEdges(tx, type),
    };
}

/**
 * Get enhanced transaction data
 */
export async function getEnhancedTransaction(digest: string): Promise<TranslatedTransaction> {
    // Fetch from Sui RPC
    const txResponse = await suiRpcService.getTransactionBlock(digest);

    // Try to get enhanced data from Blockberry (optional)
    let blockberryData: BlockberryRawTransaction | null = null;
    try {
        blockberryData = await blockberryService.getRawTransaction(digest);
    } catch {
        // Blockberry is optional, continue without it
    }

    // Translate to human-readable format
    return translateTransaction(txResponse, blockberryData || undefined);
}

/**
 * Get transaction with validation
 */
export async function getTransaction(digest: string): Promise<TranslatedTransaction> {
    if (!digest || digest.trim() === '') {
        throw new NotFoundError('Transaction digest is required');
    }

    return getEnhancedTransaction(digest);
}
