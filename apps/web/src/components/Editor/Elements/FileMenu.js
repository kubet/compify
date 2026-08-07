import { ChevronDown, FileJson2, Pencil, Circle, CornerDownLeft, MoreHorizontal, Trash2, Edit2, Search, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { generateHashForAllFiles } from '@/components/Project/utils/double-hash';

// Helper function to normalize file paths
const normalizePath = (path) => {
    return path.startsWith('/') ? path : '/' + path;
};

// Helper function to organize files into a tree structure
const organizeFilesIntoTree = (files) => {
    const tree = {};
    Object.entries(files).forEach(([path, data]) => {
        if (data?.hidden) return;

        // Normalize the path to always have a leading slash
        const normalizedPath = normalizePath(path);
        const parts = normalizedPath.split('/').filter(Boolean);
        let current = tree;

        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                // It's a file
                current[part] = { type: 'file', path: normalizedPath, data };
            } else {
                // It's a directory
                current[part] = current[part] || { type: 'directory', children: {}, path: '/' + parts.slice(0, index + 1).join('/') };
                current = current[part].children;
            }
        });
    });
    return tree;
};

// Helper to count total visible items in tree
const countVisibleItems = (tree) => {
    let count = 0;
    const countItems = (node) => {
        Object.entries(node).forEach(([_, item]) => {
            count++;
            if (item.type === 'directory') {
                countItems(item.children);
            }
        });
    };
    countItems(tree);
    return count;
};

