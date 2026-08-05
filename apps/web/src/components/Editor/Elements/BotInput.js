import LoaderCircle from "@/components/Common/LoaderCircle";
import { InputField, Slider } from "@/components/Elements";
import TextArea from "@/components/Elements/TextArea";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CornerRightUp, Loader, Send, ChevronDown, Check, CornerDownLeft, Loader2, CircleStop, CircleAlert, BadgeInfo, XIcon, Lightbulb } from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from 'react-dom';
import ChangeFactor from "./BotInputSnackContent/ChangeFactor";
import ChangeFont from "./BotInputSnackContent/ChangeFont";
import ShimmerText from "./BotInputSnackContent/ShimmerText";
import Images from "./BotInputSnackContent/Images";
import { generateTokens, getCompletionInput, insertTheme } from "@/lib/api";
import useDebounce from "@/utils/debounce";
import EnhancePrompt from "./BotInputSnackContent/EnhancePrompt";
import RemapFiles from "./BotInputSnackContent/RemapFiles";
import ThemeEdit from "./BotInputSnackContent/ThemeEdit";
import GeneratePreview from "./BotInputSnackContent/GeneratePreview";
import HelpContent from "./BotInputSnackContent/HelpContent";
import { useUser } from "@/auth/UseUser";


const triggerKeywords = [
    // Original keywords
    'change',
    'font',
    'hue',
    'typography',
    'color',
    'theme',
    'saturations',
    'update',
    'colour',
    'palette',
    'lightness',
    'darkness',
    'factor',
    'intensity',
    'level',
    'scale',
    'shift',
    'tone',
    'value',

    // Style modifications
    'style',
    'adjust',
    'modify',
    'transform',
    'convert',
    'redesign',
    'customize',
    'alter',
    'revise',

    // Visual elements
    'background',
    'gradient',
    'shade',
    'tint',
    'tone',
    'contrast',
    'brightness',
    'dark',
    'light',
    'layout',

    // UI specific
    'look',
    'feel',
    'appearance',
    'design',
    'interface',
    'display',
    'view',
    'mode',

    // Actions
    'make',
    'set',
    'switch',
    'toggle',
    'apply',
    'generate',
    'need',
    'want',
    'suggest',
    'recommend',
    'suggestions',
    'recommendations',
    'create'
];
const SNACK_CONFIG = {
    'change-font': {
        component: ({ fonts, selectFont, openMenu }) => <ChangeFont fonts={fonts} selectFont={selectFont} openMenu={openMenu} />,
        height: 80
    },
    'change-factor': {
        component: ({ factor, theme, setTheme, openMenu }) => <ChangeFactor factor={factor} theme={theme} setTheme={setTheme} openMenu={openMenu} />,
        height: 80
    },
    'thinking': {
        component: () => <ShimmerText text="Thinking..." />,
        height: 60
    },
    'generating': {
        component: () => <ShimmerText text="Generating..." />,
        height: 60
    },
    'error': {
        component: ({ customError }) => <div className="flex items-center justify-center h-full gap-3"><CircleAlert className="w-5 h-5 text-red-500" /><p className="text-red-500">{customError || "Error occurred, please try again."}</p></div>,
        height: 60
    },
    'enhance-prompt': {
        component: ({ enhancePrompt, setPrompt, setSnackType, setSnackHeight }) => <EnhancePrompt enhancePrompt={enhancePrompt} setPrompt={setPrompt} setSnackType={setSnackType} setSnackHeight={setSnackHeight} />,
        height: 100
    },
    'images': {
        component: ({ images, onRemove }) => <Images images={images} onRemove={onRemove} />,
        height: 60
    },
    'remap-files': {
        component: ({ files, apply, close, setSnackHeight, usedUiFrameworks, theme, userPlan, activeFile }) => <RemapFiles files={files} apply={apply} close={close} setSnackHeight={setSnackHeight} usedUiFrameworks={usedUiFrameworks} theme={theme} userPlan={userPlan} activeFile={activeFile} />,
        height: 85
    },
    'preview': {
        component: ({ files, apply, close, setSnackHeight, activeFile, theme, userPlan, deleteFile, handleFileSwitch }) => <GeneratePreview files={files} apply={apply} close={close} setSnackHeight={setSnackHeight} activeFile={activeFile} theme={theme} userPlan={userPlan} deleteFile={deleteFile} handleFileSwitch={handleFileSwitch} />,
        height: 85
    },
    'theme-only': {
        component: ({ apply, close }) => <ThemeEdit apply={apply} close={close} />,
        height: 85
    },
};

