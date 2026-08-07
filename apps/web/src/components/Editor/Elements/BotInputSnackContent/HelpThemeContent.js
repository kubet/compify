import React, { useState } from 'react'
import { Sliders, Palette, Code2, ChevronRight, Zap, Lightbulb, Terminal, Grid, Box, Variable, Braces } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

function CodeExample({ code, description }) {
    return (
        <div className="space-y-2">
            <code className="block bg-white/5 p-2 rounded-lg text-blue-300 text-sm">{code}</code>
            {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>
    );
}

function HelpThemeContent() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Zap },
        { id: 'structure', label: 'Structure', icon: Grid },
        { id: 'usage', label: 'Usage', icon: Terminal }
    ];

    const features = [
        {
            icon: Sliders,
            title: "Factors",
            description: "Top-down controllable elements using sliders or numeric inputs. Like all tokens, they use the -- prefix and serve as foundational values."
        },
        {
            icon: Palette,
            title: "Groups",
            description: "Collections of related tokens that can be made available at the application level. Perfect for color palettes and value sets."
        },
        {
            icon: Box,
            title: "Values",
            description: "Application-level tokens automatically available in CSS and JSON theme files."
        },
        {
            icon: Variable,
            title: "Meta Tokens",
            description: "Dynamic tokens that can construct and reference other token values using \\${--token-name} syntax."
        }
    ];

    return (
        <div className="text-white w-full sm:w-[600px] max-w-[600px]">
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
                    {activeTab === 'overview' && (
                        <>
                            <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-blue-500/5 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 leading-relaxed">
                                    Design tokens are the building blocks of your design system. They provide a hierarchical way to manage design values,
                                    from basic factors to complex dynamic tokens that adapt to your application&apos;s state.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {features.map((feature, index) => (
                                    <InfoCard key={index} {...feature} />
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'structure' && (
                        <div className="space-y-6">
                            <FeatureSection title="Factors" icon={Sliders}>
                                <div className="space-y-4 text-gray-400">
                                    <p className="text-sm">
                                        Factors are top-down controllable elements that can be adjusted using:
                                    </p>
                                    <ul className="space-y-2 pl-4">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Sliders for continuous values</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Numeric inputs for precise control</span>
                                        </li>
                                    </ul>
                                    <CodeExample
                                        code="--hue: 220; /* A factor token */"
                                        description="All tokens use the -- prefix and can be referenced in other token value fields"
                                    />
                                </div>
                            </FeatureSection>

                            <FeatureSection title="Groups" icon={Palette}>
                                <div className="space-y-4 text-gray-400">
                                    <p className="text-sm">
                                        Groups organize related values and can be made available at the application level:
                                    </p>
                                    <ul className="space-y-2 pl-4">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Create color palettes or value sets</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                            <span>Enable &quot;Make whole group available&quot; to expose in JSON</span>
                                        </li>
                                    </ul>
                                    <CodeExample
                                        code="--palette-light-background: hsl(--hue, 30%, 95%);"
                                        description="Groups can reference other tokens directly with the -- prefix"
                                    />
                                </div>
                            </FeatureSection>

                            <FeatureSection title="Values" icon={Box}>
                                <div className="space-y-4 text-gray-400">
                                    <p className="text-sm">
                                        Application values are automatically available in CSS and JSON theme files:
                                    </p>
                                    <CodeExample
                                        code="--background: --palette-light-background;"
                                        description="Values can reference any other token directly"
                                    />
                                </div>
                            </FeatureSection>
                        </div>
                    )}

                    {activeTab === 'usage' && (
                        <div className="space-y-6">
                            <FeatureSection title="Token References" icon={Code2}>
                                <div className="space-y-4 text-gray-400">
                                    <p className="text-sm">Use tokens directly with their -- prefix:</p>
                                    <CodeExample
                                        code="background-color: --background;
color: --palette-light-text;"
                                        description="Direct token usage in CSS without var()"
                                    />
                                </div>
                            </FeatureSection>

                            <FeatureSection title="Meta Tokens" icon={Braces}>
                                <div className="space-y-4 text-gray-400">
                                    <p className="text-sm">
                                        Meta tokens can dynamically construct token names using \${--token - name}:
                                    </p>
                                    <CodeExample
                                        code="--dynamic-bg: --palette-${--theme}-background;"
                                        description="When &quot;theme&quot; is &apos;light&apos;, this becomes --palette-light-background"
                                    />
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="space-y-3 text-sm">
                                            <p>Example resolution:</p>
                                            <ol className="space-y-2 pl-4 list-decimal">
                                                <li>--theme resolves to &quot;light&quot;</li>
                                                <li>Token name constructs to --palette-light-background</li>
                                                <li>Final value is retrieved from the palette group</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </FeatureSection>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default HelpThemeContent 