function FileTreeItem({
    name,
    item,
    level = 0,
    onSelect,
    activeFile,
    isEditing,
    editFileName,
    handleEditFile,
    editInputRef,
    setEditingFile,
    setEditFileName,
    handleDeleteFile,
    currentFilesHashMap,
    textHash,
    mainFile,
    fileColor,
    expandedFolders,
    setExpandedFolders,
    searchQuery,
    editingFile,
    usedUiFrameworks
}) {
    const isDirectory = item.type === 'directory';
    const isExpanded = expandedFolders.includes(item.path || name);
    const fullPath = item.path || '';
    const isActive = activeFile === fullPath;
    const isModified = item.type === 'file' && currentFilesHashMap[fullPath] !== textHash[fullPath];

    // Auto-expand parent folders when searching
    useEffect(() => {
        if (searchQuery && isDirectory && !isExpanded) {
            const hasMatchingChild = Object.entries(item.children).some(([childName]) =>
                childName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (hasMatchingChild) {
                setExpandedFolders(prev => [...prev, item.path || name]);
            }
        }
    }, [searchQuery, isDirectory, isExpanded, item.children, item.path, name]);

    const toggleFolder = (e) => {
        e.stopPropagation();
        if (isDirectory) {
            setExpandedFolders(prev =>
                isExpanded
                    ? prev.filter(p => p !== (item.path || name))
                    : [...prev, (item.path || name)]
            );
        }
    };

    // Calculate padding based on level
    const paddingLeft = `${(level * 16) + 8}px`;
    const cantEdit = usedUiFrameworks.includes("theme") && name.includes("theme.css");
    return (
        <>
            <motion.div
                className="pr-1 py-[0.4rem] rounded-lg flex items-center justify-between cursor-pointer group"
                style={{ paddingLeft }}
                onClick={() => !isDirectory && !isEditing && onSelect(fullPath)}
                initial={{ backgroundColor: "rgba(26, 26, 26, 0)" }}
                whileHover={{
                    backgroundColor: "rgba(26, 26, 26, 0.8)",
                    transition: { duration: 0.2 }
                }}
                animate={{ backgroundColor: isActive ? "rgba(26, 26, 26, 0.8)" : "rgba(26, 26, 26, 0)" }}
            >
                {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 pr-2">
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editFileName.replace(/^\//, '')}
                            onChange={(e) => setEditFileName(e.target.value)}
                            onKeyDown={(e) => handleEditFile(e, fullPath)}
                            placeholder={name}
                            className="w-full bg-black/30 border border-white/20 rounded-lg px-2 py-0.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/40"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-1 min-w-0 flex-1" onClick={isDirectory ? toggleFolder : null}>
                            <div className="flex items-center">
                                {isDirectory && (
                                    <motion.div
                                        initial={false}
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        className="mr-1"
                                    >
                                        <ChevronRight size={14} className="text-gray-400" />
                                    </motion.div>
                                )}
                                {isDirectory ? (
                                    null
                                ) : (
                                    <FileJson2 size={14} style={{ color: fileColor[name.split('.').pop()] }} />
                                )}
                            </div>
                            <span
                                className={`
                                    transition-transform duration-200 
                                    group-hover:translate-x-1 
                                    ${isModified ? 'text-yellow-500' : 'text-gray-300'}
                                    truncate
                                    w-full
                                    overflow-hidden
                                    whitespace-nowrap
                                    ml-2
                                `}
                                title={fullPath.replace(/^\//, '')}
                            >
                                {name}
                            </span>
                        </div>
                        {isModified && <div className="text-xs text-yellow-500 group-hover:opacity-0 transition-all duration-200 opacity-100 font-bold mr-2">M</div>}
                        {!isDirectory && !cantEdit && (
                            <div className="opacity-0 overflow-hidden w-0 group-hover:w-[50px] h-[23px] group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 flex-shrink-0">
                                <>
                                    <motion.button
                                        className="ml-[0.1rem] p-1 hover:bg-white/10 rounded-md"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingFile(fullPath);
                                            setEditFileName(fullPath.replace(/^\//, ''));
                                        }}
                                    >
                                        <Edit2 size={13} className="text-gray-400" />
                                    </motion.button>
                                    <motion.button
                                        className="p-1 hover:bg-white/10 rounded-md"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFile(fullPath);
                                        }}
                                    >
                                        <Trash2 size={13} className="text-gray-400 hover:text-red-400" />
                                    </motion.button>
                                </>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
            {isDirectory && isExpanded && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {Object.entries(item.children)
                            .sort(([aName, aItem], [bName, bItem]) => {
                                // Folders first, then files
                                if (aItem.type === 'directory' && bItem.type !== 'directory') return -1;
                                if (aItem.type !== 'directory' && bItem.type === 'directory') return 1;
                                return aName.localeCompare(bName);
                            })
                            .map(([childName, childItem]) => (
                                <FileTreeItem
                                    key={childName}
                                    name={childName}
                                    item={childItem}
                                    level={level + 1}
                                    onSelect={onSelect}
                                    activeFile={activeFile}
                                    isEditing={editingFile === childItem.path}
                                    editFileName={editFileName}
                                    handleEditFile={handleEditFile}
                                    editInputRef={editInputRef}
                                    setEditingFile={setEditingFile}
                                    setEditFileName={setEditFileName}
                                    handleDeleteFile={handleDeleteFile}
                                    currentFilesHashMap={currentFilesHashMap}
                                    textHash={textHash}
                                    mainFile={mainFile}
                                    fileColor={fileColor}
                                    expandedFolders={expandedFolders}
                                    setExpandedFolders={setExpandedFolders}
                                    searchQuery={searchQuery}
                                    editingFile={editingFile}
                                    usedUiFrameworks={usedUiFrameworks}
                                />
                            ))}
                    </motion.div>
                </AnimatePresence>
            )}
        </>
    );
}

function FileDropdown({
    mainFile,
    onSelect,
    activeFile,
    setFiles,
    setAddFileModalOpen,
    textHash,
    setTextHash,
    files,
    setUsedDeps,
    usedUiFrameworks
}) {
    const [isAddingFile, setIsAddingFile] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const inputRef = useRef(null);
    const [editingFile, setEditingFile] = useState(null);
    const [editFileName, setEditFileName] = useState('');
    const editInputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileError, setFileError] = useState('');
    const [expandedFolders, setExpandedFolders] = useState([]);
    const [pendingFileSwitch, setPendingFileSwitch] = useState(null);
    const fileTree = organizeFilesIntoTree(files);

    const getNonHiddenFiles = () => {
        const fileNames = Object.entries(files).filter(([_, data]) => !data?.hidden);
        return fileNames;
    }

    const list = getNonHiddenFiles();

    const currentFilesHashMap = generateHashForAllFiles(files);

    const fileColor = {
        js: '#FFD700',     // Warm gold for JavaScript
        tsx: '#89CFF0',    // Soft sky blue for TypeScript/React
        jsx: '#00CED1',    // Turquoise for React
        ts: '#89CFF0',     // Matching TSX color for consistency
        css: '#FF69B4',    // Hot pink for CSS
        json: '#98FB98',   // Pale green for JSON
    }

    const doesFileExist = (name) => {
        const normalizedName = normalizePath(name);
        return Object.keys(files).some(key => normalizePath(key) === normalizedName);
    };

    const handleCreateFile = (e) => {
        if (e.key === 'Enter' && newFileName.trim()) {
            const fileName = normalizePath(newFileName);

            if (doesFileExist(fileName)) {
                setFileError(`File already exists`);
                return;
            }

            if (fileName.length > 80) {
                setFileError(`File name cannot be longer than 80 characters`);
                return;
            }

            // Create any necessary parent directories in the path
            const parts = fileName.split('/').filter(Boolean);
            if (parts.length > 1) {
                // Automatically expand parent folders
                const parentFolders = [];
                for (let i = 1; i < parts.length; i++) {
                    parentFolders.push('/' + parts.slice(0, i).join('/'));
                }
                setExpandedFolders(prev => [...new Set([...prev, ...parentFolders])]);
            }

            setFiles(prev => ({
                ...prev,
                [fileName]: { code: '', hidden: false }
            }));
            setTextHash(prev => ({
                ...prev,
                [fileName]: ''
            }));
            setNewFileName('');
            setIsAddingFile(false);
            setFileError('');
        } else if (e.key === 'Escape') {
            setIsAddingFile(false);
            setNewFileName('');
            setFileError('');
        }
    };

    const handleEditFile = (e, name) => {
        if (e.key === 'Enter' && editFileName.trim()) {
            const originalName = name;
            const newName = normalizePath(editFileName);

            if (doesFileExist(newName) && newName !== originalName) {
                setFileError(`Cannot rename file already exists`);
                return;
            }

            if (newName.length > 80) {
                setFileError(`File name cannot be longer than 80 characters`);
                return;
            }

            // Create any necessary parent directories in the path
            const parts = newName.split('/').filter(Boolean);
            if (parts.length > 1) {
                // Automatically expand parent folders
                const parentFolders = [];
                for (let i = 1; i < parts.length; i++) {
                    parentFolders.push('/' + parts.slice(0, i).join('/'));
                }
                setExpandedFolders(prev => [...new Set([...prev, ...parentFolders])]);
            }

            const fileContent = files[originalName];

            // First update files state and ensure it's complete
            setFiles(prev => {
                const newFiles = {};
                Object.entries(prev).forEach(([key, value]) => {
                    if (normalizePath(key) === normalizePath(originalName)) {
                        newFiles[newName] = value;
                    } else {
                        newFiles[key] = value;
                    }
                });
                return newFiles;
            });

            // Then update other states
            setTextHash(prev => {
                if (!prev[originalName]) {
                    return prev
                }
                const newHash = {}
                Object.entries(prev).forEach(([key, value]) => {
                    if (normalizePath(key) === normalizePath(originalName)) {
                        newHash[newName] = value;
                    } else {
                        newHash[key] = value;
                    }
                });

                return newHash;
            });

            setUsedDeps(prev => {
                if (!prev?.files?.[originalName]) {
                    console.warn(`Original file "${originalName}" does not exist.`);
                    return prev
                }
                const newDeps = {}
                Object.entries(prev?.files).forEach(([key, value]) => {
                    if (normalizePath(key) === normalizePath(originalName)) {
                        newDeps[newName] = value;
                    } else {
                        newDeps[key] = value;
                    }
                });
                return { global: { ...prev.global }, files: newDeps }
            });

            setEditingFile(null);
            setPendingFileSwitch(newName);
            setEditFileName('');
            setFileError('');
        } else if (e.key === 'Escape') {
            setEditingFile(null);
            setEditFileName('');
            setFileError('');
        }
    };

    const handleDeleteFile = (fileName) => {
        const name = fileName;
        if (fileName === mainFile) return; // Prevent deleting main file
        setFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[name];
            return newFiles;
        });
        setTextHash(prev => {
            const newHash = { ...prev };
            delete newHash[name];
            return newHash;
        });

        setUsedDeps(prev => {
            const newDeps = { ...prev };
            delete newDeps[name];
            return newDeps;
        });

        if (activeFile === fileName) {
            onSelect(mainFile); // Switch to main file if deleted file was active
        }
    };

    useEffect(() => {
        if (isAddingFile && inputRef.current) {
            inputRef.current.focus();
        }
        if (editingFile && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [isAddingFile, editingFile]);


    useEffect(() => {
        if (pendingFileSwitch) {
            onSelect(pendingFileSwitch);
            setPendingFileSwitch(null);
        }
    }, [pendingFileSwitch]);

    // Search through the file tree
    const searchFiles = (tree, query) => {
        const results = {};
        const search = (node, path = '') => {
            Object.entries(node).forEach(([name, item]) => {
                const currentPath = path ? `${path}/${name}` : name;
                if (item.type === 'file') {
                    if (name.toLowerCase().includes(query.toLowerCase())) {
                        // Only add file once with its full path
                        results[item.path] = item;
                    }
                } else if (item.type === 'directory') {
                    if (name.toLowerCase().includes(query.toLowerCase())) {
                        results[item.path] = { ...item, path: item.path };
                    }
                    // Always search in directory children
                    search(item.children, currentPath);
                }
            });
        };
        search(tree);
        return results;
    };

    const filteredTree = searchQuery ? searchFiles(fileTree, searchQuery) : fileTree;
    const totalItems = countVisibleItems(fileTree);

    const ErrorMessage = ({ message }) => message ? (
        <div className="text-xs text-red-400 px-3 py-1">{message}</div>
    ) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -5 }}
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
                y: -5,
                transition: {
                    duration: 0.15,
                    ease: "easeOut"
                }
            }}
            className="absolute top-9 -left-1 bg-[#0a0a0a] p-1 rounded-xl shadow-lg border border-gray-800 max-w-[230px] w-[220px] z-50 flex flex-col"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
            {totalItems > 8 && (
                <div className="relative mb-2">
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
            )}
            <div className="relative z-10 max-h-[320px] overflow-y-auto">
                {Object.entries(filteredTree)
                    .sort(([aName, aItem], [bName, bItem]) => {
                        if (aItem.type === 'directory' && bItem.type !== 'directory') return -1;
                        if (aItem.type !== 'directory' && bItem.type === 'directory') return 1;
                        return aName.localeCompare(bName);
                    })
                    .map(([name, item]) => (
                        <FileTreeItem
                            key={name}
                            name={name}
                            item={item}
                            onSelect={onSelect}
                            activeFile={activeFile}
                            isEditing={editingFile === item.path}
                            editFileName={editFileName}
                            handleEditFile={handleEditFile}
                            editInputRef={editInputRef}
                            setEditingFile={setEditingFile}
                            setEditFileName={setEditFileName}
                            handleDeleteFile={handleDeleteFile}
                            currentFilesHashMap={currentFilesHashMap}
                            textHash={textHash}
                            mainFile={mainFile}
                            fileColor={fileColor}
                            expandedFolders={expandedFolders}
                            setExpandedFolders={setExpandedFolders}
                            searchQuery={searchQuery}
                            editingFile={editingFile}
                            usedUiFrameworks={usedUiFrameworks}
                        />
                    ))}
            </div>

            <motion.div
                className="mt-1 pt-1 border-t border-white/10"
                initial={{ opacity: 0.8 }}
                whileHover={{ opacity: 1 }}
            >
                {isAddingFile ? (
                    <div className="px-3 py-[0.4rem] flex flex-col">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={handleCreateFile}
                                placeholder="path/to/file.js"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20"
                                autoFocus
                            />
                            <div className="text-xs text-gray-500">
                                <CornerDownLeft size={14} />
                            </div>
                        </div>
                        <ErrorMessage message={fileError} />
                    </div>
                ) : (
                    <motion.button
                        className="w-full pl-3 pr-1 py-[0.4rem] rounded-lg flex items-center gap-2 text-gray-400 hover:text-gray-200 group"
                        whileHover={{
                            backgroundColor: "rgba(26, 26, 26, 0.8)",
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setIsAddingFile(true);
                            setAddFileModalOpen(true);
                        }}
                    >
                        <div className="w-[14px] h-[14px] relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-[8px] h-[2px] bg-current rounded-full" />
                                <div className="w-[2px] h-[8px] bg-current rounded-full absolute" />
                            </div>
                        </div>
                        <span className="text-sm transition-transform duration-200 group-hover:translate-x-1">
                            Add file
                        </span>
                    </motion.button>
                )}
            </motion.div>
        </motion.div>
    );
}

export default function FileMenu({
    mainFile,
    name,
    list,
    handleFileSwitch,
    activeFile,
    modifiedFiles = {},
    componentId,
    setFiles,
    textHash,
    setTextHash,
    files,
    setUsedDeps,
    usedUiFrameworks
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [addFileModalOpen, setAddFileModalOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (key) => {
        if (files[key]) {
            handleFileSwitch(key);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <motion.div
                className="flex items-center cursor-pointer hover:bg-[#1a1a1a] rounded-lg gap-[0.3rem]"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.02 }}
            >
                <FileJson2 size={18} />
                <span className="pr-[0.1rem]">{activeFile.replace(/^\//, '')}</span>
                <ChevronDown size={20} className="pr-1 mt-[1px] text-gray-400" />
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <FileDropdown
                        name={name}
                        list={list}
                        mainFile={mainFile}
                        activeFile={activeFile}
                        onSelect={handleSelect}
                        modifiedFiles={modifiedFiles}
                        setFiles={setFiles}
                        setAddFileModalOpen={setAddFileModalOpen}
                        textHash={textHash}
                        setTextHash={setTextHash}
                        files={files}
                        setUsedDeps={setUsedDeps}
                        usedUiFrameworks={usedUiFrameworks}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}