const SNACK_STATES = {
    IDLE: 'IDLE',
    IMAGES: 'IMAGES',
    CHANGE_FONT: 'CHANGE_FONT',
    CHANGE_FACTOR: 'CHANGE_FACTOR',
    ENHANCE_PROMPT: 'ENHANCE_PROMPT',
    REMAP_FILES: 'REMAP_FILES',
    GENERATE_PREVIEW: 'GENERATE_PREVIEW',
    THEME_ONLY: 'THEME_ONLY',
    THINKING: 'THINKING',
    GENERATING: 'GENERATING',
    PREVIEW: 'PREVIEW',
    ERROR: 'ERROR',
    HELP: 'HELP'
};

const snackStateToType = {
    [SNACK_STATES.IMAGES]: 'images',
    [SNACK_STATES.CHANGE_FONT]: 'change-font',
    [SNACK_STATES.CHANGE_FACTOR]: 'change-factor',
    [SNACK_STATES.ENHANCE_PROMPT]: 'enhance-prompt',
    [SNACK_STATES.REMAP_FILES]: 'remap-files',
    [SNACK_STATES.GENERATE_PREVIEW]: 'generate-preview',
    [SNACK_STATES.THEME_ONLY]: 'theme-only',
    [SNACK_STATES.THINKING]: 'thinking',
    [SNACK_STATES.GENERATING]: 'generating',
    [SNACK_STATES.PREVIEW]: 'preview',
    [SNACK_STATES.ERROR]: 'error',
    [SNACK_STATES.HELP]: 'help'
};

