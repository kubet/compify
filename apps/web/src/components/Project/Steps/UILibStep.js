import React from 'react'
import QuickStartCard from '@/components/Elements/QuickStartCard'
import { CodeIcon, TrashIcon } from 'lucide-react'
import LabelButton from '@/components/Elements/LabelButton'
import { motion } from 'framer-motion'
import { Dropdown } from '@/components/Elements'
import Chip from '@/components/Elements/Chip'

function UILibStep({ runtime, handleUiLibSelect, setMainFont, setFonts, saveText = 'Continue', pageSettings, uiLibs }) {
    const loadedFonts = pageSettings?.fonts?.map(f => ({ label: f, value: f }))
    const [usedUiFrameworks, setUsedUiFrameworks] = React.useState(uiLibs || [])
    const [configFiles, setConfigFiles] = React.useState([])
    const [selectedFonts, setSelectedFonts] = React.useState(loadedFonts || [{ label: 'Roboto', value: 'Roboto' }])
    const [mainFontValue, setMainFontValue] = React.useState(pageSettings?.fontFamily || 'Roboto')
    const [options, setOptions] = React.useState([])

    const uiLibraries = [
        {
            id: 'tailwind',
            name: 'Tailwind CSS',
            type: 'Utility-first CSS framework',
            color: 'cyan',
            templates: ['react', 'vue', 'nextjs'],
            configurations: ['tailwind.config.js', "globals.css"]
        },
        {
            id: 'tailwind-ts',
            name: 'Tailwind CSS (TypeScript)',
            type: 'Utility-first CSS framework',
            color: 'cyan',
            templates: ['react-ts', 'vue-ts'],
            configurations: ['tailwind.config.ts', "globals.css"]
        },
        {
            id: 'tailwind-v4',
            name: 'Tailwind CSS (v4)',
            type: 'Utility-first CSS framework',
            color: 'cyan',
            templates: ['react', 'vue', 'nextjs'],
            configurations: ['globals.css']
        },
        {
            id: 'mui',
            name: 'Material UI',
            type: 'React UI library following Material Design',
            color: 'blue',
            templates: ['react', 'react-ts', 'nextjs'],
            configurations: ['globals.css', 'theme.config.js']
        },
        {
            id: 'shadcn',
            name: 'Shadcn/ui',
            type: 'Re-usable components built with Radix UI and Tailwind',
            color: 'rgba(148, 163, 184, 1)',
            templates: ['react-ts'],
            configurations: ['globals.css', 'tailwind.config.ts']
        },
        {
            id: 'bootstrap',
            name: 'Bootstrap',
            type: 'Popular responsive CSS framework',
            color: 'purple',
            templates: ['react', 'react-ts', 'vue', 'vue-ts', 'nextjs'],
            configurations: ['globals.css']
        }
    ]

    const popularFonts = [
        { label: 'Roboto', value: 'Roboto' },
        { label: 'Open Sans', value: 'Open Sans' },
        { label: 'Lato', value: 'Lato' },
        { label: 'Montserrat', value: 'Montserrat' },
        { label: 'Poppins', value: 'Poppins' },
        { label: 'Inter', value: 'Inter' }
    ]

    React.useEffect(() => {
        const loadFonts = async () => {
            try {
                const response = await fetch('https://cdn.compify.app/font-list.json')
                const fonts = await response.json()
                setOptions(fonts.map(font => ({ label: font, value: font })))
            } catch (error) {
                console.error('Failed to load fonts:', error)
            }
        }

        loadFonts()
    }, [])

    const filterUiFrameworksByRuntime = () => {
        return uiLibraries.filter(library => library?.templates?.includes(runtime))
    }

    const handleFrameworkToggle = (framework) => {
        if (usedUiFrameworks.includes(framework)) {
            setUsedUiFrameworks(prev => prev.filter(f => f !== framework))
            // Remove associated config files
            const frameworkConfigs = uiLibraries.find(lib => lib.id === framework)?.configurations || []
            setConfigFiles(prev => prev.filter(file => !frameworkConfigs.includes(file)))
        } else {
            setUsedUiFrameworks(prev => [...prev, framework])
            // Add new config files
            const frameworkConfigs = uiLibraries.find(lib => lib.id === framework)?.configurations || []
            setConfigFiles(prev => [...new Set([...prev, ...frameworkConfigs])])
        }
    }

    const handleNext = () => {
        handleUiLibSelect(usedUiFrameworks)
    }

    const handleFontSelect = (selectedValues) => {
        setSelectedFonts(selectedValues)
        setFonts(selectedValues.map(font => font.value))
    }

    const handleMainFontSelect = (value) => {
        setMainFontValue(value.value)
        setMainFont(value.value)
    }

    const handleChipSelect = (value) => {
        setSelectedFonts([...selectedFonts, { label: value, value: value }])
        setFonts([...selectedFonts, { label: value, value: value }].map(font => font.value))
    }

    return (
        <div className="space-y-6">
            <motion.h4
                className="text-2xl mb-6 md:text-3xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                UI configuration
            </motion.h4>

            <motion.p
                className="text-gray-500 text-lg mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                Select a UI framework. You can skip this step and set up your preferred framework later if desired.
            </motion.p>

            <div className="grid grid-cols-2 gap-3">
                {filterUiFrameworksByRuntime().map((item, index) => (
                    <QuickStartCard
                        key={index}
                        name={item.name}
                        description={item.type}
                        Icon={usedUiFrameworks?.includes(item.id) ? TrashIcon : CodeIcon}
                        iconClassName={usedUiFrameworks?.includes(item.id) ? 'text-red-400' : 'text-gray-300'}
                        color={item.color}
                        onClick={() => handleFrameworkToggle(item.id)}
                    />
                ))}
            </div>

            {configFiles.length > 0 && (
                <div className="mt-6">
                    <p className="text-gray-500 mb-3">Configuration files that will be added:</p>
                    <div className="flex flex-wrap gap-2">
                        {configFiles.map((config, index) => (
                            <LabelButton
                                key={index}
                                variant="info"
                            >
                                {config}
                            </LabelButton>
                        ))}
                    </div>
                </div>
            )}
            <motion.h4
                className="text-xl !mt-12 md:text-2xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Font configuration
            </motion.h4>
            <div className="flex gap-4 !mt-0 mb-4 flex-col sm:flex-row">
                <div className="flex-1">
                    <p className="text-gray-500 my-3">Select additional fonts to use in your project.</p>
                    <Dropdown
                        placeholder="Choose additional fonts"
                        options={options}
                        onSelect={handleFontSelect}
                        multiSelect={true}
                        value={selectedFonts}
                        className="py-1"
                    />
                    <p className="text-gray-500 my-3">Popular fonts:</p>

                    <div className="flex flex-wrap gap-2 mt-4 pl-1">
                        {popularFonts.map(font => (
                            <Chip
                                key={font.value}
                                label={font.label}
                                isSelected={selectedFonts.some(f => f.value === font.value)}
                                onSelect={() => handleChipSelect(font.value)}
                                showX={false}
                                size="small"
                            />
                        ))}
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-gray-500 my-3">Select main body font</p>
                    <Dropdown
                        placeholder="Choose main font"
                        options={selectedFonts}
                        onSelect={handleMainFontSelect}
                        value={{ label: mainFontValue, value: mainFontValue }}
                    />
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <LabelButton
                    onClick={handleNext}
                    variant="info"
                >
                    {saveText}
                </LabelButton>
            </div>
        </div>
    )
}

export default UILibStep