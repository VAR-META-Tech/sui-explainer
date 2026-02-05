// Natural language translation engine for Sui transactions

import { SuiTransactionResponse } from '@/lib/sui/types';
import {
    TranslatedTransaction,
    TranslatedAddress,
    TranslatedAsset,
    GasInfo,
    MoveCallInfo,
    TranslatedObject,
    TranslatedEvent,
    FlowNode,
    FlowEdge,
    TransactionStep,
    TransactionType,
    FinancialSummary,
    FinancialAsset,
} from '@/types/visualization';
import { truncateAddress, mistToSui, formatGasFee, formatTimestamp } from '@/lib/utils/formatting';
import { isValidAddress } from '@/lib/utils/validation';

/**
 * Known Move function descriptions with plain English explanations
 */
const MOVE_FUNCTION_DESCRIPTIONS: Record<string, { description: string; plainEnglish: string; action: string }> = {
    'transfer': {
        description: 'Transfer an object to another address',
        plainEnglish: 'This function transfers ownership of a digital asset to another user.',
        action: 'transferred ownership of an asset',
    },
    'transfer_sui': {
        description: 'Transfer SUI coins',
        plainEnglish: 'This sends SUI cryptocurrency from one wallet to another.',
        action: 'sent SUI coins',
    },
    'pay': {
        description: 'Pay multiple recipients',
        plainEnglish: 'This distributes coins to multiple recipients in a single transaction.',
        action: 'made a payment to multiple recipients',
    },
    'pay_sui': {
        description: 'Pay SUI to multiple recipients',
        plainEnglish: 'This sends SUI coins to multiple recipients in one transaction.',
        action: 'sent SUI to multiple recipients',
    },
    'mint': {
        description: 'Mint new tokens or NFTs',
        plainEnglish: 'This creates new tokens or NFTs, adding them to the blockchain.',
        action: 'created new tokens or NFTs',
    },
    'burn': {
        description: 'Burn tokens',
        plainEnglish: 'This permanently removes tokens from circulation.',
        action: 'permanently removed tokens',
    },
    'swap': {
        description: 'Swap tokens on a DEX',
        plainEnglish: 'This exchanges one type of token for another using a decentralized exchange.',
        action: 'swapped tokens on a decentralized exchange',
    },
    'add_liquidity': {
        description: 'Add liquidity to a pool',
        plainEnglish: 'This adds funds to a liquidity pool for trading.',
        action: 'added funds to a liquidity pool',
    },
    'remove_liquidity': {
        description: 'Remove liquidity from a pool',
        plainEnglish: 'This withdraws funds from a liquidity pool.',
        action: 'withdrew funds from a liquidity pool',
    },
    'cancel_order': {
        description: 'Cancel a trading order',
        plainEnglish: 'This cancels a pending order on a decentralized exchange.',
        action: 'cancelled a trading order',
    },
    'place_order': {
        description: 'Place a trading order',
        plainEnglish: 'This creates a new order on a decentralized exchange.',
        action: 'placed a new trading order',
    },
    'create': {
        description: 'Create a new object',
        plainEnglish: 'This creates a new object on the blockchain.',
        action: 'created a new object',
    },
    'update': {
        description: 'Update an object',
        plainEnglish: 'This modifies an existing object.',
        action: 'updated an existing object',
    },
    'delete': {
        description: 'Delete an object',
        plainEnglish: 'This removes an object from the blockchain.',
        action: 'deleted an object',
    },
    'claim': {
        description: 'Claim assets',
        plainEnglish: 'This claims assets from a contract or pool.',
        action: 'claimed assets',
    },
    'deposit': {
        description: 'Deposit assets',
        plainEnglish: 'This deposits assets into a contract or pool.',
        action: 'deposited assets',
    },
    'withdraw': {
        description: 'Withdraw assets',
        plainEnglish: 'This withdraws assets from a contract or pool.',
        action: 'withdrew assets',
    },
};

/**
 * Package descriptions for common protocols
 */
const PACKAGE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
    'deepbook': {
        name: 'DeepBook',
        description: 'A decentralized order book on Sui',
    },
    'sui_system': {
        name: 'Sui System',
        description: 'Sui blockchain core protocol',
    },
    'sui': {
        name: 'Sui Core',
        description: 'Sui blockchain core functions',
    },
};

/**
 * Detect transaction type from transaction data
 */
function detectTransactionType(tx: SuiTransactionResponse): string {
    const kind = tx.transaction.data.transaction.kind;

    if (kind === 'ProgrammableTransaction') {
        return 'programmable';
    }

    if (kind === 'Single') {
        const txData = tx.transaction.data.transaction;
        if (txData.transactions && txData.transactions.length > 0) {
            const firstTx = txData.transactions[0] as Record<string, unknown>;
            if (firstTx.TransferSui) return 'transfer_sui';
            if (firstTx.TransferObjects) return 'transfer_objects';
            if (firstTx.Pay) return 'pay';
            if (firstTx.PaySui) return 'pay_sui';
            if (firstTx.Call) return 'call';
        }
    }

    return 'unknown';
}

