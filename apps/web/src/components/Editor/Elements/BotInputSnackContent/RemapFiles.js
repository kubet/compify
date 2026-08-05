import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MiniButton from '@/components/Elements/MiniButton'
import { FileJson2, Settings, X, Search, Check, Loader2, CircleAlert } from 'lucide-react'
import { uiLibraries } from '../../Templates/common'
import { remapFiles } from '@/lib/api'

const fileColor = {
    js: '#FFD700',     // Warm gold for JavaScript
    tsx: '#89CFF0',    // Soft sky blue for TypeScript/React
    jsx: '#00CED1',    // Turquoise for React
    ts: '#89CFF0',     // Matching TSX color for consistency
    css: '#FF69B4',    // Hot pink for CSS
    json: '#98FB98',   // Pale green for JSON
}

// Helper functions for path normalization
const normalizePath = (path) => {
    return path.startsWith('/') ? path : `/${path}`;
};

const denormalizePath = (path) => {
    return path.startsWith('/') ? path.slice(1) : path;
};

const FileIcon = ({ fileName }) => {
    const extension = fileName.split('.').pop();
    const color = fileColor[extension] || '#FFFFFF'; // fallback to white if extension not found
    return <FileJson2 style={{ color: color }} size={16} />
}

function FileSelector({ files, onSelect, onClose, selectedFiles, onRemove }) {
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const visibleFiles = Object.entries(files)
        .filter(([_, data]) => !data?.hidden)
        .map(([file]) => file);

    const filteredFiles = searchQuery
        ? visibleFiles.filter(file =>
            denormalizePath(file).toLowerCase().includes(searchQuery.toLowerCase()))
        : visibleFiles;

    const isFileSelected = (file) => {
        const normalizedFile = normalizePath(file);
        return selectedFiles.some(selectedFile =>
            normalizePath(selectedFile) === normalizedFile
        );
    };

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 5 }}
            animate={{
                opacity: 1,
                y: 0,
                transition: {
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1]
                }
            }}
            exit={{
                opacity: 0,
                y: 5,
                transition: {
                    duration: 0.15,
                    ease: "easeOut"
                }
            }}
            className="fixed bg-[#0a0a0a] p-1 rounded-xl shadow-lg border border-gray-800 max-w-[230px] w-[220px] z-[9999] flex flex-col"
            style={{
                border: '1px solid rgba(255,255,255,0.1)',
                bottom: 'calc(100% - 20px)',
                left: '25%',
                transform: 'translateX(-50%)',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
            }}
        >

            <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {filteredFiles.map((file) => {
                    const isSelected = isFileSelected(file);
                    return (
                        <motion.div
                            key={file}
                            className={`px-2 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-300'
                                }`}
                            onClick={() => {
                                if (isSelected) {
                                    onRemove(file);
                                } else {
                                    onSelect(file);
                                    onClose();
                                }
                            }}
                        >
                            <FileIcon fileName={file} />
                            <span className={`text-sm truncate flex-1 ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}>
                                {denormalizePath(file)}
                            </span>
                            {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
            <div className="relative mt-1">
                <Search
                    size={14}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full bg-black/30 border border-white/5 rounded-lg pl-8 pr-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors duration-200"
                />
            </div>
        </motion.div>
    );
}

function RemapFiles({ files, apply, close, setSnackHeight, usedUiFrameworks, theme, userPlan, activeFile }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [remappedFiles, setRemappedFiles] = useState(null);
    const [oldFiles, setOldFiles] = useState(null);
    const [errorOccured, setErrorOccured] = useState(false);

    const removeFile = (file) => {
        setSelectedFiles(selectedFiles.filter(f =>
            normalizePath(f) !== normalizePath(file)
        ));
    };

    const uiFrameworkConfigurationMap = {
        tailwind: ['tailwind.config.js', activeFile],
        'tailwind-ts': ['tailwind.config.ts', activeFile],
        'tailwind-ts-v4': ['globals.css', activeFile],
        'tailwind-v4': ['globals.css', activeFile],
        'styled-components': ['globals.css', activeFile],
        'daisyui': ['tailwind.config.js', activeFile],
        'daisyui-ts': ['tailwind.config.ts', activeFile],
        mui: [activeFile],
        shadcn: ['globals.css', 'tailwind.config.ts']
    }

    const addDefaultFileToSelectedFiles = (framework) => {
        const frameworkFiles = uiFrameworkConfigurationMap[framework];
        if (frameworkFiles) {
            // First normalize all paths, then create a Set for uniqueness
            const normalizedFiles = new Set(
                frameworkFiles.map(configFile => normalizePath(configFile))
            );

            const existingFiles = Array.from(normalizedFiles)
                .filter(configFile => files[configFile]);

            setSelectedFiles(prev => {
                const newFiles = [...prev];
                existingFiles.forEach(file => {
                    if (!prev.some(f => normalizePath(f) === file)) {
                        newFiles.push(file);
                    }
                });
                return newFiles;
            });
        }
    }

    // Initialize selected files once when component mounts
    useEffect(() => {
        usedUiFrameworks.forEach(framework => addDefaultFileToSelectedFiles(framework));
    }, []);

    // Separate effect for height updates
    useEffect(() => {
        const baseHeight = 85;
        const filesPerRow = 2;
        const totalRows = Math.ceil(selectedFiles.length / filesPerRow);
        const additionalRows = Math.max(0, totalRows - 1);
        const newHeight = baseHeight + (additionalRows * 25);
        setSnackHeight(newHeight);
    }, [selectedFiles, setSnackHeight]);

    const handleRemapAccept = async () => {
        apply(remappedFiles);
        close();
    }

    const handleRemapDiscard = () => {
        if (oldFiles) {
            apply(oldFiles);
        }
        close();
    }

    const getFiles = () => {
        const filesObj = {};
        selectedFiles.forEach(file => {
            filesObj[file] = files[file]?.code;
        });
        return filesObj;
    }

    const getOldFiles = () => {
        const filesObj = {};
        selectedFiles.forEach(file => {
            filesObj[file] = files[file];
        });
        return filesObj;
    }

    const onRemapFiles = async () => {
        setIsLoading(true);
        setOldFiles(getOldFiles());
        try {
            const response = await remapFiles({
                files: getFiles(),
                uiFrameworks: usedUiFrameworks,
                themeKeys: theme?.values?.map(value => value.key)
            });
            if (response.status === 201) {
                const formattedFiles = Object.entries(response.data).reduce((acc, [filename, content]) => {
                    acc[filename] = { code: content };
                    return acc;
                }, {});
                setRemappedFiles(formattedFiles);
                apply(formattedFiles);
            } else {
                setErrorOccured(true);
            }
        } catch (error) {
            console.error('Error remapping files:', error);
            setErrorOccured(true);
            handleRemapDiscard();
        }
        setIsLoading(false);
    }

    if (errorOccured) {
        return (
            <div className="flex items-center justify-center h-full gap-3">
                <CircleAlert className="w-5 h-5 text-red-500" />
                <p className="text-red-500">{userPlan === "FREE" ? "Free models can't handle this task." : "Error occurred, please try again."}</p>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-1 py-1">
                <span className="text-xs pb-1">Remap config files with updated theme</span>
                <div className="w-full scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="flex gap-1.5 max-w-[340px] flex-wrap">
                        {selectedFiles.map((file) => (
                            <MiniButton
                                key={file}
                                text={denormalizePath(file)}
                                Icon={() => <FileIcon fileName={file} />}
                                onClick={() => removeFile(file)}
                                className="shrink-0 min-w-fit"
                            />
                        ))}
                        <MiniButton
                            onClick={() => setIsFileSelectorOpen(true)}
                            divProps={{
                                initial: { paddingLeft: "4px", paddingRight: "4px" },
                                whileHover: { scale: 1.05, transition: { duration: 0.2, ease: "easeOut" } }
                            }}
                        />
                        <AnimatePresence>
                            {isFileSelectorOpen && (
                                <FileSelector
                                    files={files}
                                    selectedFiles={selectedFiles}
                                    onSelect={(file) => {
                                        const normalizedFile = normalizePath(file);
                                        if (!selectedFiles.some(f => normalizePath(f) === normalizedFile)) {
                                            setSelectedFiles([...selectedFiles, normalizedFile]);
                                        }
                                    }}
                                    onRemove={removeFile}
                                    onClose={() => setIsFileSelectorOpen(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm px-3 py-1 rounded-lg hover:text-white bg-red-500/10 hover:bg-red-500/15 transition-colors"
                    onClick={remappedFiles ? handleRemapDiscard : close}
                >
                    <span className="hidden md:block">{remappedFiles ? 'Discard' : 'Cancel'}</span>
                    <X className="w-5 h-5 md:hidden" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`text-sm px-3 py-1 rounded-lg hover:text-white transition-colors flex items-center gap-2
                        ${isLoading ? 'bg-blue-500/10 hover:bg-blue-500/15' : 'bg-white/10 hover:bg-white/15'}`}
                    onClick={remappedFiles ? handleRemapAccept : onRemapFiles}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden md:block">Remapping...</span>
                        </>
                    ) : (
                        <>
                            <span className="hidden md:block">{remappedFiles ? 'Accept' : 'Remap'}</span>
                            {remappedFiles ? (
                                <Check className="w-5 h-5 md:hidden" />
                            ) : (
                                <Settings className="w-5 h-5 md:hidden" />
                            )}
                        </>
                    )}
                </motion.button>
            </div>
        </>
    )
}

export default RemapFiles