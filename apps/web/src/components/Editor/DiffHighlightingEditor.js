'use client'
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { GeistMono } from 'geist/font/mono';
import { useActiveCode, SandpackStack } from "compify-pack";
import { DiffEditor } from "@monaco-editor/react";
import { darkCode } from './dark-code';
import BotInput from './Elements/BotInput';
import { useAI } from './ai';
import { Check, Clipboard, X } from 'lucide-react';
import { Button } from '../Elements';
import LimitModal from '../Common/LimitModal';
import { motion } from 'framer-motion';
import { CompletionFormatter } from './utils/completion-formatter';
import UtilityButton from '../Elements/UtilityButton';
import { getCompletion } from '@/lib/api';
import { registerCompletion } from 'monacopilot';
import { baseUrl } from '@/constains';

const DiffHighlightingEditor = ({ originalCode,
    onCodeChange,
    language = 'jsx',
    enableCompletion = true,
    template = '',
    usedUiFrameworks = [],
    files = [],
    setFiles = () => { },
    onSave = () => { },
    showSave,
    id,
    openMenu,
    selectFont,
    theme,
    setTheme,
    defaultOpenBotInput = false,
    setDefaultOpenBotInput,
    openHelpModal,
    activeFile,
    handleFileSwitch,
    isSetupServer
}) => {
    const { updateCode } = useActiveCode();
    const [modifiedCode, setModifiedCode] = useState(originalCode);
    const currentCode = useRef(originalCode);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const initializationCompleted = useRef(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const { generateCode, stop } = useAI();
    const [isSettling, setIsSettling] = useState(false);
    const isGeneratingRef = useRef(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalMessage, setLimitModalMessage] = useState('');
    const [isCompletionActive, setIsCompletionActive] = useState(enableCompletion);
    const hasChanges = currentCode.current !== modifiedCode && !isGenerating;
    const monaco = useRef(null);
    const editorRef = useRef(null);
    const completionRef = useRef(null);

    const handleCodeChange = useCallback((newCode) => {
        if (onCodeChange && !isGeneratingRef.current) {
            updateCode(newCode);
            onCodeChange(newCode);
            setModifiedCode(newCode);
            currentCode.current = newCode;
        }
    }, [updateCode, onCodeChange]);

    const initializeMonaco = useCallback(async (monacoInstance) => {
        if (initializationCompleted.current || typeof window === 'undefined') return;
        monaco.current = monacoInstance;

        try {
            const [{ shikiToMonaco }, { createHighlighter }] = await Promise.all([
                import('@shikijs/monaco'),
                import('shiki')
            ]);

            const light = { ...darkCode, name: "light" };
            if (!window.__shikiHighlighter) {
                window.__shikiHighlighter = await createHighlighter({
                    themes: [darkCode, light],
                    langs: ['javascript', 'typescript', 'jsx', 'tsx', 'vue', 'svelte', 'css', 'scss']
                });
            }

            const languages = ['javascript', 'typescript', 'jsx', 'tsx', 'vue', 'svelte', 'css', 'scss'];
            languages.forEach(lang => monacoInstance.languages.register({ id: lang }));

            await shikiToMonaco(window.__shikiHighlighter, monacoInstance);
            initializationCompleted.current = true;
            monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
            });
            monacoInstance.languages.css.cssDefaults.setOptions({
                validate: true,
                lint: {
                    unknownAtRules: 'ignore'
                }
            });
            setIsEditorReady(true);
        } catch (error) {
            console.error("Error initializing Monaco:", error);
            setTimeout(() => initializeMonaco(monacoInstance), 1000);
        }
    }, [language]);

    const handleEditorDidMount = useCallback((editor, monacoInstance) => {
        const modifiedEditor = editor.getModifiedEditor();
        editorRef.current = editor;
        modifiedEditor.setScrollTop(15);
        modifiedEditor.onDidChangeModelContent(() => {
            handleCodeChange(modifiedEditor.getValue());
        });

        if (!initializationCompleted.current) {
            initializeMonaco(monacoInstance);
        }

        // Setup monacopilot
        if (isCompletionActive && modifiedEditor) {
            const token = localStorage.getItem('token');
            completionRef.current = registerCompletion(monacoInstance, modifiedEditor, {
                endpoint: `${baseUrl}/ai/completion`,
                technologies: [template],
                language,
                maxContextLines: 10,
                trigger: 'onTyping',
                requestHandler: async ({ endpoint, body }) => {
                    if (!isCompletionActive) return {
                        completion: "",
                    };
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(body),
                    });
                    if (response.status !== 200) {
                        setIsCompletionActive(false);
                        return {
                            completion: "",
                        };
                    }
                    const data = await response.json();
                    return {
                        completion: data.completion,
                    };
                },
            });
        }
    }, [handleCodeChange, initializeMonaco, language, isCompletionActive, id, usedUiFrameworks]);

    // Cleanup completion on unmount
    useEffect(() => {
        return () => {
            if (completionRef.current) {
                completionRef.current.deregister();
            }
        };
    }, []);

    useEffect(() => {
        const modifiedEditor = editorRef.current?.getModifiedEditor();
        if (!monaco.current || !modifiedEditor || !isCompletionActive) return;

        return () => {
            // Cleanup only if needed
            if (completionRef.current) {
                completionRef.current.deregister();
            }
        };
    }, [language, isCompletionActive]);

    const handleGenerateCode = useCallback(async (prompt, option, images) => {
        if (isGeneratingRef.current) {
            stop();
            isGeneratingRef.current = false;
            setIsGenerating(false);
            return;
        }

        if (!prompt) return;

        try {
            setIsGenerating(true);
            isGeneratingRef.current = true;
            setIsSettling(true);

            const newCode = await generateCode(prompt, currentCode.current, setModifiedCode, '/ai/generate', template, id, usedUiFrameworks, images);

            if (!isGeneratingRef.current) return;

            await new Promise(resolve => setTimeout(resolve, 300));

            if (onCodeChange) {
                onCodeChange(newCode);
            }
        } catch (error) {
            setShowLimitModal(true);
            setLimitModalMessage(error.message);
            setModifiedCode(currentCode.current);
        } finally {
            setIsSettling(false);
            setIsGenerating(false);
            isGeneratingRef.current = false;
        }
    }, [generateCode, onCodeChange, stop]);

    const handleCopy = () => {
        navigator.clipboard.writeText(currentCode.current);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAcceptChanges = () => {
        handleCodeChange(modifiedCode);
    };
    const handleDiscardChanges = () => {
        setModifiedCode(currentCode.current);
    };

    useEffect(() => {
        return () => {
            // Cleanup monacopilot on unmount
            if (completionRef.current) {
                completionRef.current.deregister();
            }
        };
    }, []);

    // Update editor options based on completion prop
    const editorOptions = {
        // Theme & Visual options
        theme: 'dark-code',
        fontSize: 14,
        fontFamily: GeistMono.style.fontFamily,
        fontLigatures: true,
        minimap: { enabled: false },
        contextmenu: false,
        lineNumbers: false,

        // DiffEditor specific options
        renderSideBySide: false,
        renderOverviewRuler: false,
        renderIndicators: true,
        diffAlgorithm: 'advanced',
        diffWordWrap: 'on',
        ignoreTrimWhitespace: false,
        originalEditable: false,
        modifiedEditable: true,

        // Word wrap settings
        wordWrap: 'on',
        wordWrapColumn: 100,
        wordWrapMinified: true,

        // Line decoration settings
        lineDecorationsWidth: 5,
        lineNumbersMinChars: 3,
        renderIndentGuides: false,

        // Editor state
        readOnly: isGenerating || isSettling,

        // Suggestion specific settings for monacopilot
        inlineSuggest: {
            enabled: isCompletionActive,
            mode: 'prefix',
            showToolbar: 'always',
        },
        quickSuggestions: false, // Let monacopilot handle suggestions
        suggestOnTriggerCharacters: false,
        parameterHints: {
            enabled: false
        },

        // Additional helpful options
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'never',
        matchBrackets: 'always',

        // Performance options
        renderValidationDecorations: 'on',
        scrollBeyondLastLine: true,
        smoothScrolling: true,
        fastScrollSensitivity: 5,
        padding: { top: 15 }
    };

    return (
        <SandpackStack style={{ height: '100%', margin: 0, background: "#0a0a0a" }}>
            <div style={{ flex: 1, paddingTop: 8, background: "#0a0a0a" }}>
                {!isEditorReady && <div style={{ height: '100%', background: '#0a0a0a', color: '#fff' }}>Loading...</div>}
                <DiffEditor
                    height="100%"
                    language={language}
                    original={currentCode.current || originalCode}
                    modified={modifiedCode}
                    beforeMount={initializeMonaco}
                    onMount={handleEditorDidMount}
                    loading={<div style={{ height: '100%', background: '#0a0a0a', color: '#fff' }}>Loading editor...</div>}
                    options={editorOptions}
                    onSave={onSave}
                />
            </div>
            <BotInput
                isGenerating={isGenerating}
                handleGenerateCode={handleGenerateCode}
                showLimitModal={showLimitModal}
                hasChanges={hasChanges}
                defaultOpen={defaultOpenBotInput}
                openMenu={openMenu}
                selectFont={selectFont}
                theme={theme}
                setTheme={setTheme}
                handleFileSwitch={handleFileSwitch}
                usedUiFrameworks={usedUiFrameworks}
                componentId={id}
                setDefaultOpenBotInput={setDefaultOpenBotInput}
                files={files}
                setFiles={setFiles}
                openHelpModal={openHelpModal}
                activeFile={activeFile}
                isSetupServer={isSetupServer}
            />
            <div className="absolute top-3 right-4 flex space-x-2">
                {hasChanges && (
                    <>
                        <Button
                            text="Accept Changes"
                            textSm="Accept"
                            Icon={Check}
                            onClick={handleAcceptChanges}
                            title="Accept changes"
                            size="small"
                            color="green"
                            blurBackground={true}
                        />
                        <Button
                            text="Discard Changes"
                            textSm="Discard"
                            Icon={X}
                            onClick={handleDiscardChanges}
                            title="Discard changes"
                            size="small"
                            color="red"
                            blurBackground={true}
                        />
                    </>
                )}
                {!hasChanges && showSave && <UtilityButton text="SAVE" shorcut="⌘S" onClick={onSave} />}
                {!hasChanges && <motion.button
                    className="bg-white/10 group-hover:bg-black/20 text-white rounded-full !min-w-8 !min-h-8 justify-center items-center flex focus:outline-none backdrop-blur-sm z-10 mr-2"
                    onClick={handleCopy}
                    title={copied ? "Copied!" : "Copy code"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {copied ? <Check size={14} /> : <Clipboard size={14} />}
                </motion.button>}
            </div>
        </SandpackStack>
    );
};

export default React.memo(DiffHighlightingEditor);
