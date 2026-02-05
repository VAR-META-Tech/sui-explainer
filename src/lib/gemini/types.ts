/**
 * Types for LLM-generated transaction explanations
 */

/**
 * Level 1: Simple explanation for complete beginners
 */
export interface ExplanationLevel1 {
    /** Simple, accessible explanation using everyday analogies */
    simple_explanation: string;
    /** A relatable everyday analogy */
    everyday_analogy: string;
    /** Key takeaway in one sentence */
    key_takeaway: string;
}

/**
 * Level 2: Moderate detail for users with basic financial knowledge
 */
export interface ExplanationLevel2 {
    /** Detailed explanation with relevant context and key terms */
    detailed_explanation: string;
    /** Key terms explained */
    key_terms: Array<{
        term: string;
        definition: string;
    }>;
    /** Practical implications for the user */
    practical_implications: string[];
}

/**
 * Level 3: Comprehensive technical explanation for experienced users
 */
export interface ExplanationLevel3 {
    /** Full technical breakdown with nuances */
    technical_breakdown: string;
    /** Edge cases and special conditions */
    edge_cases: string[];
    /** Deeper implications and considerations */
    deeper_implications: string[];
    /** Related concepts for further learning */
    related_concepts: string[];
    /** Risk factors and considerations */
    risk_factors: string[];
}

/**
 * High-level overview of the transaction
 */
export interface TransactionOverview {
    title: string;
    summary: string;
    significance: string;
}

/**
 * Plain English explanations at 3 levels
 */
export interface PlainEnglishExplanation {
    level_1: ExplanationLevel1;
    level_2: ExplanationLevel2;
    level_3: ExplanationLevel3;
}

/**
 * Transaction classification and categorization
 */
export interface TransactionClassification {
    /** Primary category */
    category: 'transfer' | 'swap' | 'mint' | 'burn' | 'defi' | 'nft' | 'staking' | 'lending' | 'bridge' | 'governance' | 'contract_interaction' | 'unknown';
    /** Specific action type */
    action: string;
    /** Risk level assessment */
    risk_level: 'low' | 'medium' | 'high';
    /** Complexity level for UI display */
    complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Educational context and learning opportunities
 */
export interface EducationalContext {
    /** Prerequisites for understanding */
    prerequisites: string[];
    /** Learning objectives */
    learning_objectives: string[];
    /** Related topics to explore */
    related_topics: string[];
    /** Difficulty level */
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Detailed transaction type information
 */
export interface TransactionTypeInfo {
    type: string;
    description: string;
    capabilities: string[];
    common_use_cases: string[];
    protocol_specific?: string;
}

/**
 * Step in the transaction execution flow
 */
export interface ExecutionStepDetail {
    step: number;
    title: string;
    description: string;
    technical_details: string;
    significance: string;
}

/**
 * Detailed flow of the transaction
 */
export interface TransactionFlowDetail {
    execution_steps: ExecutionStepDetail[];
    value_flow: Array<{
        from: string;
        to: string;
        asset: string;
        amount: string;
    }>;
}

/**
 * Sender information
 */
export interface SenderDetail {
    address: string;
    role: string;
}

/**
 * Recipient information
 */
export interface RecipientDetail {
    address: string;
    role: string;
    type: 'wallet' | 'contract' | 'protocol';
}

/**
 * Gas and resource information
 */
export interface GasAndResources {
    gas_used: string;
    total_fee: string;
    net_cost: string;
}

/**
 * Object interaction details
 */
export interface ObjectInteraction {
    object_id: string;
    type: string;
    operation: string;
    category: string;
}

/**
 * Technical details section
 */
export interface TechnicalDetails {
    sender: SenderDetail;
    recipients: RecipientDetail[];
    gas_and_resources: GasAndResources;
    object_interactions: ObjectInteraction[];
    blockchain_metadata: {
        chain: string;
        digest: string;
        timestamp: string;
        status: string;
    };
}

/**
 * Security and risk assessment
 */
export interface SecurityAndRisks {
    risk_level: 'low' | 'medium' | 'high';
    risks: string[];
    safety_checks: string[];
    verification: string;
    red_flags: string[];
}

/**
 * Context and education section
 */
export interface ContextAndEducation {
    blockchain_background: string;
    protocol_info: string;
    educational_notes: string[];
    related_concepts: string[];
}

/**
 * Complete LLM transaction explanation
 */
export interface LLMTransactionExplanation {
    overview: TransactionOverview;
    plain_english: PlainEnglishExplanation;
    transaction_type: TransactionTypeInfo;
    classification: TransactionClassification;
    detailed_flow: TransactionFlowDetail;
    technical_details: TechnicalDetails;
    security_and_risks: SecurityAndRisks;
    context_and_education: EducationalContext;
}

/**
 * Simple LLM explanation response
 */
export interface SimpleLLMExplanation {
    summary: string;
    simple_explanation: string;
    analogy: string;
    transaction_type: string;
}

/**
 * API response structure
 */
export interface LLMExplainResponse {
    success: boolean;
    explanation?: LLMTransactionExplanation;
    simple_explanation?: SimpleLLMExplanation;
    model?: string;
    error?: string;
}
