import TemplateCard from '@/components/Editor/TemplateCard';
import { runtimeList } from '@/components/Editor/Templates/common';
import { Chip } from '@/components/Elements';
import React, { useState } from 'react'
import { motion } from 'framer-motion';
function ConfigurationStep({ handleRuntimeSelect }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = ['All', ...new Set(runtimeList.map(r => r.language))];
    const languageFullNames = {
        'All': 'All',
        'JavaScript': 'JavaScript',
        'TypeScript': 'TypeScript',
        'HTML': 'HTML',
    };

    const filteredRuntimes = runtimeList.filter((runtime) => {
        const matchesCategory = selectedCategory === 'All' || runtime.language === selectedCategory;
        return matchesCategory;
    });


    return (
        <div>
            <motion.h4
                className="text-2xl mb-4 md:text-3xl font-extrabold text-start w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Choose your runtime
            </motion.h4>
            <div className="flex space-x-4 mb-6">
                {categories.map((category) => (
                    <Chip
                        key={category}
                        isSelected={selectedCategory === category}
                        label={languageFullNames[category]}
                        onSelect={() => setSelectedCategory(category)}
                        showX={false}
                        color={selectedCategory === category ? 'blue' : 'gray'}
                    />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRuntimes.map((runtime) => (
                    <TemplateCard
                        key={runtime.id}
                        name={runtime.name}
                        description={''}
                        language={runtime.language}
                        color={runtime.color}
                        onClick={() => handleRuntimeSelect(runtime.id)}
                    />
                ))}
            </div>
        </div>
    )
}

export default ConfigurationStep