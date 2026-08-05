'use client'
import React from 'react'
import { Button } from '@/components/Elements'
import CardWrapper from '@/components/Elements/CardWrapper'
import { Github, ArrowUpRight } from 'lucide-react'

// Full-width horizontal template card
const TemplateCard = ({ template }) => {
    return (
        <CardWrapper
            // color={template.accentColor}
            className="p-0 mb-6 overflow-hidden"
            hoverEffect={false}
            onClick={() => { }}
        >
            <div className="flex flex-col lg:flex-row">
                {/* Image section - left on desktop */}
                <div className="lg:w-1/3 aspect-[16/9] lg:aspect-auto bg-black">
                    <img
                        src={template.imageUrl}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Content section - right on desktop */}
                <div className="flex flex-col p-8 lg:w-2/3">
                    <h2 className="text-xl font-medium text-white mb-2">
                        {template.name}
                    </h2>


                    <p className="text-gray-400 text-sm mb-6">
                        {template.description}
                    </p>

                    <div className="mb-6 text-sm">
                        {template.tags.map((tag, index) => (
                            <React.Fragment key={index}>
                                <span className="text-white hover:opacity-80 transition-opacity border-b border-white border-opacity-50">
                                    {tag}
                                </span>
                                {index < template.tags.length - 1 && <span className="text-gray-500 mx-1">,</span>}
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-auto">
                        <Button
                            text="Use Template"
                            variant="outline"
                            size="small"
                            Icon={ArrowUpRight}
                            onClick={() => window.open(template.githubUrl, '_blank')}
                        />

                        <div className="flex space-x-4 ml-auto">
                            <a
                                href={template.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                Demo
                            </a>

                            <a
                                href={template.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Github size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </CardWrapper>
    )
}

function TemplatesPage() {
    // Simplified template data with accent colors
    const templates = [
        {
            "id": 1,
            "name": "Dark Solar",
            "description": "A sleek, performance-optimized NextJS template with dark mode aesthetics and clean energy vibes. Features Notion-powered blog, fluid animations, and enterprise-ready architecture.",
            "imageUrl": "https://cdn.compify.app/templates/dark-saas-demo.gif",
            "githubUrl": "https://github.com/kubet/compify/tree/main/packages/templates/dark-solar-saas",
            "demoUrl": "https://compify.app",
            "tags": ["NextJS 15", "TailwindCSS 4", "TypeScript", "Framer Motion", "Notion Blog API"]
        },

    ]

    return (
        <div className="bg-black min-h-screen text-white">
            <div className="max-w-6xl mx-auto px-6 py-16">
                {/* Header with contribute button */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-normal text-white mb-2">
                            Templates
                        </h1>
                        <p className="text-gray-500">
                            Open-source foundations for your next project.
                        </p>
                    </div>

                    <Button
                        text="Contribute on GitHub"
                        Icon={Github}
                        variant="outline"
                        className="mt-4 md:mt-0"
                        onClick={() => window.open('https://github.com/kubet/compify/tree/main/packages/templates', '_blank')}
                    />
                </div>

                {/* Full-width template cards */}
                <div>
                    {templates.map(template => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TemplatesPage