const BotInput = ({
    isGenerating,
    handleGenerateCode,
    showLimitModal,
    hasChanges,
    openMenu,
    selectFont,
    theme,
    setTheme,
    usedUiFrameworks,
    componentId,
    defaultOpen,
    setDefaultOpenBotInput,
    files,
    setFiles,
    openHelpModal,
    activeFile,
    handleFileSwitch,
    isSetupServer
}) => {
    const { user } = useUser();
    const [prompt, setPrompt] = useState('');
    const [showBot, setShowBot] = useState(defaultOpen || false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedOption, setSelectedOption] = useState({ label: 'Generate component', value: 'component' });
    const [pastedImages, setPastedImages] = useState([]);
    const buttonRef = useRef(null);
    const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
    const [snackVisible, setSnackVisible] = useState(false);
    const [snackHeight, setSnackHeight] = useState(0);
    const [fonts, setFonts] = useState([]);
    const [factor, setFactor] = useState({ name: '' });
    const [cachedInputSuggestions, setCachedInputSuggestions] = useState([]);
    const [oldTheme, setOldTheme] = useState(theme);
    const [enhancePrompt, setEnhancePrompt] = useState('');
    const [deepThink, setDeepThink] = useState(false);
    const [isThemeGenerating, setIsThemeGenerating] = useState(false);
    const [showBoilerplate, setShowBoilerplate] = useState(() => {
        if (isSetupServer) return false;
        const showBoilerplateIds = JSON.parse(localStorage.getItem('showBoilerplateIds') || '[]');
        return !showBoilerplateIds.includes(componentId);
    });
    const [snackState, setSnackState] = useState(SNACK_STATES.IDLE);
    // Memoize options to prevent re-renders
    const options = useMemo(() => {
        const baseOptions = [
            { label: 'Generate component', value: 'component' },
        ];
        if (usedUiFrameworks?.includes('theme')) {
            baseOptions.push({ label: 'Generate only theme', value: 'theme-only' });
        }
        return baseOptions;
    }, [usedUiFrameworks]);

    // Define snackMachine first
    const [snackMachine] = useState(() => ({
        transition: (currentState, action) => {
            switch (action.type) {
                case 'SET_IMAGES':
                    return SNACK_STATES.IMAGES;
                case 'SET_FONT':
                    return SNACK_STATES.CHANGE_FONT;
                case 'SET_FACTOR':
                    return SNACK_STATES.CHANGE_FACTOR;
                case 'SET_ENHANCE':
                    return SNACK_STATES.ENHANCE_PROMPT;
                case 'SET_REMAP':
                    return SNACK_STATES.REMAP_FILES;
                case 'SET_PREVIEW':
                    return SNACK_STATES.PREVIEW;
                case 'SET_THEME':
                    return SNACK_STATES.THEME_ONLY;
                case 'SET_THINKING':
                    return SNACK_STATES.THINKING;
                case 'SET_GENERATING':
                    return SNACK_STATES.GENERATING;
                case 'SET_ERROR':
                    return SNACK_STATES.ERROR;
                case 'RESET':
                    return SNACK_STATES.IDLE;
                default:
                    return currentState;
            }
        }
    }));

    // Define transitionSnack before its usages
    const transitionSnack = useCallback((action) => {
        const newState = snackMachine.transition(snackState, action);
        if (newState !== snackState) {
            setSnackState(newState);
            const newType = snackStateToType[newState] || '';
            const newHeight = newType ? SNACK_CONFIG[newType]?.height || 0 : 0;
            setSnackHeight(newHeight);
            setSnackVisible(newState !== SNACK_STATES.IDLE);
        }
    }, [snackState, snackMachine]);

    const handlePaste = useCallback(async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageItems = Array.from(items).filter(item => item.type.startsWith('image'));

        if (imageItems.length > 0) {
            e.preventDefault();
            const processImage = async (item) => {
                const blob = item.getAsFile();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            };

            const newImages = await Promise.all(imageItems.map(processImage));
            setPastedImages(prev => [...prev, ...newImages]);
            transitionSnack({ type: 'SET_IMAGES' });
        }
    }, [transitionSnack]);

    const calculateRows = useCallback((text) => {
        const lines = text.split('\n').length;
        const charsPerLine = 50; // Approximate characters per line
        const wrappedLines = Math.ceil(text.length / charsPerLine);
        return Math.min(Math.max(lines + wrappedLines - 1, 1), 6); // Min 1, max 6 rows
    }, []);

    const handleTextChange = useCallback((e) => {
        const newValue = e.target.value;
        setPrompt(newValue);
    }, []);

    const removeImage = useCallback((index) => {
        setPastedImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            if (newImages.length === 0) {
                transitionSnack({ type: 'RESET' });
            }
            return newImages;
        });
    }, [transitionSnack]);

    const handleDropdownClick = useCallback((e) => {
        e.stopPropagation();
        setShowDropdown(prev => !prev);
    }, []);

    const getFontData = async (optionFonts) => {
        try {
            const response = await fetch('https://cdn.compify.app/font-list.json')
            const fonts = await response.json()
            return fonts.filter(font => optionFonts.includes(font.n))
        } catch (error) {
            console.error('Failed to load fonts:', error)
            return []
        }
    }

    const setType = useCallback(async () => {
        if (prompt.length > 100 ||
            selectedOption.value === 'with-theme' ||
            selectedOption.value === 'theme-only' ||
            cachedInputSuggestions.some(suggestion => suggestion.prompt === prompt)) {
            return;
        }

        try {
            const response = await getCompletionInput({ prompt, fa: theme?.factors?.map(f => f?.key) });
            if (response.data.type) {
                switch (response.data.type) {
                    case 'font':
                        const fontData = await getFontData(response.data.options);
                        setFonts(fontData);
                        transitionSnack({ type: 'SET_FONT' });
                        setCachedInputSuggestions(prev => [...prev, { prompt, response: { type: 'font', options: fontData } }]);
                        break;
                    case 'factor':
                        setFactor(response.data.key);
                        transitionSnack({ type: 'SET_FACTOR' });
                        setCachedInputSuggestions(prev => [...prev, { prompt, response: { type: 'factor', key: response.data.key } }]);
                        break;
                    case 'enhance':
                        setEnhancePrompt(response.data.value);
                        transitionSnack({ type: 'SET_ENHANCE' });
                        setCachedInputSuggestions(prev => [...prev, { prompt, response: { type: 'enhance', prompt: response.data.value } }]);
                        break;
                }
            }
        } catch (error) {
            console.error('Error in setType:', error);
        }
    }, [prompt, selectedOption.value, theme?.factors, cachedInputSuggestions, getFontData, transitionSnack]);

    const debouncedSetType = useDebounce(setType, 1000);

    useEffect(() => {
        if (isGenerating) {
            transitionSnack({ type: 'SET_GENERATING' });
            return;
        }

        if (isThemeGenerating) {
            transitionSnack({ type: 'SET_THINKING' });
            return;
        }
        if (pastedImages.length > 0) {
            transitionSnack({ type: 'SET_IMAGES' });
            return;
        }

        // Only check prompt-dependent conditions if prompt exists
        if (prompt) {
            if (usedUiFrameworks?.includes('theme') && prompt.includes('/remap')) {
                transitionSnack({ type: 'SET_REMAP' });
            } else if (prompt.includes('/preview')) {
                transitionSnack({ type: 'SET_PREVIEW' });
            } else if (selectedOption.value === 'component' && triggerKeywords.some(keyword => prompt.includes(keyword))) {
                debouncedSetType();
            }
            return;
        }

        // If no other conditions are met and no images, reset
        if (pastedImages.length === 0) {
            transitionSnack({ type: 'RESET' });
        }
    }, [prompt, pastedImages.length, isGenerating, isThemeGenerating, selectedOption.value, usedUiFrameworks, debouncedSetType, transitionSnack]);

    // Separate effect to handle generation state changes
    useEffect(() => {
        if (isGenerating) {
            transitionSnack({ type: 'SET_GENERATING' });
        } else if (snackState === SNACK_STATES.GENERATING) {
            // Only reset if we were in generating state
            transitionSnack({ type: 'RESET' });
        }
    }, [isGenerating, snackState, transitionSnack]);

    // Separate effect to handle theme generation state changes
    useEffect(() => {
        if (isThemeGenerating) {
            transitionSnack({ type: 'SET_THINKING' });
        } else if (snackState === SNACK_STATES.THINKING) {
            // Only reset if we were in thinking state
            transitionSnack({ type: 'RESET' });
        }
    }, [isThemeGenerating, snackState, transitionSnack]);

    const handleThemeAccept = async () => {
        transitionSnack({ type: 'SET_REMAP' });
        if (!theme.id) {
            const resp = await insertTheme({ factors: theme?.factors, groups: theme?.groups, values: theme?.values, componentId: componentId });
            if (resp.status === 201) {
                setTheme(resp.data);
            }
        }
    }
    const handleRemapAccept = async (newFiles) => {
        setFiles({ ...files, ...newFiles });
    }

    const themeGenerator = async (prompt) => {
        setOldTheme(theme);
        setIsThemeGenerating(true);
        try {
            const response = await generateTokens({ prompt, currentTokens: { factors: theme?.factors, groups: theme?.groups, values: theme?.values }, usedUiFrameworks });
            if (response.status === 201) {
                const themeData = response.data;
                setTheme({ ...theme, factors: themeData?.factors, groups: themeData?.groups, values: themeData?.values });
                setIsThemeGenerating(false);
                return 'ok'
            }
            setIsThemeGenerating(false);
            return 'error'
        } catch (error) {
            setIsThemeGenerating(false);
            return 'error';
        }
    }

    const handleSumbit = async (prompt, selectedOption, pastedImages) => {
        if (selectedOption.value === 'component') {
            handleGenerateCode(prompt, selectedOption, pastedImages, deepThink);
        } else if (selectedOption.value === 'theme-only') {
            transitionSnack({ type: 'SET_THINKING' });
            const response = await themeGenerator(prompt);
            if (response === 'ok') {
                transitionSnack({ type: 'SET_THEME' });
            } else {
                transitionSnack({ type: 'SET_ERROR' });
            }
        } else if (selectedOption.value === 'with-theme') {
            transitionSnack({ type: 'SET_THINKING' });
            const response = await themeGenerator(prompt);
            await handleGenerateCode(prompt, selectedOption, pastedImages, deepThink);
            if (response === 'ok') {
                transitionSnack({ type: 'SET_THEME' });
            }
        }
    }
    const acceptMap = {
        'theme-only': handleThemeAccept,
        'remap-files': handleRemapAccept,
        'preview': handleRemapAccept
    }

    const handleDeleteFile = (file) => {
        setFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[file];
            return newFiles;
        });
    }

    const renderSnackContent = () => {
        const currentType = snackStateToType[snackState];
        if (!currentType) return null;

        if (currentType === 'thinking') {
            return SNACK_CONFIG['thinking'].component();
        }

        const config = SNACK_CONFIG[currentType];
        if (!config) return null;

        const props = {
            images: pastedImages,
            onRemove: removeImage,
            fonts,
            selectFont,
            openMenu,
            factor,
            theme,
            setTheme,
            enhancePrompt,
            setPrompt,
            activeFile,
            setSnackType: () => transitionSnack({ type: 'RESET' }),
            files,
            apply: acceptMap[currentType],
            close: () => {
                if (currentType === 'theme-only') setTheme(oldTheme);
                setPrompt('');
                transitionSnack({ type: 'RESET' });
                setSnackVisible(false);
            },
            customError: user?.plan === "FREE" ? "Free models can't handle this task." : null,
            userPlan: user?.plan,
            setSnackHeight,
            deleteFile: handleDeleteFile,
            usedUiFrameworks,
            handleFileSwitch
        };

        return <config.component {...props} />;
    };

    useEffect(() => {
        if (defaultOpen) {
            if (usedUiFrameworks?.includes('theme')) {
                setSelectedOption({ label: 'Generate with new theme', value: 'theme-only' });
            }
            setDefaultOpenBotInput(false);
        }
        if (showDropdown && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 120;

            setDropdownCoords({
                top: spaceBelow < dropdownHeight ? rect.top - dropdownHeight : rect.bottom,
                left: rect.left - 10,
                width: rect.width + 35
            });
        }
    }, [showDropdown]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleBoilerplateCreate = () => {
        const boilerplatePrompt = `Create boilerplate for ${activeFile.split(".")[0].replace("/", "")} component.`;
        setPrompt(boilerplatePrompt);
        setShowBot(true);
        handleSumbit(boilerplatePrompt, selectedOption, pastedImages);

        localStorage.setItem('showBoilerplateIds', JSON.stringify([componentId]));

        setShowBoilerplate(false);
    };

    const handleBoilerplateClose = () => {
        localStorage.setItem('showBoilerplateIds', JSON.stringify([componentId]));

        setShowBoilerplate(false);
    };

    return (
        <div className="absolute bottom-3 w-full h-[400px] overflow-hidden pointer-events-none">
            <div className="relative px-4 flex items-end h-full gap-4 pb-1">
                <motion.button
                    className={`bg-white/10 group-hover:bg-black/20 text-white rounded-full min-w-12 min-h-12 justify-center items-center flex focus:outline-none backdrop-blur-sm z-10 pointer-events-auto ${showBot ? 'sm:flex hidden' : 'flex'
                        }`}
                    onClick={() => setShowBot(!showBot)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                        willChange: 'transform',
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    <Bot size={24} />
                </motion.button>
                {(!showBot && !activeFile.includes("Untitled1") && showBoilerplate) &&
                    <motion.div
                        className="bg-white/10 backdrop-blur-3xl absolute sm:left-[4.5rem] sm:right-4 left-4 right-4 pointer-events-auto pl-3 pr-2 py-2 rounded-2xl flex items-center justify-between"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 20 }}
                    >
                        <p className="text-white/80 text-sm">
                            Would you like to create a boilerplate for <span className="text-white font-medium">{activeFile.split(".")[0].replace("/", "")}</span>?
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBoilerplateCreate}
                            >
                                Create
                            </motion.button>
                            <motion.button
                                className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm font-medium"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBoilerplateClose}
                            >
                                Close
                            </motion.button>
                        </div>
                    </motion.div>
                }
                {showBot && <motion.button
                    className={`bg-white/10 absolute bottom-14 left-7 group-hover:bg-black/20 text-white rounded-full min-w-6 min-h-6 justify-center items-center flex focus:outline-none backdrop-blur-sm z-10 pointer-events-auto ${showBot ? 'sm:flex hidden' : 'flex'
                        }`}
                    onClick={() => openHelpModal({ title: 'Help', children: <HelpContent /> })}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                        willChange: 'transform',
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden'
                    }}
                >
                    ?
                </motion.button>}
                <AnimatePresence mode="wait">
                    {showBot && (
                        <motion.div
                            initial={{
                                y: 40,
                                scale: 0.92,
                                rotateX: 10
                            }}
                            animate={{
                                y: 0,
                                scale: 1,
                                rotateX: 0
                            }}
                            exit={{
                                opacity: 0,
                                y: 30,
                                scale: 0.94,
                                rotateX: 5
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                                mass: 1,
                                opacity: {
                                    duration: 0.2,
                                    ease: "easeOut"
                                }
                            }}
                            style={{
                                transformOrigin: "bottom",
                                transformPerspective: 1000
                            }}
                            className="absolute sm:left-[4.5rem] sm:right-4 left-0 right-0 pointer-events-auto"
                        >
                            <AnimatePresence>
                                {snackVisible && (
                                    <motion.div
                                        initial={{ y: snackHeight, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: snackHeight, opacity: 0 }}
                                        transition={{ type: "spring", damping: 20 }}
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                            boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
                                            border: '1px solid rgba(255,255,255,0.18)',
                                            backdropFilter: 'blur(20px)',
                                            WebkitBackdropFilter: 'blur(20px)',
                                            position: 'absolute',
                                            inset: 0,
                                            zIndex: 0,
                                            top: -snackHeight + 15,
                                            height: snackHeight,
                                            borderTopLeftRadius: '1.2rem',
                                            borderTopRightRadius: '1.2rem',
                                            color: 'rgb(156, 163, 175)',
                                            padding: "5px 15px 20px 15px",
                                            display: 'flex',
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '0rem',
                                        }}>

                                        {renderSnackContent()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {showLimitModal ? (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-sm border border-white/10">
                                    No credits remaining. Please upgrade your plan to continue generating code.
                                </div>
                            ) : (
                                <TextArea
                                    enableAnimation={!snackVisible}
                                    placeholder="Enter prompt to generate code"
                                    value={prompt}
                                    onChange={handleTextChange}
                                    onPaste={handlePaste}
                                    onSubmit={() => {
                                        if (isGenerating) {
                                            handleGenerateCode(null);
                                        } else if (isThemeGenerating) {
                                            themeGenerator(prompt);
                                        } else {
                                            handleSumbit(prompt, selectedOption, pastedImages);
                                        }
                                    }}
                                    showButton={true}
                                    RightIcon={isThemeGenerating || isGenerating ? CircleStop : CornerDownLeft}
                                    iconClassName={`text-gray-400 w-4 h-4 ${isThemeGenerating || isGenerating ? '' : ''}`}
                                    disabled={false}
                                    blurBackground={true}
                                    rows={calculateRows(prompt)}
                                    bottomElement={
                                        <div className="relative w-full pl-4 mb-2 flex items-center justify-start gap-2">
                                            <button
                                                ref={buttonRef}
                                                onClick={handleDropdownClick}
                                                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors pointer-events-auto"
                                            >
                                                {selectedOption.label}
                                                <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                            </button>
                                            {user?.plan === "FREE" ? <p className="text-xs text-white/50">
                                                <span className="hidden sm:block">*Free model. Upgrade now for superior results.</span>
                                                <span className="block sm:hidden">*Free model. Upgrade now.</span>
                                            </p> : <>
                                                {/* <motion.div
                                                className={`px-2.5 py-1 rounded-full ${deepThink ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-white/80'} cursor-pointer flex items-center gap-1`}
                                                whileHover={{ padding: '4px 16px' }}
                                                onClick={() => setDeepThink(!deepThink)}
                                            >
                                                <Lightbulb size={14} />
                                                <span>DeepThink</span>
                                            </motion.div> */}
                                            </>
                                            }
                                            {showDropdown && createPortal(
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="fixed inset-0 z-[9998]"
                                                >
                                                    <div
                                                        className="fixed inset-0 bg-transparent"
                                                        onClick={() => setShowDropdown(false)}
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="fixed backdrop-blur-2xl rounded-lg shadow-2xl overflow-hidden z-[9999]"
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(20,20,20,1) 0%, rgba(30,30,30,1) 100%)',
                                                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                                                            width: dropdownCoords.width,
                                                            left: dropdownCoords.left,
                                                            top: dropdownCoords.top,
                                                        }}
                                                    >
                                                        {options.map((option) => (
                                                            <motion.div
                                                                key={option.value}
                                                                className={`w-full px-3 py-1 h-[40px] flex items-center text-sm justify-between cursor-pointer ${selectedOption.value === option.value
                                                                    ? 'bg-blue-500/20'
                                                                    : 'hover:bg-white/5'
                                                                    }`}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedOption(option);
                                                                    setShowDropdown(false);
                                                                }}
                                                            >
                                                                <span className="truncate">{option.label}</span>
                                                                {selectedOption.value === option.value && (
                                                                    <motion.div
                                                                        initial={{ scale: 0, rotate: -180 }}
                                                                        animate={{ scale: 1, rotate: 0 }}
                                                                        transition={{
                                                                            type: "spring",
                                                                            stiffness: 260,
                                                                            damping: 20
                                                                        }}
                                                                    >
                                                                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />
                                                                    </motion.div>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </motion.div>
                                                </motion.div>,
                                                document.body
                                            )}
                                        </div>
                                    }
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BotInput;
