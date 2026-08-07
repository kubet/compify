import React, { useState } from 'react'
import { Bot, Image, Palette, Wand2, Sparkles, Code2, PenTool, ChevronRight, Zap, BookOpen, Lightbulb, Terminal, Keyboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CardWrapper from '@/components/Elements/CardWrapper'

function InfoCard({ title, description, icon: Icon }) {
    return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{title}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{description}</p>
                </div>
            </div>
        </div>
    );
}

function FeatureSection({ title, icon: Icon, children }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white">{title}</h3>
            </div>
            <div className="pl-8">
                {children}
            </div>
        </div>
    );
}

function HelpContent() {
    const [activeTab, setActiveTab] = useState('quickstart');

    const tabs = [
        { id: 'quickstart', label: 'Overview', icon: Zap },
        { id: 'commands', label: 'Usage', icon: Terminal },
        { id: 'tips', label: 'Tips', icon: Lightbulb }
    ];

    const features = [
        {
            icon: Bot,
            title: "Natural Language Input",
            description: "Simply describe your component in plain English. Smart suggestions will help improve and expand your prompts automatically."
        },
        {
            icon: Image,
            title: "Image-Based Generation",
            description: "Paste screenshots or design references directly into the input to influence the generated design and styling."
        },
        {
            icon: Code2,
            title: "Smart Completions",
            description: "Get intelligent suggestions for fonts and theme factors. Just mention them in your prompt and the system will offer relevant options."
        },
        {
            icon: Keyboard,
            title: "Special Commands",
            description: "Use powerful commands like /remap and /preview to enhance your workflow and visualize components."
        }
    ];

    return (
        <div className="text-white w-full sm:w-[600px] max-w-[600px]">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg backdrop-blur-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                >
                    {activeTab === 'quickstart' && (
                        <>
                            <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-blue-500/5 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 leading-relaxed">
                                    The Bot Input at the bottom-right of your screen transforms descriptions into components.
                                    It features smart completions, theme integration, and intelligent prompt enhancement to streamline your workflow.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {features.map((feature, index) => (
                                    <InfoCard key={index} {...feature} />
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'commands' && (
                        <div className="space-y-6">
                            <FeatureSection title="Smart Features" icon={Sparkles}>
                                <div className="space-y-4 text-gray-400">
                                    <div className="space-y-2">
                                        <div className="text-white text-sm font-medium">Font Suggestions</div>
                                        <p className="text-sm pl-4 border-l border-white/10 py-1">
                                            &ldquo;Change the font to something modern&rdquo; - will suggest appropriate font options
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-white text-sm font-medium">Theme Factor Controls</div>
                                        <p className="text-sm pl-4 border-l border-white/10 py-1">
                                            &ldquo;Increase the saturation&rdquo; - adjusts theme factors with visual controls
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-white text-sm font-medium">Prompt Enhancement</div>
                                        <p className="text-sm pl-4 border-l border-white/10 py-1">
                                            System automatically expands and improves your prompts for better results
                                        </p>
                                    </div>
                                </div>
                            </FeatureSection>

                            <FeatureSection title="Component Generation" icon={Code2}>
                                <div className="space-y-4 text-gray-400">
                                    <div className="space-y-2">
                                        <div className="text-white text-sm font-medium">New Components</div>
                                        <p className="text-sm pl-4 border-l border-white/10 py-1">
                                            &ldquo;Create a responsive navbar with dropdown menu and mobile hamburger&rdquo;
                                        </p>
                                        <p className="text-sm pl-4 border-l border-white/10 py-1">
                                            &ldquo;Generate a product card with image, price, and hover effects&rdquo;
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-white text-sm font-medium">Style Updates</div>
                                        <p className="text-sm pl-4 border-l border-white/10 py-1">
                                            &ldquo;Add glass morphism and make the background darker&rdquo;
                                        </p>
                                        <p className="text-sm pl-4 border-l border-white/10 py-1">
                                            &ldquo;Update colors to match this image [paste screenshot]&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </FeatureSection>

                            <FeatureSection title="Command Reference" icon={Terminal}>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="space-y-3 text-gray-400 text-sm">
                                        <div className="flex items-start gap-2">
                                            <code className="text-xs bg-white/5 px-2 py-0.5 rounded text-blue-300">/remap</code>
                                            <span>Remaps design tokens to components and restructures files for optimal theme integration (available only if theme engine is enabled)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <code className="text-xs bg-white/5 px-2 py-0.5 rounded text-blue-300">/preview</code>
                                            <span>Generates a comprehensive showcase displaying all variants and states of the selected component</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <code className="text-xs bg-white/5 px-2 py-0.5 rounded text-blue-300">theme-only</code>
                                            <span>Switch to theme-only mode in the dropdown</span>
                                        </div>
                                    </div>
                                </div>
                            </FeatureSection>
                        </div>
                    )}

                    {activeTab === 'tips' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Sparkles className="w-5 h-5" />
                                        <h3 className="font-medium">Expert Tips</h3>
                                    </div>
                                    <ul className="space-y-3 text-gray-400">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Use theme factors in your prompts (e.g., &ldquo;increase saturation&rdquo;) for precise styling control</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Mention specific fonts or styles to trigger smart suggestions</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Let the system enhance your prompts for more detailed and accurate results</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Use image references from popular design sites for consistent styling</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Generate base components first, then refine with specific style commands</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default HelpContent