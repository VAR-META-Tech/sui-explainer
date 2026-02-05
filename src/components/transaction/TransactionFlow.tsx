'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TranslatedTransaction, FlowNode as FlowNodeType, FlowEdge as FlowEdgeType } from '@/types/visualization';
import { truncateAddress } from '@/lib/utils/formatting';
import { User, Box, FileCode, Wallet, Play, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionFlowProps {
    transaction: TranslatedTransaction;
    className?: string;
}

// Custom node components for transaction flow
function SenderNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-xl shadow-lg min-w-[160px]">
            <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase">Sender</span>
            </div>
            <p className="font-mono text-sm text-gray-900 truncate">{data.truncated || truncateAddress(data.address || '')}</p>
        </div>
    );
}

function RecipientNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-4 py-3 bg-green-50 border-2 border-green-300 rounded-xl shadow-lg min-w-[160px]">
            <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold text-green-600 uppercase">Recipient</span>
            </div>
            <p className="font-mono text-sm text-gray-900 truncate">{data.truncated || truncateAddress(data.address || '')}</p>
        </div>
    );
}

function ContractNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-4 py-3 bg-purple-50 border-2 border-purple-300 rounded-xl shadow-lg min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <FileCode className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-600 uppercase">Smart Contract</span>
            </div>
            <p className="font-medium text-gray-900">{data.module}</p>
            <p className="font-mono text-xs text-gray-500">{data.package}</p>
        </div>
    );
}

function ObjectNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-3 py-2 bg-orange-50 border-2 border-orange-300 rounded-lg shadow min-w-[120px]">
            <div className="flex items-center gap-2">
                <Box className="h-3 w-3 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Object</span>
            </div>
            <p className="font-mono text-xs text-gray-600 truncate mt-1">{data.objectId}</p>
        </div>
    );
}

// New intermediate flow nodes
function InitiationNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-4 py-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl shadow-lg min-w-[160px]">
            <div className="flex items-center gap-2 mb-1">
                <Play className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-600 uppercase">Initiation</span>
            </div>
            <p className="font-medium text-gray-900">{data.label}</p>
            {data.annotation && (
                <p className="text-xs text-gray-500 mt-1">{data.annotation}</p>
            )}
        </div>
    );
}

function VerificationNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-4 py-3 bg-indigo-50 border-2 border-indigo-300 rounded-xl shadow-lg min-w-[160px]">
            <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600 uppercase">Verification</span>
            </div>
            <p className="font-medium text-gray-900">{data.label}</p>
            {data.annotation && (
                <p className="text-xs text-gray-500 mt-1">{data.annotation}</p>
            )}
        </div>
    );
}

function ProcessingNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-4 py-3 bg-purple-50 border-2 border-purple-300 rounded-xl shadow-lg min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-600 uppercase">Processing</span>
            </div>
            <p className="font-medium text-gray-900">{data.label}</p>
            {data.module && (
                <p className="text-sm text-gray-700 mt-1">{data.module}</p>
            )}
            {data.annotation && (
                <p className="text-xs text-gray-500 mt-1">{data.annotation}</p>
            )}
        </div>
    );
}

function ConfirmationNode({ data }: { data: FlowNodeType }) {
    const isSuccess = data.annotation?.includes('Success');
    return (
        <div className={`px-4 py-3 border-2 rounded-xl shadow-lg min-w-[160px] ${
            isSuccess ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
            <div className="flex items-center gap-2 mb-1">
                {isSuccess ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                    <ArrowRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-xs font-semibold uppercase ${
                    isSuccess ? 'text-green-600' : 'text-red-600'
                }`}>Confirmation</span>
            </div>
            <p className="font-medium text-gray-900">{data.label}</p>
            {data.annotation && (
                <p className={`text-xs mt-1 ${
                    isSuccess ? 'text-green-600' : 'text-red-600'
                }`}>{data.annotation}</p>
            )}
        </div>
    );
}

function CompletionNode({ data }: { data: FlowNodeType }) {
    return (
        <div className="px-4 py-3 bg-teal-50 border-2 border-teal-300 rounded-xl shadow-lg min-w-[160px]">
            <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-semibold text-teal-600 uppercase">Completion</span>
            </div>
            <p className="font-medium text-gray-900">{data.label}</p>
            {data.annotation && (
                <p className="text-xs text-gray-500 mt-1">{data.annotation}</p>
            )}
        </div>
    );
}

