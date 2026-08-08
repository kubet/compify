import { cdnUrl } from '@/constains';
import { Dropdown } from '@/components/Elements'
import LabelButton from '@/components/Elements/LabelButton'
import CollapsibleSection from '@/components/Elements/CollapsibleSection'
import { ArrowLeft, ArrowUpRight, CodeIcon, SquareArrowOutUpRight, TrashIcon } from 'lucide-react'
import React from 'react'
import Chip from '@/components/Elements/Chip'
import QuickStartCard from '@/components/Elements/QuickStartCard'
import ThemeConfiguratorWrapper from '@/components/Project/ThemeConfiguratorWrapper'
import RadioButton from '@/components/Elements/RadioButton'
import { doubleHash } from '@/components/Project/utils/double-hash'
import { insertTheme } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { uiFrameworkLook, uiLibraries } from '../Templates/common'
import CardWrapper from '@/components/Elements/CardWrapper'
import Toast from '@/components/Elements/Toast'
import { applyThemeConfigFiles } from '@/components/Project/common/getTokenConfigFiles'

function ConfigurationMenu({ initSettings,
    template,
    initFrameworkConfigFiles,
    setFonts,
    setMainFont,
    onBack,
    setScreenName,
    usedUiFrameworks,
    setUsedUiFrameworks,
    changeActiveFile,
    initialTheme,
    setTheme,
    setFilesState,
    handleLoadTheme,
    id,
    setDefaultOpenBotInput
}) {
    const [selectedFonts, setSelectedFonts] = React.useState([{ n: 'Roboto', e: 'ital,wght@0,100..900;1,100..900' }])
    const [openSections, setOpenSections] = React.useState(['fonts'])
    const [mainFontValue, setMainFontValue] = React.useState('Roboto')
    const [options, setOptions] = React.useState([])
    const [hasChanges, setHasChanges] = React.useState({
        theme: false,
        fonts: false,
        framework: false
    });
    const [saving, setSaving] = React.useState(false);
    const [currentThemeData, setCurrentThemeData] = React.useState(initialTheme);
    const [currentScreen, setCurrentScreen] = React.useState('config');
    const [hoveredFramework, setHoveredFramework] = React.useState(null);
    const [showToast, setShowToast] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState('');
    const popularFonts = [
        { n: 'Roboto', e: 'ital,wght@0,100..900;1,100..900' },
        { n: 'Open Sans', e: 'ital,wght@0,300..800;1,300..800' },
        { n: 'Lato', e: 'wght@100;300;400;700;900' },
        { n: 'Montserrat', e: 'ital,wght@0,100..900;1,100..900' },
        { n: 'Poppins', e: 'wght@100;200;300;400;500;600;700;800;900' },
        { n: 'Inter', e: 'ital,wght@0,100..900;1,100..900' }
    ]



    React.useEffect(() => {
        setScreenName('Configuration')
    }, [setScreenName])

    React.useEffect(() => {
        const loadFonts = async () => {
            try {
                const response = await fetch(`${cdnUrl}/font-list.json`)
                const fonts = await response.json()
                setOptions(fonts.map(font => ({
                    label: font.n,
                    value: { n: font.n, e: font.e }
                })))

                if (JSON.stringify(selectedFonts) !== JSON.stringify(initSettings.fonts)) {
                    setSelectedFonts(initSettings.fonts)
                }
                if (mainFontValue !== initSettings.fontFamily) {
                    setMainFontValue(initSettings.fontFamily)
                    setMainFont(initSettings.fontFamily)
                }
            } catch (error) {
                console.error('Failed to load fonts:', error)
            }
        }

        loadFonts()
    }, [initSettings, mainFontValue, selectedFonts, setMainFont])

    const handleFontSelect = (selectedValues) => {
        const newFonts = selectedValues.map(item => {
            const fontOption = options.find(opt => opt.value.n === item.value);
            if (!fontOption) {
                console.error('Font not found:', item);
                return null;
            }
            return fontOption.value;
        }).filter(Boolean);

        setSelectedFonts(newFonts);
        setFonts(newFonts);
    };

    const handleChipSelect = (font) => {
        if (!selectedFonts.some(f => f.n === font.n)) {
            const newFonts = [...selectedFonts, font];
            setSelectedFonts(newFonts);
            setFonts(newFonts);
        }
    }

    const toggleSection = (sectionId) => {
        setOpenSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        )
    }

    const checkIncompatibilities = (framework) => {
        const incompatibilityMessages = usedUiFrameworks
            .map(usedFw => {
                const look = uiFrameworkLook[usedFw];
                return look?.customCompactibilityError?.[framework];
            })
            .filter(Boolean);

        if (incompatibilityMessages.length > 0) {
            setToastMessage(incompatibilityMessages[0]);
            setShowToast(true);
            return true; // has incompatibilities
        }
        return false; // no incompatibilities
    }

    const addUiFramework = (framework) => {
        if (checkIncompatibilities(framework)) return;

        if (usedUiFrameworks.includes(framework)) {
            if (framework === 'theme') {
                setFilesState(prev => applyThemeConfigFiles(prev, null))
            }
            setUsedUiFrameworks(usedUiFrameworks.filter(id => id !== framework))
        } else {
            initFrameworkConfigFiles(framework);
            setUsedUiFrameworks([...usedUiFrameworks, framework])
        }
    }

    const handleMainFontSelect = (value) => {
        setMainFontValue(value.value)
        setMainFont(value.value)
    }

    const filterUiFrameworksByTemplate = () => {
        return uiLibraries.filter(library => library.templates.includes(template))
    }

    const getUniqueConfigurations = () => {
        const selectedLibraries = uiLibraries.filter(lib => usedUiFrameworks.includes(lib.id));
        const allConfigs = selectedLibraries.flatMap(lib => lib.configurations || []);
        return [...new Set(allConfigs)];
    };

    const handleFileClick = (file) => {
        changeActiveFile(file);
    }

    const checkSectionChanges = (section, currentData, originalData) => {
        if (!currentData || !originalData) return false;
        const currentHash = doubleHash(JSON.stringify(currentData));
        const originalHash = doubleHash(JSON.stringify(originalData));
        return currentHash !== originalHash;
    };

    React.useEffect(() => {
        const themeChanged = checkSectionChanges('theme', currentThemeData, initialTheme);
        setHasChanges(prev => ({ ...prev, theme: themeChanged }));
    }, [currentThemeData, initialTheme]);

    const handleSave = async () => {
        try {
            setSaving(true);
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleThemeClick = () => {
        setCurrentScreen('theme');
    };

    const handleThemeBack = () => {
        setCurrentScreen('config');
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {showToast && (
                <Toast
                    message={toastMessage}
                    type="error"
                    onClose={() => setShowToast(false)}
                />
            )}
            {currentScreen === 'config' ? (
                <>
                    <div className="flex-none shrink-0 px-6 pt-6">
                        <LabelButton onClick={onBack} Icon={ArrowLeft} variant="info">
                            Back to code
                        </LabelButton>
                        <h3 className="text-2xl font-semibold mb-4 mt-4 text-gray-300 w-full text-center">
                            Configuration Menu
                        </h3>
                    </div>

                    <div className="p-6 flex-1 min-h-0 overflow-y-scroll scrollbar-thin scrollbar-track-gray-300 relative">
                        <div className="absolute inset-0 overflow-y-auto">
                            <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-1">
                                <div className="border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => usedUiFrameworks.includes('theme') && handleThemeClick()}
                                        className={`relative w-full px-4 py-3 flex items-center justify-between transition-colors ${!usedUiFrameworks.includes('theme') && 'cursor-not-allowed'}`}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-[rgba(255,255,255,0.03)]"
                                            style={{ transformStyle: 'preserve-3d' }}
                                        />
                                        <h3 className="text-xl font-semibold text-gray-200">Theme Configuration</h3>
                                        <div className="relative group">
                                            <SquareArrowOutUpRight className={`w-5 h-5 ${usedUiFrameworks.includes('theme') ? 'text-white' : 'text-white/30'}`} />
                                            {!usedUiFrameworks.includes('theme') && (
                                                <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                                                    <div className="bg-[#0b0b0b] text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/5">
                                                        Enable theme to customize your design
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <div className="p-4 bg-gray-850 rounded-lg shadow-md">
                                            <div className="flex flex-col gap-4">
                                                <div
                                                    className="cursor-pointer flex items-center justify-between p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors bg-white/5"
                                                    onClick={() => addUiFramework('theme')}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-full bg-blue-500/10">
                                                            <CodeIcon className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-200 font-medium">Enable Theme</span>
                                                            <span className="text-gray-400 text-xs pt-1">Add theme configuration files to your component</span>
                                                        </div>
                                                    </div>
                                                    <RadioButton
                                                        checked={usedUiFrameworks.includes('theme')}
                                                        onChange={() => addUiFramework('theme')}
                                                        label=""
                                                        className="hover:bg-white/10 transition-colors duration-200"
                                                    />
                                                </div>

                                                {usedUiFrameworks.includes('theme') && getUniqueConfigurations().length > 0 && (
                                                    <div className="ml-2 pl-4 border-l-2 border-white/10">
                                                        <p className="text-gray-300 mb-3 text-sm font-medium flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                            Remap Design Tokens
                                                        </p>
                                                        <p className="text-gray-400 text-sm mb-3">
                                                            Click on a file to customize its design tokens using AI
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {getUniqueConfigurations().map((config, index) => (
                                                                <LabelButton
                                                                    key={index}
                                                                    onClick={() => handleFileClick(config)}
                                                                    variant="info"
                                                                    className="hover:bg-blue-600 transition-colors duration-200 text-sm py-1.5"
                                                                >
                                                                    {config}
                                                                </LabelButton>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>


                                <CollapsibleSection
                                    title="Font Configuration"
                                    isOpen={openSections.includes('fonts')}
                                    onToggle={() => toggleSection('fonts')}
                                >
                                    <p className="text-gray-300 my-3">Select additional fonts to use in your preview.</p>
                                    <div className="space-y-4 mb-4">
                                        <Dropdown
                                            placeholder="Choose additional fonts"
                                            options={options.map(opt => ({
                                                label: opt.value.n,
                                                value: opt.value.n
                                            }))}
                                            onSelect={handleFontSelect}
                                            multiSelect={true}
                                            value={selectedFonts.map(font => ({
                                                label: font.n,
                                                value: font.n
                                            }))}
                                        />

                                        <div className="flex flex-wrap gap-2">
                                            {popularFonts.map(font => (
                                                <Chip
                                                    key={font.n}
                                                    label={font.n}
                                                    isSelected={selectedFonts.includes(font.n)}
                                                    onSelect={() => handleChipSelect(font)}
                                                    showX={false}
                                                    size="small"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 my-3">Select main body font</p>
                                    <Dropdown
                                        placeholder="Choose main font"
                                        options={[
                                            { label: "System default", value: "" },
                                            ...selectedFonts.map(font => ({ label: font.n, value: font.n }))
                                        ]}
                                        onSelect={handleMainFontSelect}
                                        value={{ label: mainFontValue || "System default", value: mainFontValue }}
                                    />
                                </CollapsibleSection>

                                <CollapsibleSection
                                    title="Framework Configuration"
                                    isOpen={openSections.includes('ui-framework')}
                                    onToggle={() => toggleSection('ui-framework')}
                                >
                                    <p className="text-gray-300 my-3">Select a framework to configure your project</p>
                                    {usedUiFrameworks.filter(fw => fw !== 'theme').length > 1 && (
                                        <motion.div
                                            key="warning-message"
                                            initial={false}
                                            animate={{
                                                opacity: 1,
                                                height: 'auto',
                                                marginBottom: 16,
                                                transition: { duration: 0.2 }
                                            }}
                                            style={{
                                                opacity: 0,
                                                height: 0,
                                                marginBottom: 0
                                            }}
                                            className="w-full overflow-hidden bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4"
                                        >
                                            <div className="p-3">
                                                <div className="flex items-start gap-2 text-yellow-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium">Multiple UI Frameworks Selected</p>
                                                        <p className="text-xs opacity-80 mt-1">Using multiple UI frameworks simultaneously may lead to conflicts and increased bundle size. Consider selecting just one for optimal performance.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    <div className="flex flex-wrap gap-4 w-full">
                                        {filterUiFrameworksByTemplate().map((item, index) => {
                                            const framework = uiFrameworkLook[item.id] || uiFrameworkLook.default;

                                            // Check if any version of this framework is selected
                                            const isAnyVersionSelected = framework.versions
                                                ? usedUiFrameworks.some(fw => framework.versions.some(v => v.value === fw))
                                                : usedUiFrameworks.includes(item.id);

                                            // Get selected versions for this framework
                                            const selectedVersions = framework.versions
                                                ? framework.versions.filter(v => usedUiFrameworks.includes(v.value))
                                                : [];

                                            return (
                                                <CardWrapper
                                                    key={index}
                                                    layoutId={`framework-${item.id}`}
                                                    color={framework.color}
                                                    onClick={() => {
                                                        if (framework.versions) {
                                                            if (isAnyVersionSelected) {
                                                                // Remove all versions of this framework
                                                                setUsedUiFrameworks(usedUiFrameworks.filter(fw =>
                                                                    !framework.versions.some(v => v.value === fw)
                                                                ));
                                                            }
                                                        } else {
                                                            addUiFramework(item.id);
                                                        }
                                                    }}
                                                    className="p-4 flex-1 basis-[calc(50%-0.5rem)] transition-all duration-200"
                                                    hoverEffect={false}
                                                    isChecked={isAnyVersionSelected}
                                                >
                                                    <div
                                                        className="flex items-center gap-3 relative min-h-[44px]"
                                                        onMouseEnter={() => setHoveredFramework(item.id)}
                                                        onMouseLeave={() => setHoveredFramework(null)}
                                                    >
                                                        <motion.div
                                                            layoutId={`framework-icon-${item.id}`}
                                                            className="relative"
                                                        >
                                                            <AnimatePresence mode="wait" initial={false}>
                                                                {framework.versions && hoveredFramework === item.id ? (
                                                                    <motion.div
                                                                        className="flex gap-2"
                                                                        initial={{ opacity: 0, width: 40 }}
                                                                        animate={{ opacity: 1, width: "auto" }}
                                                                        exit={{ opacity: 0, width: 40 }}
                                                                        transition={{
                                                                            duration: 0.2,
                                                                            ease: [0.23, 1, 0.32, 1]
                                                                        }}
                                                                        key="version-buttons"
                                                                    >
                                                                        {framework.versions.map((version) => (
                                                                            <motion.button
                                                                                key={version.value}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const isVersionSelected = usedUiFrameworks.includes(version.value);
                                                                                    if (!isVersionSelected && checkIncompatibilities(version.value)) {
                                                                                        return;
                                                                                    }
                                                                                    const filteredFrameworks = usedUiFrameworks.filter(fw =>
                                                                                        !framework.versions.some(v => v.value === fw)
                                                                                    );
                                                                                    if (!isVersionSelected) {
                                                                                        filteredFrameworks.push(version.value);
                                                                                    }
                                                                                    setUsedUiFrameworks(filteredFrameworks);
                                                                                }}
                                                                                className={`p-2 text-sm min-w-10 min-h-10 flex items-center justify-center 
                                                                                        rounded-2xl transition-all duration-200 relative
                                                                                        ${usedUiFrameworks.includes(version.value)
                                                                                        ? 'bg-white/25 ring-[3px] ring-white/90 border border-white/60'
                                                                                        : 'bg-white/5 hover:bg-white/25 hover:ring-[3px] hover:ring-white/70 hover:border hover:border-white/40'}`}
                                                                                style={{
                                                                                    backgroundColor: framework.color,
                                                                                    boxShadow: usedUiFrameworks.includes(version.value)
                                                                                        ? '0 0 10px rgba(255,255,255,0.15), inset 0 0 15px rgba(255,255,255,0.05)'
                                                                                        : 'none',
                                                                                    transform: 'translateZ(0)',
                                                                                }}
                                                                                whileHover={{
                                                                                    boxShadow: '0 0 10px rgba(255,255,255,0.15), inset 0 0 15px rgba(255,255,255,0.05)',
                                                                                    scale: 1.05,
                                                                                    transition: { duration: 0.2 }
                                                                                }}
                                                                            >
                                                                                <span className={`font-semibold ${usedUiFrameworks.includes(version.value)
                                                                                    ? 'text-white'
                                                                                    : 'text-white/80 group-hover:text-white'}`}>
                                                                                    {version.label}
                                                                                </span>
                                                                            </motion.button>
                                                                        ))}
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div
                                                                        key="framework-icon"
                                                                        className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10"
                                                                        style={{ backgroundColor: framework.color }}
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        transition={{
                                                                            duration: 0.2,
                                                                            ease: [0.23, 1, 0.32, 1]
                                                                        }}
                                                                    >
                                                                        {framework.iconText}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>

                                                        <motion.div
                                                            className="flex flex-col flex-1"
                                                            initial={false}
                                                            animate={framework.versions && hoveredFramework === item.id
                                                                ? { opacity: 0.5, x: 10 }
                                                                : { opacity: 1, x: 0 }}
                                                            transition={{
                                                                duration: 0.2,
                                                                ease: [0.23, 1, 0.32, 1]
                                                            }}
                                                        >
                                                            <span className="text-base font-medium text-gray-200">
                                                                {framework.label}
                                                            </span>
                                                            {selectedVersions.length > 0 && framework.versions && hoveredFramework !== item.id && (
                                                                <motion.span
                                                                    initial={{ opacity: 0, y: -4 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{
                                                                        duration: 0.2,
                                                                        ease: [0.23, 1, 0.32, 1]
                                                                    }}
                                                                    className="text-xs text-gray-400 mt-1"
                                                                >
                                                                    {selectedVersions[0].label}
                                                                </motion.span>
                                                            )}
                                                        </motion.div>
                                                    </div>
                                                </CardWrapper>
                                            )
                                        })}
                                    </div>
                                    {getUniqueConfigurations().length > 0 && (
                                        <>
                                            <p className="text-gray-300 my-3">Added configurations:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {getUniqueConfigurations().map((config, index) => (
                                                    <LabelButton
                                                        key={index}
                                                        onClick={() => handleFileClick(config)}
                                                        variant="info"
                                                    >
                                                        {config}
                                                    </LabelButton>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </CollapsibleSection>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col">
                    <div className="flex-none px-6 pt-6 pb-4">
                        <div className="flex items-center justify-between">
                            <LabelButton onClick={handleThemeBack} Icon={ArrowLeft} variant="info">
                                Back to Configuration
                            </LabelButton>

                            <LabelButton
                                onClick={() => window.open(`/theme?t=${initialTheme?.id}&c=${id}`, '_blank')}
                                Icon={ArrowUpRight}
                                variant="info"
                            >
                                Open in theme designer
                            </LabelButton>

                        </div>
                        {initialTheme && <h3 className="text-2xl font-semibold mt-4 text-gray-300 text-center">
                            Theme Configuration
                        </h3>}
                    </div>

                    <div className="flex-1 min-h-0">
                        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-300">
                            <div className="sm:px-6 pb-20">
                                <div className="sm:mx-auto sm:w-full">
                                    <ThemeConfiguratorWrapper
                                        initialTheme={initialTheme}
                                        setTheme={setTheme}
                                        componentId={id}
                                        setDefaultOpenBotInput={setDefaultOpenBotInput}
                                        onBack={onBack}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>


                    {hasChanges.theme && (
                        <div className="flex-none bg-black/30 backdrop-blur-sm rounded-b-xl">
                            <div className="px-6 py-4 flex items-center justify-between">
                                <span className="text-white/30 text-sm">
                                    Theme will be saved on component save
                                </span>
                                <LabelButton
                                    variant="danger"
                                    disabled={saving}
                                    className="min-w-[120px]"
                                    onClick={() => {
                                        handleLoadTheme();
                                        handleThemeBack()
                                    }}
                                >
                                    Revert Theme (load from server)
                                </LabelButton>
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    )
}

export default ConfigurationMenu
