import { cdnUrl } from '@/constains';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Chip from '../Elements/Chip';
import { Smartphone, Maximize2, Code, FileJson2, Settings, Plus, RotateCw, SquareTerminal, Terminal } from 'lucide-react';
import './overwrite.css';
import SettingsMenu from './settings-menu';
import DiffHighlightingEditor from './DiffHighlightingEditor';
import { SandpackProvider, SandpackLayout, SandpackPreview, useSandpack } from "compify-pack";
import { fetchFrameworkFiles, generateTemplateFiles, getUIConfigFiles } from './Templates/common';
import LoaderCube from '../Common/Loader';
import MiniButton from '../Elements/MiniButton';
import ConfigurationMenu from './Elements/ConfigurationMenu';
import shadcnuiDeps from './Templates/Deps/shadcnui-deps';
import FileMenu from './Elements/FileMenu';
import { doubleHash } from '../Project/utils/double-hash';
import ThemeCompiler from './ThemeCompiler';
import LoaderCircleTrace from '../Common/LoaderCircle';
import { fetchLatestVersion } from './utils/fetch-version';
import HelpModal from '../Elements/HelpModal';

const Editor = ({
    initialFiles,
    template,
    name,
    getFiles,
    requestImage,
    setRequestImage,
    onImageReceived,
    previewSettings,
    setPreviewSettings,
    usedUiFrameworks,
    setUsedUiFrameworks,
    onSave,
    textHash,
    initialTheme,
    setTheme,
    id,
    handleLoadTheme,
    setUsedDeps,
    usedDeps,
    setTextHash,
    activeFile,
    setActiveFile,
    onGifReceived,
    setPreviewFile,
    previewFile,
    isSetupServer
}) => {
    const templateFiles = useMemo(() =>
        generateTemplateFiles(template, previewSettings, usedUiFrameworks, initialFiles),
        [template, previewSettings, usedUiFrameworks, initialFiles]
    );
    const files = useMemo(() => ({
        ...templateFiles,
        ...initialFiles
    }), [templateFiles, initialFiles]);
    const [filesState, setFilesState] = useState(files);
    const mainFile = Object.entries(files).find(([_, data]) => data.main);
    const firstPassedActiveFileRef = useRef(activeFile);
    const firstNonHiddenFile = Object.entries(files).find(([_, data]) => !data?.hidden)?.[0];
    const initialActiveFile = firstPassedActiveFileRef.current || firstNonHiddenFile;
    const currentCode = useMemo(() =>
        filesState[activeFile]?.code || '',
        [filesState, activeFile]
    );
    const [editorWidth, setEditorWidth] = useState('60%');
    const [isResizing, setIsResizing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showAdditionalMenu, setShowAdditionalMenu] = useState(false);
    const [defaultOpenBotInput, setDefaultOpenBotInput] = useState(false);
    const [screenName, setScreenName] = useState('');
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpModalContent, setHelpModalContent] = useState(null);
    const resizeContainerRef = useRef(null);
    const dividerRef = useRef(null);
    const [debouncedUpdateTimer, setDebouncedUpdateTimer] = useState(null);
    const startResize = useCallback((e) => {
        setIsResizing(true);
        e.preventDefault();
    }, []);

    const resize = useCallback((e) => {
        if (isResizing && resizeContainerRef.current) {
            const containerRect = resizeContainerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;
            const containerWidth = containerRect.width;
            const percentage = (newWidth / containerWidth) * 100;
            const clampedPercentage = Math.min(Math.max(percentage, 35), 90);
            setEditorWidth(`${clampedPercentage}%`);
        }
    }, [isResizing]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                e.preventDefault();
                resize(e);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (window?.innerWidth < 768) {
            setEditorWidth('0%');
            setSelectedScreen('code');
        }

        if (isResizing) {
            window?.addEventListener('mousemove', handleMouseMove);
            window?.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window?.removeEventListener('mousemove', handleMouseMove);
            window?.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resize]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave]);

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
        setIsMenuOpen(true);
    };

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
        setAnchorEl(null);
    };


    const [selectedScreen, setSelectedScreen] = useState('');

    const screenOptions = [
        { label: 'Phone', value: 'phone', icon: Smartphone, tooltip: 'Phone Preview' },
        { label: 'Fullscreen', value: 'fullscreen', icon: Maximize2, tooltip: 'Fullscreen Preview' },
    ];

    const handleShowCode = () => {
        setSelectedScreen(selectedScreen === 'code' ? '' : 'code');
        setEditorWidth(selectedScreen === 'code' ? '100%' : '0%');
    }

    const packagesToIgnore = ['react', 'react-dom', 'react-native', 'react-native-web'];
    const getAllUsedPackages = (code) => {
        const importRegex = /import\s+(?:(?:\*\s+as\s+\w+|(?:{[\s\S]*?}|\w+))\s+from\s+['"](.+?)['"]|['"](.+?)['"])\s*;?/g;
        const matches = [...code.matchAll(importRegex)];
        const packageNames = matches.map(match => match[1] || match[2])
            .filter(pkg => !pkg.startsWith('./') && !pkg.startsWith('@/'))
            .filter(pkg => !((template === 'nextjs' || template === 'nextjs-ts') && pkg.startsWith('next/')))
            .map(pkg => {
                const parts = pkg.split('/');
                if (pkg.startsWith('@')) {
                    return `${parts[0]}/${parts[1]}`;
                }
                return parts[0];
            });
        const filteredPackages = packageNames.filter(pkg => !packagesToIgnore.includes(pkg));

        const uniquePackages = [...new Set(filteredPackages)];
        return uniquePackages;
    }

    useEffect(() => {
        const previewContainer = document.querySelector('.sp-preview-container');
        const previewIframe = document.querySelector('.sp-preview-iframe');
        if (previewContainer && previewIframe) {
            const settings = { ...previewSettings };
            if (selectedScreen === 'phone') {
                previewIframe.contentWindow.postMessage({
                    type: 'preview-settings',
                    settings: {
                        ...settings,
                        uiFrameworks: usedUiFrameworks,
                        // zoomLevel: 0.8,
                    },
                }, '*');
            } else {
                previewIframe.contentWindow.postMessage({
                    type: 'preview-settings',
                    settings: settings,
                    uiFrameworks: usedUiFrameworks,
                }, '*');
            }
        }
    }, [previewSettings, selectedScreen, usedUiFrameworks]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'image-data') {
                if (event.data.dataUrl) {
                    onImageReceived(event.data.dataUrl);
                } else {
                    console.error('Received image-data message, but dataUrl is missing');
                }
            }
            if (event.data.type === 'gif-data') {
                if (event.data.captures) {
                    onGifReceived(event.data.captures);
                } else {
                    console.error('Received gif-data message, but captures are missing');
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onImageReceived]);

    useEffect(() => {
        if (requestImage) {
            const iframe = document.querySelector('.sp-preview-iframe');
            if (iframe) {
                if (activeFile.includes('.preview')) {
                    iframe.contentWindow.postMessage({ type: 'get-gif' }, '*');
                } else {
                    iframe.contentWindow.postMessage({ type: 'get-image' }, '*');
                }
                setRequestImage(false);
            } else {
                console.error('Iframe not found when trying to request image');
            }
        }
    }, [requestImage, setRequestImage]);

    const getLanguage = () => {
        //get active file extension
        const extension = activeFile.split('.').pop();
        const langMap = {
            'react': 'jsx',
            'react-ts': 'tsx',
            'vue': 'vue',
            'svelte': 'svelte',
            'html': 'html',
            'css': 'css',
            'javascript': 'javascript',
            'typescript': 'typescript',
            'nextjs': 'jsx',
            'nextjs-ts': 'tsx',
            'html': 'html',
            'ts': 'typescript',
            'react-native': 'jsx',
            'react-native-ts': 'tsx',
        }
        const extentionMap = {
            'tsx': 'tsx',
            'jsx': 'javascript',
            'css': 'css',
            'ts': 'typescript',
            'js': 'javascript',
        }
        return extentionMap[extension] || extension || langMap[template]
    }

    const getTemplate = () => {
        switch (template) {
            case 'nextjs':
                return 'react';
            case 'nextjs-ts':
                return 'react-ts';
            case 'react-native':
                return 'react';
            case 'react-native-ts':
                return 'react-ts';
            case 'html':
                return 'static';
            default:
                return template;
        }
    }

    const checkIfFileIsAnyJs = (fileName) => {
        // Check if file ends with any JS-related extension
        return /\.(js|jsx|ts|tsx)$/.test(fileName);
    }

    const updateDependencies = useCallback(async (fileName, packages) => {
        // Skip if not a JS file
        if (!checkIfFileIsAnyJs(fileName)) {
            return;
        }

        setUsedDeps(prev => {
            const newDeps = { ...prev };
            const filePackages = {};
            packages.forEach(async (pkg) => {
                const pkgName = typeof pkg === 'string' ? pkg : pkg.name;

                if (prev?.global?.[pkgName]) {
                    filePackages[pkgName] = prev.global[pkgName];
                } else {
                    let existingVersion = null;
                    if (prev && prev.files && typeof prev.files === 'object') {
                        Object.values(prev.files).forEach(file => {
                            if (file?.[pkgName]) existingVersion = file[pkgName];
                        });
                    }
                    filePackages[pkgName] = existingVersion || await fetchLatestVersion(pkgName);
                }
            });
            newDeps.files = {
                ...prev?.files,
                [fileName]: filePackages
            };

            return newDeps;
        });
    }, []);

    const getExternalResources = () => {
        const urls = []
        const externalResources = {
            'tailwind': ["https://cdn.tailwindcss.com"],
            'tailwind-ts': ["https://cdn.tailwindcss.com"],
            'tailwind-v4': [`${cdnUrl}/tailwindv4.js`],
            'tailwind-ts-v4': [`${cdnUrl}/tailwindv4.js`],
            'bootstrap': [
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
            ],
            'shadcn': ["https://cdn.tailwindcss.com"],
            'daisyui': ["https://cdn.tailwindcss.com"],
            'daisyui-ts': ["https://cdn.tailwindcss.com"],
        }
        usedUiFrameworks.forEach(framework => {
            if (externalResources[framework]) {
                urls.push(...externalResources[framework])
            }
        })
        return urls
    }

    const memoizedDependencies = useMemo(() => ({
        ...(usedDeps?.global || {}),
        ...(usedDeps?.files ? Object.values(usedDeps.files).reduce((acc, fileDeps) => ({
            ...acc,
            ...fileDeps
        }), {}) : {})
    }), [usedDeps]);

    const closeConfigurationMenu = () => {
        setActiveFile(initialActiveFile);
        setScreenName('');
        setShowAdditionalMenu(false);
    }

    const handleConfigMenuOpen = () => {
        if (window?.innerWidth < 768) {
            setSelectedScreen('code');
            setEditorWidth('100%');
        }
        if (showAdditionalMenu) {
            closeConfigurationMenu();
        } else {
            setShowAdditionalMenu(true);
        }
    }

    const handleCodeUpdate = useCallback((newCode) => {
        // First check if code actually changed
        if (filesState[activeFile]?.code === newCode) {
            return; // Don't update if code hasn't changed
        }

        // Immediately check for new dependencies on significant changes
        const prevPackages = getAllUsedPackages(filesState[activeFile]?.code || '');
        const newPackages = getAllUsedPackages(newCode);

        // If packages changed, update immediately
        if (JSON.stringify(prevPackages) !== JSON.stringify(newPackages)) {
            updateDependencies(activeFile, newPackages);
        }

        // Update file state
        setFilesState(prev => ({
            ...prev,
            [activeFile]: {
                ...prev[activeFile],
                code: newCode
            }
        }));

        // Still keep debounced updates for typing
        if (debouncedUpdateTimer) {
            clearTimeout(debouncedUpdateTimer);
        }

        const timer = setTimeout(() => {
            const packages = getAllUsedPackages(newCode);
            updateDependencies(activeFile, packages);
        }, 500);

        setDebouncedUpdateTimer(timer);
    }, [activeFile, filesState]);

    useEffect(() => {
        return () => {
            if (debouncedUpdateTimer) {
                clearTimeout(debouncedUpdateTimer);
            }
        };
    }, [debouncedUpdateTimer]);

    const handleFileSwitch = useCallback((filename) => {
        const fileKey = filename.startsWith('/') ? filename : `/${filename}`;
        if (filesState[fileKey] && !filesState[fileKey]?.hidden) {
            setActiveFile(fileKey);
            setShowAdditionalMenu(false);
            setScreenName(filename);
        }
    }, [filesState]);


    const getFrameworkDeps = (framework) => {
        switch (framework) {
            case 'mui':
                return {
                    "@mui/material": "^5.10.13",
                    "@emotion/react": "^11.10.5",
                    "@emotion/styled": "^11.10.5",
                }
            case 'shadcn':
                return shadcnuiDeps();
            default:
                return {};
        }
    }

    const initFrameworkConfigFiles = async (framework) => {
        setUsedDeps(prev => ({
            ...prev,
            global: {
                ...prev.global,
                ...getFrameworkDeps(framework)
            }
        }));
        const configFiles = await getUIConfigFiles(template, previewSettings, usedUiFrameworks, framework, filesState, true);
        setFilesState(prev => ({
            ...prev,
            ...configFiles
        }));
    }

    const isCurrentFileModified = () => {
        if (!textHash[activeFile]) return false;
        return textHash[activeFile] !== doubleHash(filesState[activeFile]?.code)
    }


    useEffect(() => {
        getFiles(filesState);
    }, [filesState]);

    const mainFileMap = {
        'react': '/App.js',
        'react-ts': '/App.tsx',
        'vue': '/src/App.vue',
        'vue-ts': '/src/App.vue',
        'nextjs': '/App.js',
        'nextjs-ts': '/App.tsx',
        'react-native': '/App.js',
        'react-native-ts': '/App.tsx',
    }

    const mappedFiles = useCallback(() => {
        const mainExtension = mainFileMap[template].split('.').pop();
        const currentExtension = activeFile.split('.').pop();
        if (mainExtension !== currentExtension) {
            return { ...filesState, [mainFileMap[template]]: { code: filesState[previewFile || activeFile]?.code } };
        }
        const exportRegex = /export\s+default\s+\w+/;
        if (!exportRegex.test(filesState[activeFile]?.code)) {
            return { ...filesState, [mainFileMap[template]]: { code: filesState[previewFile || activeFile]?.code } };
        }
        return {
            ...filesState,
            [mainFileMap[template]]: {
                code: filesState[activeFile]?.code,
            },
        };
    }, [filesState, activeFile, template, previewFile]);

    useEffect(() => {
        const mainExtension = mainFileMap[template].split('.').pop();
        const currentExtension = activeFile.split('.').pop();
        if (mainExtension !== currentExtension) {
            return;
        }
        const exportRegex = /export\s+default\s+\w+/;
        if (exportRegex.test(filesState[activeFile]?.code)) {
            setPreviewFile(activeFile);
        }
    }, [activeFile]);

    const handleResetPreview = useCallback(() => {
        const iframe = document.querySelector('.sp-preview-iframe');
        if (iframe) {
            iframe.src = iframe.src;
        }

        const previewContainer = document.querySelector('.sp-preview-container');
        if (previewContainer) {
            previewContainer.style.display = 'none';
            setTimeout(() => {
                previewContainer.style.display = 'block';
            }, 50);
        }
    }, []);

    const openHelpModal = (content) => {
        setShowHelpModal(true);
        setHelpModalContent(content);
    }
    return (
        <div className="w-full flex flex-col rounded-lg justify-center overflow-hidden" style={{ height: '80vh' }}>
            <div className="flex items-center justify-between p-2 bg-[#0a0a0a] border-t border-x border-[rgba(255,255,255,0.15)] rounded-t-lg">
                <div className="text-white flex items-center space-x-1">
                    <FileMenu
                        mainFile={initialActiveFile}
                        activeFile={activeFile}
                        name={name}
                        handleFileSwitch={handleFileSwitch}
                        componentId={id}
                        setFiles={setFilesState}
                        setUsedDeps={setUsedDeps}
                        textHash={textHash}
                        setTextHash={setTextHash}
                        files={filesState}
                        usedUiFrameworks={usedUiFrameworks}
                    />
                    <MiniButton onClick={handleConfigMenuOpen} label='Configuration Menu' divProps={{ initial: { paddingLeft: "4px", paddingRight: "4px" }, whileHover: { scale: 1.05, transition: { duration: 0.2, ease: "easeOut" } } }} />
                </div>
                <div className="space-x-2 hidden sm:flex">
                    <Chip
                        label=''
                        icon={RotateCw}
                        isSelected={false}
                        onSelect={handleResetPreview}
                        showX={false}
                        color="blue"
                        size="small"
                        tooltip="Reset Preview"
                    />
                    {screenOptions.map((option) => (
                        <Chip
                            key={option.value}
                            label={''}
                            icon={option.icon}
                            isSelected={selectedScreen === option.value}
                            onSelect={() => setSelectedScreen(selectedScreen === option.value ? '' : option.value)}
                            showX={false}
                            color="blue"
                            size="small"
                            tooltip={option.tooltip}
                        />
                    ))}

                    <Chip
                        label=''
                        icon={Settings}
                        isSelected={false}
                        onSelect={handleOpenMenu}
                        showX={false}
                        color="blue"
                        size="small"
                        tooltip="Settings"
                    />

                    <SettingsMenu
                        isMenuOpen={isMenuOpen}
                        handleCloseMenu={handleCloseMenu}
                        anchorEl={anchorEl}
                        previewSettings={previewSettings}
                        setPreviewSettings={setPreviewSettings}
                    />
                </div>
                <div className="flex space-x-2 sm:hidden">
                    <Chip
                        label={selectedScreen === 'code' ? 'Show Code' : 'Hide Code'}
                        icon={Code}
                        isSelected={selectedScreen === 'code'}
                        onSelect={handleShowCode}
                        color="blue"
                        size="small"
                        showX={false}
                        tooltip={selectedScreen === 'code' ? 'Show Code' : 'Hide Code'}
                    />
                </div>
            </div>
            <div ref={resizeContainerRef} className="w-full h-full">
                <SandpackProvider
                    key={usedUiFrameworks.join('-')}
                    template={getTemplate()}
                    theme="dark"
                    files={mappedFiles()}
                    customSetup={{
                        dependencies: memoizedDependencies
                    }}
                    options={{
                        bundlerURL: "https://bundler.compify.app",
                        externalResources: [
                            `${cdnUrl}/capture.js`,
                            'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js',
                            ...getExternalResources()
                        ]
                    }}
                    style={{ height: '100%' }}>
                    <SandpackLayout style={{ display: 'flex', flexDirection: 'row', flexGrow: '1', width: '100%', height: '100%', flexWrap: 'nowrap', position: 'relative', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#0a0a0a', borderRadius: '0px 0px 10px 10px' }}>

                        <div className="relative overflow-auto" style={{ width: selectedScreen === 'fullscreen' ? 0 : editorWidth }}>
                            {showAdditionalMenu ?
                                <ConfigurationMenu
                                    initSettings={previewSettings}
                                    previewSettings={previewSettings}
                                    setFonts={(fonts) => setPreviewSettings({ ...previewSettings, fonts })}
                                    setMainFont={(font) => setPreviewSettings({ ...previewSettings, fontFamily: font })}
                                    onBack={closeConfigurationMenu}
                                    setScreenName={setScreenName}
                                    setUsedUiFrameworks={setUsedUiFrameworks}
                                    usedUiFrameworks={usedUiFrameworks}
                                    initFrameworkConfigFiles={initFrameworkConfigFiles}
                                    template={template}
                                    closeConfigurationMenu={() => setShowAdditionalMenu(false)}
                                    changeActiveFile={handleFileSwitch}
                                    initialTheme={initialTheme}
                                    setTheme={setTheme}
                                    setFilesState={setFilesState}
                                    id={id}
                                    handleLoadTheme={handleLoadTheme}
                                    setDefaultOpenBotInput={setDefaultOpenBotInput}
                                /> :
                                <DiffHighlightingEditor
                                    key={activeFile}
                                    originalCode={currentCode}
                                    setDefaultOpenBotInput={setDefaultOpenBotInput}
                                    defaultOpenBotInput={defaultOpenBotInput}
                                    onCodeChange={handleCodeUpdate}
                                    language={getLanguage()}
                                    enableCompletion={true}
                                    template={[template, ...usedUiFrameworks].join(' ')}
                                    onSave={onSave}
                                    showSave={isCurrentFileModified()}
                                    usedUiFrameworks={usedUiFrameworks}
                                    openHelpModal={openHelpModal}
                                    handleFileSwitch={handleFileSwitch}
                                    id={id}
                                    openMenu={() => setShowAdditionalMenu(true)}
                                    theme={initialTheme}
                                    setTheme={setTheme}
                                    selectFont={(font) => {
                                        setPreviewSettings({
                                            ...previewSettings,
                                            fonts: [...previewSettings?.fonts, font],
                                            fontFamily: font?.n
                                        });
                                    }}
                                    files={filesState}
                                    setFiles={setFilesState}
                                    activeFile={activeFile}
                                    isSetupServer={isSetupServer}
                                />}
                        </div>
                        <div
                            ref={dividerRef}
                            className="w-1 bg-gray-700 cursor-col-resize hover:bg-gray-400 transition-colors hidden sm:block"
                            onMouseDown={startResize}
                        />
                        <div style={selectedScreen === 'fullscreen' ? { width: '100%' } : { width: `calc(100% - ${editorWidth})` }} className="relative h-full">
                            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] overflow-hidden" style={{ maxHeight: 'calc(80vh - 43px)' }}>
                                <SandpackPreview
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: previewSettings?.backgroundColor || '#0a0a0a',
                                        ...(selectedScreen === 'phone' && {
                                            width: '367px',
                                            height: '722px',
                                            margin: 'auto',
                                            border: '5px solid #1a1a1a',
                                            boxShadow: '0 0 0.2em 0.3em hsl(220, 20%, 12%), 0 0 0 6px hsl(220, 15%, 65%)',
                                            borderRadius: '68px',
                                            overflow: 'hidden',
                                            transformOrigin: 'center'
                                        })
                                    }}
                                    showOpenInCodeSandbox={false}
                                    customLoader={<div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-10">
                                        <LoaderCube size={18} color="white" />
                                        <span className="text-white text-sm mt-2">Loading preview...</span>
                                    </div>}
                                    showOpenNewtab={false}
                                    showRefreshButton={false}
                                />

                            </div>
                        </div>
                        {isResizing && (
                            <div className="absolute inset-0 bg-transparent cursor-col-resize" />
                        )}
                    </SandpackLayout>
                </SandpackProvider>
            </div>
            {usedUiFrameworks?.includes('theme') && <ThemeCompiler initialTheme={initialTheme} setTheme={setTheme} setFilesState={setFilesState} />}
            {/* eslint-disable-next-line react/no-children-prop */}
            <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title={helpModalContent?.title} children={helpModalContent?.children} />
        </div >
    );
};

export default Editor;