/**
 * Get the sender address
 */
function getSender(tx: SuiTransactionResponse): string {
    return tx.transaction.data.sender;
}

/**
 * Get transaction ID
 */
function getDigest(tx: SuiTransactionResponse): string {
    return tx.digest;
}

/**
 * Extract recipients from transaction
 */
function getRecipients(tx: SuiTransactionResponse): Array<{ address: string; amount?: string; objectId?: string }> {
    const recipients: Array<{ address: string; amount?: string; objectId?: string }> = [];
    const sender = getSender(tx);

    // Check balance changes for recipients
    for (const change of tx.balanceChanges || []) {
        if (change.owner.AddressOwner && change.owner.AddressOwner !== sender) {
            const existing = recipients.find(r => r.address === change.owner.AddressOwner);
            if (!existing) {
                recipients.push({
                    address: change.owner.AddressOwner,
                    amount: change.amount,
                });
            }
        }
    }

    // Check for direct transfer recipients
    const txData = tx.transaction.data.transaction;
    if (txData.kind === 'Single') {
        for (const txCmd of txData.transactions || []) {
            if (txCmd && typeof txCmd === 'object') {
                const transfer = txCmd as Record<string, unknown>;
                if (transfer.TransferSui) {
                    const suiTransfer = transfer.TransferSui as Record<string, unknown>;
                    const recipient = suiTransfer.recipient as string;
                    if (recipient && !recipients.find(r => r.address === recipient)) {
                        recipients.push({
                            address: recipient,
                            amount: String(suiTransfer.amount || 0),
                        });
                    }
                }
                if (transfer.TransferObjects) {
                    const objTransfer = transfer.TransferObjects as Record<string, unknown>;
                    const objects = objTransfer.objects as Array<Record<string, unknown>>;
                    const recipient = objTransfer.recipient as string;
                    if (recipient && objects) {
                        for (const obj of objects) {
                            if (!recipients.find(r => r.address === recipient)) {
                                recipients.push({
                                    address: recipient,
                                    objectId: obj.objectId as string,
                                });
                            }
                        }
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
    const objects: Array<{ objectId: string; type: string; operation: string }> = [];

    for (const change of tx.objectChanges || []) {
        objects.push({
            objectId: change.objectId,
            type: change.objectType,
            operation: change.type,
        });
    }

    return objects;
}

/**
 * Get asset type from coin type
 */
function getAssetType(coinType: string): 'sui' | 'token' | 'nft' | 'object' {
    const lower = coinType.toLowerCase();
    if (lower.includes('sui::sui') || lower === '0x2::sui::sui') return 'sui';
    if (lower.includes('nft') || lower.includes('collectible')) return 'nft';
    return 'token';
}

/**
 * Generate step-by-step transaction breakdown
 */
function generateTransactionSteps(tx: SuiTransactionResponse): TransactionStep[] {
    const steps: TransactionStep[] = [];
    const sender = getSender(tx);
    const type = detectTransactionType(tx);
    const status = tx.effects?.status?.status || 'unknown';

    if (status !== 'success') {
        steps.push({
            id: 'failed',
            type: 'action',
            title: 'Transaction Failed',
            description: 'This transaction did not complete successfully.',
        });
        return steps;
    }

    const senderLabel = truncateAddress(sender);

    switch (type) {
        case 'transfer_sui': {
            const txData = tx.transaction.data.transaction;
            const transferCmd = (txData.transactions?.[0] as Record<string, unknown>)?.TransferSui as Record<string, unknown> | undefined;
            const amount = transferCmd?.amount as number | undefined;
            const recipient = transferCmd?.recipient as string | undefined;

            if (amount && recipient) {
                steps.push({
                    id: 'send-sui',
                    type: 'transfer',
                    title: `Sent ${mistToSui(amount).toFixed(4)} SUI`,
                    description: `${senderLabel} sent ${mistToSui(amount).toFixed(4)} SUI`,
                    from: sender,
                    to: recipient,
                    amount: `${mistToSui(amount).toFixed(4)} SUI`,
                    asset: 'SUI',
                    assetType: 'sui',
                });
            }
            break;
        }

        case 'pay':
        case 'pay_sui': {
            const txData = tx.transaction.data.transaction;
            for (const cmd of txData.transactions || []) {
                if (cmd && typeof cmd === 'object') {
                    const payCmd = cmd as Record<string, unknown>;
                    const recipients = payCmd.recipients as string[] | undefined;
                    const amounts = payCmd.amounts as number[] | undefined;

                    if (recipients && amounts) {
                        for (let i = 0; i < recipients.length; i++) {
                            const amount = amounts[i];
                            const recipient = recipients[i];
                            if (amount && recipient) {
                                steps.push({
                                    id: `pay-${i}`,
                                    type: 'transfer',
                                    title: `Sent ${mistToSui(amount).toFixed(4)} SUI`,
                                    description: `${senderLabel} sent ${mistToSui(amount).toFixed(4)} SUI to ${truncateAddress(recipient)}`,
                                    from: sender,
                                    to: recipient,
                                    amount: `${mistToSui(amount).toFixed(4)} SUI`,
                                    asset: 'SUI',
                                    assetType: 'sui',
                                });
                            }
                        }
                    }
                }
            }
            break;
        }

        case 'transfer_objects': {
            const txData = tx.transaction.data.transaction;
            for (const cmd of txData.transactions || []) {
                if (cmd && typeof cmd === 'object') {
                    const transferCmd = cmd as Record<string, unknown>;
                    const recipient = transferCmd.recipient as string | undefined;
                    const objects = transferCmd.objects as Array<{ objectId: string }> | undefined;

                    if (recipient && objects) {
                        for (let i = 0; i < objects.length; i++) {
                            const obj = objects[i];
                            steps.push({
                                id: `transfer-${i}`,
                                type: 'transfer',
                                title: 'Transferred Object',
                                description: `${senderLabel} transferred an object to ${truncateAddress(recipient)}`,
                                from: sender,
                                to: recipient,
                                asset: obj.objectId,
                                assetType: 'object',
                                details: obj.objectId,
                            });
                        }
                    }
                }
            }
            break;
        }

        case 'programmable': {
            const txData = tx.transaction.data.transaction;
            if (txData.kind === 'ProgrammableTransaction' && txData.transactions) {
                // Add input assets
                const inputs = txData.inputs as Array<Record<string, unknown>> | undefined;
                if (inputs) {
                    for (let i = 0; i < inputs.length; i++) {
                        const input = inputs[i];
                        const objectId = input.objectId as string | undefined;
                        const coinType = input.coinType as string | undefined;
                        const value = input.value as number | undefined;

                        if (objectId && coinType) {
                            const assetType = getAssetType(coinType);
                            steps.push({
                                id: `input-${i}`,
                                type: 'input',
                                title: 'Provided Input',
                                description: `${senderLabel} provided ${objectId.substring(0, 10)}... as input`,
                                from: sender,
                                asset: objectId,
                                assetType,
                                details: coinType,
                            });
                        } else if (value && coinType) {
                            steps.push({
                                id: `input-${i}`,
                                type: 'input',
                                title: 'Provided Input',
                                description: `${senderLabel} provided ${mistToSui(value).toFixed(4)} ${coinType.split('::').pop()}`,
                                from: sender,
                                amount: `${mistToSui(value).toFixed(4)} ${coinType.split('::').pop()}`,
                                asset: coinType.split('::').pop() || 'Token',
                                assetType: getAssetType(coinType),
                            });
                        }
                    }
                }

                // Add Move function calls
                const moveCalls = txData.transactions.filter((cmd): cmd is Record<string, unknown> =>
                    cmd && typeof cmd === 'object' && 'MoveFunction' in cmd
                );

                for (let i = 0; i < moveCalls.length; i++) {
                    const moveCall = moveCalls[i].MoveFunction as Record<string, unknown>;
                    const funcName = (moveCall?.function as string) || 'unknown';
                    const module = (moveCall?.module as string) || 'unknown';
                    const desc = MOVE_FUNCTION_DESCRIPTIONS[funcName];

                    steps.push({
                        id: `call-${i}`,
                        type: 'action',
                        title: `Called ${module}.${funcName}`,
                        description: desc
                            ? `${senderLabel} ${desc.action}`
                            : `${senderLabel} called ${module}.${funcName}`,
                        from: sender,
                        details: desc?.plainEnglish || `Executed ${module}::${funcName}`,
                    });
                }

                // Add balance changes as outputs
                for (const change of tx.balanceChanges || []) {
                    const amount = parseInt(change.amount);
                    if (!isNaN(amount) && amount !== 0) {
                        const owner = change.owner.AddressOwner;
                        const isSender = owner === sender;
                        const coinType = change.coinType;
                        const assetName = coinType.split('::').pop() || 'Token';
                        const assetType = getAssetType(coinType);

                        if (isSender) {
                            steps.push({
                                id: `output-${change.coinType}`,
                                type: 'output',
                                title: `Sent ${mistToSui(Math.abs(amount)).toFixed(4)} ${assetName}`,
                                description: `${senderLabel} sent ${mistToSui(Math.abs(amount)).toFixed(4)} ${assetName}`,
                                from: sender,
                                amount: `${mistToSui(Math.abs(amount)).toFixed(4)} ${assetName}`,
                                asset: assetName,
                                assetType,
                            });
                        } else if (owner) {
                            steps.push({
                                id: `output-${change.coinType}-${owner}`,
                                type: 'output',
                                title: `Received ${mistToSui(Math.abs(amount)).toFixed(4)} ${assetName}`,
                                description: `${truncateAddress(owner)} received ${mistToSui(Math.abs(amount)).toFixed(4)} ${assetName}`,
                                to: owner,
                                amount: `${mistToSui(Math.abs(amount)).toFixed(4)} ${assetName}`,
                                asset: assetName,
                                assetType,
                            });
                        }
                    }
                }
            }
            break;
        }
    }

    // Add gas fee step
    const gasUsed = tx.effects?.gasUsed;
    if (gasUsed) {
        const totalGas = parseInt(gasUsed.computationCost) + parseInt(gasUsed.storageCost) - parseInt(gasUsed.storageRebate);
        steps.push({
            id: 'gas',
            type: 'action',
            title: 'Paid Gas Fee',
            description: `${senderLabel} paid ${mistToSui(totalGas).toFixed(6)} SUI in gas fees`,
            from: sender,
            amount: `${mistToSui(totalGas).toFixed(6)} SUI`,
            asset: 'SUI',
            assetType: 'sui',
        });
    }

    return steps;
}

/**
 * Generate comprehensive human-readable summary
 */
function generateSummary(tx: SuiTransactionResponse): string {
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const objects = getObjects(tx);
    const type = detectTransactionType(tx);
    const status = tx.effects?.status?.status || 'unknown';

    const parts: string[] = [];
    parts.push(`Transaction ${status === 'success' ? 'succeeded' : 'failed'}`);
    parts.push(`From: ${truncateAddress(sender)}`);

    if (recipients.length > 0) {
        parts.push(`To: ${recipients.map(r => truncateAddress(r.address)).join(', ')}`);
    }

    switch (type) {
        case 'transfer_sui':
            parts.push('Transferred SUI coins');
            break;
        case 'pay':
        case 'pay_sui':
            parts.push(`Made payment to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`);
            break;
        case 'transfer_objects':
            parts.push(`Transferred ${objects.length} object${objects.length !== 1 ? 's' : ''}`);
            break;
        case 'programmable':
            parts.push('Executed smart contract call(s)');
            break;
    }

    // Add object counts
    const created = objects.filter(o => o.operation === 'created').length;
    const modified = objects.filter(o => o.operation === 'mutated').length;
    const deleted = objects.filter(o => o.operation === 'deleted').length;

    if (created > 0 || modified > 0 || deleted > 0) {
        const objectParts: string[] = [];
        if (created > 0) objectParts.push(`${created} created`);
        if (modified > 0) objectParts.push(`${modified} modified`);
        if (deleted > 0) objectParts.push(`${deleted} deleted`);
        parts.push(`Objects: ${objectParts.join(', ')}`);
    }

    // Add gas info
    if (tx.effects?.gasUsed) {
        const gasUsed = tx.effects.gasUsed;
        const totalGas = parseInt(gasUsed.computationCost) + parseInt(gasUsed.storageCost);
        parts.push(`Gas used: ${formatGasFee(totalGas)}`);
    }

    return parts.join(' | ');
}

/**
 * Generate plain English description
 */
function generatePlainEnglish(tx: SuiTransactionResponse): string {
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const objects = getObjects(tx);
    const type = detectTransactionType(tx);
    const status = tx.effects?.status?.status || 'unknown';

    if (status !== 'success') {
        return `This transaction failed.`;
    }

    const senderTruncated = truncateAddress(sender);
    const parts: string[] = [];

    // Determine the main action
    switch (type) {
        case 'transfer_sui':
            const suiTransfer = (tx.transaction.data.transaction.transactions?.[0] as Record<string, unknown>)?.TransferSui as Record<string, unknown> | undefined;
            const suiAmount = suiTransfer?.amount;
            if (typeof suiAmount === 'number' && suiAmount > 0) {
                parts.push(`${senderTruncated} sent ${mistToSui(suiAmount).toFixed(4)} SUI`);
            } else {
                parts.push(`${senderTruncated} sent SUI coins`);
            }
            if (recipients.length > 0) {
                const recipientNames = recipients.map(r => truncateAddress(r.address)).join(' and ');
                parts.push(`to ${recipientNames}`);
            }
            break;

        case 'pay':
        case 'pay_sui':
            parts.push(`${senderTruncated} made a payment`);
            if (recipients.length > 0) {
                parts.push(`to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`);
            }
            break;

        case 'transfer_objects':
            parts.push(`${senderTruncated} transferred`);
            if (objects.length === 1) {
                parts.push(`an object`);
            } else if (objects.length > 1) {
                parts.push(`${objects.length} objects`);
            }
            if (recipients.length > 0) {
                parts.push(`to ${recipients.map(r => truncateAddress(r.address)).join(', ')}`);
            }
            break;

        case 'programmable':
            const txData = tx.transaction.data.transaction;
            if (txData.kind === 'ProgrammableTransaction' && txData.transactions) {
                const moveCalls = txData.transactions.filter((cmd): cmd is Record<string, unknown> =>
                    cmd && typeof cmd === 'object' && 'MoveFunction' in cmd
                );

                if (moveCalls.length > 0) {
                    const firstCall = moveCalls[0].MoveFunction as Record<string, unknown>;
                    const funcName = (firstCall?.function as string) || 'unknown';
                    const module = (firstCall?.module as string) || 'unknown';

                    // Use known descriptions
                    const desc = MOVE_FUNCTION_DESCRIPTIONS[funcName];
                    if (desc) {
                        parts.push(`${senderTruncated} ${desc.action}`);
                    } else {
                        parts.push(`${senderTruncated} executed the ${module}.${funcName} function`);
                    }

                    // Add more details about additional operations
                    if (moveCalls.length > 1) {
                        parts.push(`and ${moveCalls.length - 1} additional operation${moveCalls.length - 1 !== 1 ? 's' : ''}`);
                    }
                } else {
                    parts.push(`${senderTruncated} executed smart contract calls`);
                }
            }
            break;

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
 * Generate object creation and modification summary
 */
function generateObjectSummary(tx: SuiTransactionResponse): string {
    const objects = getObjects(tx);

    if (objects.length === 0) {
        return 'No objects were involved in this transaction.';
    }

    const created = objects.filter(o => o.operation === 'created');
    const modified = objects.filter(o => o.operation === 'mutated');
    const deleted = objects.filter(o => o.operation === 'deleted');
    const transferred = objects.filter(o => o.operation === 'transferred');

    const parts: string[] = [];

    if (created.length > 0) {
        const nfts = created.filter(o => o.type.toLowerCase().includes('nft') || o.type.toLowerCase().includes('collectible'));
        const coins = created.filter(o => o.type.toLowerCase().includes('coin'));
        const custom = created.filter(o => nfts.indexOf(o) === -1 && coins.indexOf(o) === -1);

        if (nfts.length > 0) {
            parts.push(`${nfts.length} new NFT${nfts.length !== 1 ? 's' : ''} created`);
        }
        if (coins.length > 0) {
            parts.push(`${coins.length} new coin object${coins.length !== 1 ? 's' : ''} created`);
        }
        if (custom.length > 0) {
            parts.push(`${custom.length} new custom object${custom.length !== 1 ? 's' : ''} created`);
        }
    }

    if (modified.length > 0) {
        parts.push(`${modified.length} existing object${modified.length !== 1 ? 's' : ''} modified`);
    }

    if (transferred.length > 0) {
        parts.push(`${transferred.length} object${transferred.length !== 1 ? 's' : ''} transferred`);
    }

    if (deleted.length > 0) {
        parts.push(`${deleted.length} object${deleted.length !== 1 ? 's' : ''} deleted`);
    }

    if (parts.length === 0) {
        return `${objects.length} object${objects.length !== 1 ? 's were' : ' was'} involved in this transaction.`;
    }

    return `${parts.join(', ')}.`;
}

/**
 * Generate detailed gas and resource usage summary
 */
function generateGasSummary(tx: SuiTransactionResponse): string {
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

    const totalUsed = computationCost + storageCost;
    const netFee = totalUsed - storageRebate;

    const parts: string[] = [];

    // Gas used breakdown
    parts.push(`Gas used: ${mistToSui(totalUsed).toFixed(6)} SUI`);
    parts.push(`(Computation: ${mistToSui(computationCost).toFixed(6)} SUI, Storage: ${mistToSui(storageCost).toFixed(6)} SUI)`);

    // Storage rebate
    if (storageRebate > 0) {
        parts.push(`Storage rebate: +${mistToSui(storageRebate).toFixed(6)} SUI (returned to sender)`);
    }

    // Net fee
    parts.push(`Net gas fee: ${mistToSui(netFee).toFixed(6)} SUI`);

    // Non-refundable fee
    if (nonRefundableStorageFee > 0) {
        parts.push(`Non-refundable storage fee: ${mistToSui(nonRefundableStorageFee).toFixed(6)} SUI`);
    }

    return parts.join('\n');
}

/**
 * Extract addresses from transaction
 */
function extractAddresses(tx: SuiTransactionResponse): TranslatedAddress[] {
    const addresses: TranslatedAddress[] = [];
    const sender = getSender(tx);

    addresses.push({
        address: sender,
        truncated: truncateAddress(sender),
        type: 'sender',
    });

    const recipients = getRecipients(tx);
    for (const recipient of recipients) {
        const existing = addresses.find(a => a.address === recipient.address);
        if (!existing) {
            addresses.push({
                address: recipient.address,
                truncated: truncateAddress(recipient.address),
                type: 'recipient',
            });
        }
    }

    return addresses;
}

/**
 * Extract assets from transaction
 */
function extractAssets(tx: SuiTransactionResponse): TranslatedAsset[] {
    const assets: TranslatedAsset[] = [];

    for (const change of tx.balanceChanges || []) {
        const amountNum = parseInt(change.amount);
        if (!isNaN(amountNum) && amountNum !== 0) {
            const isSui = change.coinType === '0x2::sui::SUI';
            assets.push({
                type: isSui ? 'coin' : 'custom',
                name: isSui ? 'SUI' : change.coinType.split('::').pop() || 'Token',
                symbol: isSui ? 'SUI' : undefined,
                amount: mistToSui(Math.abs(amountNum)),
                coinType: change.coinType,
            });
        }
    }

    return assets;
}

/**
 * Calculate gas information
 */
function extractGasInfo(tx: SuiTransactionResponse): GasInfo {
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

    const totalUsed = computationCost + storageCost;
    const netFee = totalUsed - storageRebate;

    // Approximate USD value (SUI price varies, using estimate)
    const suiPriceEstimate = 1.0;
    const gasFeeUSD = mistToSui(netFee) * suiPriceEstimate;

    return {
        gasUsed: totalUsed,
        gasFee: totalUsed,
        gasFeeUSD,
        storageRebate,
        netGasFee: netFee,
    };
}

/**
 * Extract Move calls from transaction
 */
function extractMoveCalls(tx: SuiTransactionResponse): MoveCallInfo[] {
    const calls: MoveCallInfo[] = [];
    const txData = tx.transaction.data.transaction;

    if (txData.kind === 'ProgrammableTransaction' && txData.transactions) {
        for (const cmd of txData.transactions) {
            if (cmd && typeof cmd === 'object' && 'MoveFunction' in cmd) {
                const func = (cmd as Record<string, unknown>).MoveFunction as Record<string, unknown>;
                const funcName = String(func.function);
                const module = String(func.module);
                const key = `${module}_${funcName}`;

                const desc = MOVE_FUNCTION_DESCRIPTIONS[key] || {
                    description: 'Custom Move function',
                    plainEnglish: 'This executes a custom function on the Sui blockchain.',
                };

                const args = (func.arguments as Array<Record<string, unknown>>) || [];

                calls.push({
                    package: String(func.package),
                    module,
                    function: funcName,
                    description: desc.description,
                    plainEnglish: desc.plainEnglish,
                    arguments: args.map((arg) => ({
                        type: String(arg.type || 'unknown'),
                        value: JSON.stringify(arg.value || arg.objectId || 'unknown'),
                        plainEnglish: 'An argument was provided to this function.',
                    })),
                    typeArguments: func.typeArguments as string[],
                });
            }
        }
    }

    return calls;
}

/**
 * Extract objects from transaction
 */
function extractObjects(tx: SuiTransactionResponse): TranslatedObject[] {
    const objects: TranslatedObject[] = [];

    for (const change of tx.objectChanges || []) {
        const category = categorizeObjectType(change.objectType);
        let operation: 'created' | 'transferred' | 'mutated' | 'deleted' = 'created';

        if (change.type === 'mutated') operation = 'mutated';
        else if (change.type === 'deleted') operation = 'deleted';
        else if (change.type === 'created') operation = 'created';
        else if (change.type === 'transferred') operation = 'transferred';

        objects.push({
            objectId: change.objectId,
            type: change.objectType,
            category,
            operation,
        });
    }

    return objects;
}

/**
 * Categorize object type
 */
function categorizeObjectType(type: string): 'nft' | 'coin' | 'custom' | 'package' {
    const lower = type.toLowerCase();
    if (lower.includes('nft') || lower.includes('collectible') || lower.includes('collectable')) return 'nft';
    if (lower.includes('coin') || lower.includes('sui::sui')) return 'coin';
    if (lower.includes('package')) return 'package';
    return 'custom';
}

/**
 * Extract events from transaction
 */
function extractEvents(tx: SuiTransactionResponse): TranslatedEvent[] {
    return (tx.events || []).map(event => ({
        type: event.type,
        sender: event.sender,
        module: event.transactionModule,
        description: generateEventDescription(event),
        plainEnglish: generateEventDescription(event),
    }));
}

/**
 * Generate event description
 */
function generateEventDescription(event: { type: string; transactionModule: string }): string {
    const eventName = event.type.split('::').pop() || 'Event';
    return `A "${eventName}" event was emitted by the ${event.transactionModule} module.`;
}

/**
 * Generate flow nodes for visualization
 */
function generateFlowNodes(tx: SuiTransactionResponse): FlowNode[] {
    const nodes: FlowNode[] = [];
    const sender = getSender(tx);
    const recipients = getRecipients(tx);

    // Sender node
    nodes.push({
        id: 'sender',
        type: 'sender',
        label: 'Sender',
        address: sender,
        truncated: truncateAddress(sender),
    });

    // Recipient nodes
    recipients.forEach((recipient, index) => {
        nodes.push({
            id: `recipient-${index}`,
            type: 'recipient',
            label: 'Recipient',
            address: recipient.address,
            truncated: truncateAddress(recipient.address),
        });
    });

    // Smart contract node if there are Move calls
    const moveCalls = extractMoveCalls(tx);
    if (moveCalls.length > 0) {
        nodes.push({
            id: 'contract',
            type: 'contract',
            label: 'Smart Contract',
            package: moveCalls[0]?.package,
            module: moveCalls[0]?.module,
        });
    }

    return nodes;
}

/**
 * Generate flow edges for visualization
 */
function generateFlowEdges(tx: SuiTransactionResponse): FlowEdge[] {
    const edges: FlowEdge[] = [];
    const sender = getSender(tx);
    const recipients = getRecipients(tx);
    const moveCalls = extractMoveCalls(tx);

    // Sender to contract
    if (moveCalls.length > 0) {
        edges.push({
            id: 'sender-contract',
            source: 'sender',
            target: 'contract',
            label: 'Execute',
            type: 'action',
        });
    }

    // Sender to recipients
    recipients.forEach((recipient, index) => {
        const type = detectTransactionType(tx);
        let label = 'Transfer';
        if (type === 'transfer_sui') label = 'Send SUI';
        else if (type === 'transfer_objects') label = 'Transfer Object';
        else if (type === 'pay' || type === 'pay_sui') label = 'Payment';

        edges.push({
            id: `sender-recipient-${index}`,
            source: 'sender',
            target: `recipient-${index}`,
            label,
            type: 'transfer',
        });
    });

    // Contract to recipients (if applicable)
    if (moveCalls.length > 0 && recipients.length > 0) {
        recipients.forEach((_, index) => {
            edges.push({
                id: `contract-recipient-${index}`,
                source: 'contract',
                target: `recipient-${index}`,
                label: 'Output',
                type: 'result',
            });
        });
    }

    return edges;
}

/**
 * Estimate USD value for a coin type
 */
function estimateUSDValue(coinType: string, amountMIST: number): number {
    // SUI price estimate (can be updated with real API data)
    const suiPriceUSD = 1.0;

    const lower = coinType.toLowerCase();

    // SUI
    if (lower.includes('sui::sui') || lower === '0x2::sui::sui') {
        return mistToSui(amountMIST) * suiPriceUSD;
    }

    // USDC (assume 1:1 peg)
    if (lower.includes('usdc') || lower.includes('stable') || lower.includes('usd')) {
        return mistToSui(amountMIST) * 1.0;
    }

    // For other tokens, return 0 (would need external price oracle)
    return 0;
}

/**
 * Get coin symbol from coin type
 */
function getCoinSymbol(coinType: string): string {
    const parts = coinType.split('::');
    return parts[parts.length - 1] || 'Token';
}

/**
 * Analyze transaction to determine its financial type (buy, sell, swap, transfer, etc.)
 * and extract financial details
 */
function analyzeFinancialTransaction(tx: SuiTransactionResponse): FinancialSummary {
    const sender = getSender(tx);
    const status = tx.effects?.status?.status || 'unknown';

    if (status !== 'success') {
        return {
            type: 'unknown',
            typeDescription: 'Failed transaction',
            isIncoming: false,
        };
    }

    const balanceChanges = tx.balanceChanges || [];
    const txData = tx.transaction.data.transaction;

    // Collect all assets involved
    const assets: FinancialAsset[] = [];

    for (const change of balanceChanges) {
        const amount = parseInt(change.amount);
        if (!isNaN(amount) && amount !== 0) {
            const valueUSD = estimateUSDValue(change.coinType, Math.abs(amount));
            assets.push({
                coinType: change.coinType,
                symbol: getCoinSymbol(change.coinType),
                name: change.coinType.split('::').pop() || 'Token',
                amount: mistToSui(Math.abs(amount)),
                valueUSD,
            });
        }
    }

    // Get Move calls to determine transaction type
    let txType: TransactionType = 'transfer';
    let typeDescription = 'Transfer';

    if (txData.kind === 'ProgrammableTransaction' && txData.transactions) {
        const moveCalls = txData.transactions.filter((cmd): cmd is Record<string, unknown> =>
            cmd && typeof cmd === 'object' && 'MoveFunction' in cmd
        );

        for (const cmd of moveCalls) {
            const func = (cmd as Record<string, unknown>).MoveFunction as Record<string, unknown>;
            const funcName = (func?.function as string) || '';
            const module = (func?.module as string) || '';

            // Detect swap transactions
            if (funcName === 'swap' || funcName === 'swapExact' || funcName.includes('swap')) {
                txType = 'swap';
                typeDescription = 'Token Swap';
                break;
            }

            // Detect mint (create) transactions
            if (funcName === 'mint' || funcName === 'create' || funcName === 'nft::mint') {
                txType = 'mint';
                typeDescription = 'Mint / Create';
                break;
            }

            // Detect burn transactions
            if (funcName === 'burn' || funcName === 'destroy') {
                txType = 'burn';
                typeDescription = 'Burn / Destroy';
                break;
            }

            // Detect DEX operations
            if (module.includes('dex') || module.includes('cetus') || module.includes('turbo') || module.includes('deepbook')) {
                if (funcName.includes('swap') || funcName.includes('exchange')) {
                    txType = 'swap';
                    typeDescription = 'Token Swap';
                } else if (funcName.includes('add_liquidity') || funcName.includes('remove_liquidity')) {
                    txType = 'swap';
                    typeDescription = 'Liquidity Operation';
                }
            }
        }
    }

    // Check for simple SUI transfers
    if (txData.kind === 'Single') {
        const transactions = txData.transactions || [];
        if (transactions.length === 1) {
            const txCmd = transactions[0] as Record<string, unknown>;
            if (txCmd.TransferSui) {
                txType = 'transfer';
                typeDescription = 'SUI Transfer';
            } else if (txCmd.Pay || txCmd.PaySui) {
                txType = 'transfer';
                typeDescription = 'Payment';
            } else if (txCmd.TransferObjects) {
                txType = 'transfer';
                typeDescription = 'Object Transfer';
            }
        }
    }

    // Determine if incoming or outgoing (for sender perspective)
    // Outgoing: sender sends value (negative balance change)
    // Incoming: sender receives value (positive balance change)
    let netValueUSD = 0;
    let senderSentValue = false;

    for (const asset of assets) {
        netValueUSD += asset.valueUSD || 0;
    }

    // For transfers, check if sender is sending to someone else
    const recipients = getRecipients(tx);
    if (recipients.length > 0 && txType === 'transfer') {
        // Sender is sending value out
        senderSentValue = true;
    }

    // For swaps, both input and output are involved
    const suiAssets = assets.filter(a => a.coinType.includes('sui::sui') || a.symbol === 'SUI');
    const otherAssets = assets.filter(a => !a.coinType.includes('sui::sui') && a.symbol !== 'SUI');

    let primaryAsset: FinancialAsset | undefined;
    let secondaryAsset: FinancialAsset | undefined;

    if (suiAssets.length > 0 && otherAssets.length > 0) {
        // Likely a swap involving SUI and another token
        primaryAsset = otherAssets[0];
        secondaryAsset = suiAssets[0];
    } else if (assets.length >= 2) {
        // Swap between two non-SUI tokens
        primaryAsset = assets[0];
        secondaryAsset = assets[1];
    } else if (assets.length === 1) {
        // Single asset transaction
        primaryAsset = assets[0];
    }

    // Calculate total value
    const totalValueUSD = assets.reduce((sum, asset) => sum + (asset.valueUSD || 0), 0);

    return {
        type: txType,
        typeDescription,
        primaryAsset,
        secondaryAsset,
        totalValueUSD,
        isIncoming: !senderSentValue && netValueUSD > 0,
    };
}

/**
 * Main translation function
 */
export function translateTransaction(tx: SuiTransactionResponse): TranslatedTransaction {
    const objects = getObjects(tx);
    const recipients = getRecipients(tx);
    const financialSummary = analyzeFinancialTransaction(tx);

    const created = objects.filter(o => o.operation === 'created').length;
    const modified = objects.filter(o => o.operation === 'mutated').length;
    const deleted = objects.filter(o => o.operation === 'deleted').length;

    return {
        digest: getDigest(tx),
        summary: generateSummary(tx),
        technicalSummary: `Transaction: ${getDigest(tx)}\nSender: ${getSender(tx)}\nStatus: ${tx.effects?.status?.status}`,
        plainEnglish: generatePlainEnglish(tx),
        objectSummary: generateObjectSummary(tx),
        gasSummary: generateGasSummary(tx),
        sender: {
            address: getSender(tx),
            truncated: truncateAddress(getSender(tx)),
            type: 'sender',
        },
        recipients: extractAddresses(tx).filter(a => a.type === 'recipient'),
        assets: extractAssets(tx),
        gasInfo: extractGasInfo(tx),
        moveCalls: extractMoveCalls(tx),
        objects: extractObjects(tx),
        events: extractEvents(tx),
        timestamp: tx.timestampMs ? formatTimestamp(parseInt(tx.timestampMs)) : undefined,
        status: (tx.effects?.status?.status as 'success' | 'failure') || 'success',
        error: tx.effects?.status?.status === 'failure' ? tx.effects?.status?.error : undefined,
        objectStats: {
            created,
            modified,
            deleted,
            transferred: objects.filter(o => o.operation === 'transferred').length,
        },
        flowNodes: generateFlowNodes(tx),
        flowEdges: generateFlowEdges(tx),
        steps: generateTransactionSteps(tx),
        transactionType: financialSummary.type,
        financialSummary,
    };
}