const nodeTypes = {
    sender: SenderNode,
    recipient: RecipientNode,
    contract: ContractNode,
    object: ObjectNode,
    initiation: InitiationNode,
    verification: VerificationNode,
    processing: ProcessingNode,
    confirmation: ConfirmationNode,
    completion: CompletionNode,
};

export function TransactionFlow({ transaction, className }: TransactionFlowProps) {
    const { flowNodes, flowEdges } = transaction;

    // Convert FlowNode/FlowEdge to React Flow Node/Edge
    const initialNodes: Node[] = useMemo(() => {
        if (!flowNodes || flowNodes.length === 0) return [];

        // Count recipients to adjust layout
        const recipientCount = flowNodes.filter(n => n.type === 'recipient').length;
        const recipientStartX = 900 + Math.max(0, (recipientCount - 1) * 50);

        return flowNodes.map((node) => {
            const baseNode: Node = {
                id: node.id,
                type: node.type,
                position: { x: 0, y: 0 },
                data: node,
            };

            // Position nodes in a horizontal flow layout
            switch (node.type) {
                case 'sender':
                    baseNode.position = { x: 50, y: 200 };
                    break;
                case 'initiation':
                    baseNode.position = { x: 250, y: 200 };
                    break;
                case 'verification':
                    baseNode.position = { x: 450, y: 200 };
                    break;
                case 'processing':
                    baseNode.position = { x: 650, y: 200 };
                    break;
                case 'confirmation':
                    baseNode.position = { x: 850, y: 200 };
                    break;
                case 'completion':
                    baseNode.position = { x: 1050, y: 200 };
                    break;
                case 'recipient':
                    const idx = flowNodes.filter(n => n.type === 'recipient').indexOf(node);
                    baseNode.position = { x: 1250, y: 100 + idx * 80 };
                    break;
                case 'contract':
                    baseNode.position = { x: 650, y: 200 };
                    break;
                default:
                    baseNode.position = { x: 300, y: 200 };
            }

            return baseNode;
        });
    }, [flowNodes]);

    const initialEdges: Edge[] = useMemo(() => {
        if (!flowEdges || flowEdges.length === 0) return [];

        return flowEdges.map((edge) => {
            // Determine edge color based on type
            const getEdgeColor = () => {
                switch (edge.type) {
                    case 'transfer': return '#22c55e';  // Green for asset transfers
                    case 'initiate': return '#f59e0b';  // Amber for initiation
                    case 'verify': return '#3b82f6';    // Blue for verification
                    case 'process': return '#8b5cf6';    // Purple for processing
                    case 'confirm': return '#10b981';     // Green for confirmation
                    case 'action': return '#3b82f6';      // Blue for actions
                    case 'result': return '#a855f7';       // Purple for results
                    default: return '#6b7280';            // Gray default
                }
            };

            const color = getEdgeColor();

            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                animated: edge.animated || edge.type !== 'transfer',
                type: 'smoothstep',
                style: {
                    stroke: color,
                    strokeWidth: 2,
                },
                labelStyle: {
                    fill: color,
                    fontWeight: 500,
                    fontSize: 11,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: color,
                },
            };
        });
    }, [flowEdges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    if (!flowNodes || flowNodes.length === 0) {
        return (
            <div className={cn('flex items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200', className)}>
                <div className="text-center">
                    <FileCode className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No flow data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('h-[400px] border border-gray-200 rounded-xl overflow-hidden', className)}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
            >
                <Background color="#e5e7eb" gap={16} />
                <Controls />
                <MiniMap 
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'sender': return '#3b82f6';
                            case 'recipient': return '#22c55e';
                            case 'contract': return '#a855f7';
                            case 'initiation': return '#f59e0b';
                            case 'verification': return '#6366f1';
                            case 'processing': return '#8b5cf6';
                            case 'confirmation': return '#10b981';
                            case 'completion': return '#14b8a6';
                            default: return '#f97316';
                        }
                    }}
                />
            </ReactFlow>
        </div>
    );
}
