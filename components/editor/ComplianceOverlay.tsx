"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ComplianceIssue {
    x: number; // 0-100 percentage
    y: number; // 0-100 percentage
    issue: string;
}

interface ComplianceOverlayProps {
    issues: ComplianceIssue[];
    isVisible: boolean;
    onClose: () => void;
    onFix?: (issueDescription: string) => void; // Callback to trigger "Auto-Fix" with context
}

export function ComplianceOverlay({ issues, isVisible, onClose, onFix }: ComplianceOverlayProps) {
    const [selectedIssue, setSelectedIssue] = useState<number | null>(null);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="absolute inset-0 pointer-events-none z-[80] overflow-hidden">
                    {/* Backdrop dimmer to focus attention on issues */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-900/10 pointer-events-auto"
                        onClick={() => setSelectedIssue(null)}
                    />

                    {issues.map((issue, index) => (
                        <motion.div
                            key={index}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: index * 0.1, type: "spring" }}
                            className="absolute pointer-events-auto group cursor-pointer"
                            style={{
                                left: `${issue.x}%`,
                                top: `${issue.y}%`,
                                transform: "translate(-50%, -50%)"
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIssue(index === selectedIssue ? null : index);
                            }}
                        >
                            {/* Pulsing Red Marker */}
                            <div className="relative">
                                <div className="absolute -inset-4 bg-red-500/30 rounded-full animate-ping" />
                                <div className="absolute -inset-2 bg-red-500/50 rounded-full animate-pulse" />
                                <div className="relative w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    <AlertTriangle className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            {/* Tooltip / Context Menu */}
                            <AnimatePresence>
                                {(selectedIssue === index) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-black/90 backdrop-blur-xl border border-red-500/30 p-4 rounded-xl shadow-2xl z-[100]"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Violation Detected
                                            </h4>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedIssue(null); }}
                                                className="text-white/50 hover:text-white"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        
                                        <p className="text-sm text-white/90 mb-4 font-light">
                                            "{issue.issue}"
                                        </p>

                                        <div className="flex gap-2">
                                            {onFix && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onFix(issue.issue);
                                                    }}
                                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-lg shadow-red-900/50"
                                                >
                                                    Auto-Fix (Gemini)
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-colors"
                                            >
                                                Ignore
                                            </button>
                                        </div>

                                        {/* Gemini Badge */}
                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
                                            <span className="font-mono">GEMINI_3_FLASH</span>
                                            <span>Thinking Mode: Active</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
