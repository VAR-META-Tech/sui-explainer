// Gemini Explanation Display Component - Shows 3-tier explanations with expandable sections

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { 
    LLMTransactionExplanation,
    ExplanationLevel1,
    ExplanationLevel2,
    ExplanationLevel3 
} from '@/lib/gemini/types';
import { 
    ChevronDown, 
    ChevronUp, 
    BookOpen, 
    Code, 
    GraduationCap,
    Lightbulb,
    AlertTriangle,
    CheckCircle,
    Brain,
    Zap,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeminiExplanationDisplayProps {
    explanation: LLMTransactionExplanation | null;
    geminiInfo: {
        enabled: boolean;
        configured: boolean;
        mode: string;
    } | null;
}

export function GeminiExplanationDisplay({ explanation, geminiInfo }: GeminiExplanationDisplayProps) {
    const [expandedLevel, setExpandedLevel] = useState<1 | 2 | 3 | null>(1);
    
    if (!explanation) {
        return null;
    }

    const toggleLevel = (level: 1 | 2 | 3) => {
        setExpandedLevel(expandedLevel === level ? null : level);
    };

    return (
        <div className="space-y-6">
            {/* Gemini Info Banner */}
            {geminiInfo && !geminiInfo.configured && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                        <Info className="h-5 w-5" />
                        <p className="text-sm">
                            AI explanations require a Gemini API key. Set GEMINI_API_KEY in your environment variables.
                        </p>
                    </div>
                </div>
            )}

            {/* 3-Tier Explanation Levels */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-600" />
                        AI-Powered Explanation
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {/* Level Selector */}
                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            variant={expandedLevel === 1 ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => toggleLevel(1)}
                            className="flex items-center gap-2"
                        >
                            <BookOpen className="h-4 w-4" />
                            Level 1: Beginner
                        </Button>
                        <Button
                            variant={expandedLevel === 2 ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => toggleLevel(2)}
                            className="flex items-center gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            Level 2: Intermediate
                        </Button>
                        <Button
                            variant={expandedLevel === 3 ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => toggleLevel(3)}
                            className="flex items-center gap-2"
                        >
                            <Code className="h-4 w-4" />
                            Level 3: Technical
                        </Button>
                    </div>

                    {/* Level 1: Beginner */}
                    <div className={cn(
                        "border rounded-lg transition-all duration-300",
                        expandedLevel === 1 ? "border-green-200 bg-green-50/30" : "border-gray-200"
                    )}>
                        <button
                            onClick={() => toggleLevel(1)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-green-50/50 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <BookOpen className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-green-900">Beginner Friendly</h4>
                                    <p className="text-sm text-green-700">Simple explanations with everyday analogies</p>
                                </div>
                            </div>
                            {expandedLevel === 1 ? (
                                <ChevronUp className="h-5 w-5 text-green-600" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                        
                        {expandedLevel === 1 && explanation.plain_english?.level_1 && (
                            <div className="px-4 pb-4 pt-2 border-t border-green-100">
                                <Level1Content data={explanation.plain_english.level_1} />
                            </div>
                        )}
                    </div>

                    {/* Level 2: Intermediate */}
                    <div className={cn(
                        "border rounded-lg transition-all duration-300",
                        expandedLevel === 2 ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                    )}>
                        <button
                            onClick={() => toggleLevel(2)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50/50 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Zap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-blue-900">Intermediate</h4>
                                    <p className="text-sm text-blue-700">Moderate detail with key terms explained</p>
                                </div>
                            </div>
                            {expandedLevel === 2 ? (
                                <ChevronUp className="h-5 w-5 text-blue-600" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                        
                        {expandedLevel === 2 && explanation.plain_english?.level_2 && (
                            <div className="px-4 pb-4 pt-2 border-t border-blue-100">
                                <Level2Content data={explanation.plain_english.level_2} />
                            </div>
                        )}
                    </div>

                    {/* Level 3: Technical */}
                    <div className={cn(
                        "border rounded-lg transition-all duration-300",
                        expandedLevel === 3 ? "border-purple-200 bg-purple-50/30" : "border-gray-200"
                    )}>
                        <button
                            onClick={() => toggleLevel(3)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-purple-50/50 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Code className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-purple-900">Technical Deep Dive</h4>
                                    <p className="text-sm text-purple-700">Comprehensive technical breakdown</p>
                                </div>
                            </div>
                            {expandedLevel === 3 ? (
                                <ChevronUp className="h-5 w-5 text-purple-600" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                        
                        {expandedLevel === 3 && explanation.plain_english?.level_3 && (
                            <div className="px-4 pb-4 pt-2 border-t border-purple-100">
                                <Level3Content data={explanation.plain_english.level_3} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Classification & Risk */}
            {explanation.classification && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-indigo-600" />
                            Transaction Classification
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                                <p className="font-medium text-gray-900 capitalize">{explanation.classification.category}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Risk Level</p>
                                <p className={cn(
                                    "font-medium capitalize",
                                    explanation.classification.risk_level === 'low' && "text-green-600",
                                    explanation.classification.risk_level === 'medium' && "text-yellow-600",
                                    explanation.classification.risk_level === 'high' && "text-red-600"
                                )}>
                                    {explanation.classification.risk_level}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Complexity</p>
                                <p className="font-medium text-gray-900 capitalize">{explanation.classification.complexity}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Security & Risks */}
            {explanation.security_and_risks && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Security Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Risk Level:</span>
                            <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium capitalize",
                                explanation.security_and_risks.risk_level === 'low' && "bg-green-100 text-green-700",
                                explanation.security_and_risks.risk_level === 'medium' && "bg-yellow-100 text-yellow-700",
                                explanation.security_and_risks.risk_level === 'high' && "bg-red-100 text-red-700"
                            )}>
                                {explanation.security_and_risks.risk_level}
                            </span>
                        </div>
                        
                        {explanation.security_and_risks.risks.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Potential Risks</p>
                                <ul className="space-y-1">
                                    {explanation.security_and_risks.risks.map((risk, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                            {risk}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {explanation.security_and_risks.red_flags.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Red Flags to Watch</p>
                                <ul className="space-y-1">
                                    {explanation.security_and_risks.red_flags.map((flag, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Level 1: Beginner Content
function Level1Content({ data }: { data: ExplanationLevel1 }) {
    return (
        <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                    <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
                    <h5 className="font-medium text-green-900">Simple Explanation</h5>
                </div>
                <p className="text-green-800">{data.simple_explanation}</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <h5 className="font-medium text-blue-900">Real-World Analogy</h5>
                </div>
                <p className="text-blue-800">{data.everyday_analogy}</p>
            </div>
            
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Key Takeaway</p>
                <p className="font-medium text-gray-900">{data.key_takeaway}</p>
            </div>
        </div>
    );
}

// Level 2: Intermediate Content
function Level2Content({ data }: { data: ExplanationLevel2 }) {
    return (
        <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Detailed Explanation</h5>
                <p className="text-blue-800">{data.detailed_explanation}</p>
            </div>
            
            {data.key_terms.length > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <h5 className="font-medium text-indigo-900 mb-2">Key Terms</h5>
                    <dl className="space-y-2">
                        {data.key_terms.map((term, i) => (
                            <div key={i} className="grid grid-cols-[120px_1fr] gap-2">
                                <dt className="font-medium text-indigo-700 text-sm">{term.term}</dt>
                                <dd className="text-indigo-800 text-sm">{term.definition}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
            
            {data.practical_implications.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Practical Implications</h5>
                    <ul className="space-y-1">
                        {data.practical_implications.map((impl, i) => (
                            <li key={i} className="flex items-start gap-2 text-green-800 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {impl}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Level 3: Technical Content
function Level3Content({ data }: { data: ExplanationLevel3 }) {
    return (
        <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <h5 className="font-medium text-purple-900 mb-2">Technical Breakdown</h5>
                <p className="text-purple-800">{data.technical_breakdown}</p>
            </div>
            
            {data.edge_cases.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <h5 className="font-medium text-amber-900 mb-2">Edge Cases & Special Conditions</h5>
                    <ul className="space-y-1">
                        {data.edge_cases.map((edge, i) => (
                            <li key={i} className="text-amber-800 text-sm flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                {edge}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {data.deeper_implications.length > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <h5 className="font-medium text-indigo-900 mb-2">Deeper Implications</h5>
                    <ul className="space-y-1">
                        {data.deeper_implications.map((impl, i) => (
                            <li key={i} className="text-indigo-800 text-sm flex items-start gap-2">
                                <Brain className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                {impl}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {data.risk_factors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-2">Risk Factors</h5>
                    <ul className="space-y-1">
                        {data.risk_factors.map((risk, i) => (
                            <li key={i} className="text-red-800 text-sm flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
