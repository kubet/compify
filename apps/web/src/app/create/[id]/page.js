'use client'
import React, { useEffect, useState, useRef } from 'react'
import Editor from '@/components/Editor'
import { motion } from 'framer-motion';
import { Button } from '@/components/Elements';
import { Share2, TriangleAlert } from 'lucide-react';
import { withAuth } from '@/auth/UseUser';
import Toast from '@/components/Elements/Toast';
import { notFound, useParams } from 'next/navigation';
import ShareCreateModal from './modals/ShareCreateModal';
import PublishCreateModal from './modals/PublishCreateModal';
import { checkIfCanCreate, createComponent, forkComponent, generateTokens, getComponent, getTheme, insertTheme, shareComponent, uploadComponentGif, uploadComponentImage } from '@/lib/api';
import LimitModal from '@/components/Common/LimitModal';
import { useRouter } from 'next/navigation';
import { fetchDaisyUIFiles, fetchShadcnFiles, getUIConfigFiles } from '@/components/Editor/Templates/common';
import { doubleHash, generateHashForAllFiles } from '@/components/Project/utils/double-hash';
import { compileThemeCollections } from '@/components/Project/utils';
import { applyThemeConfigFiles, emitThemeConfigFiles } from '@/components/Project/common/getTokenConfigFiles';
import ReportModal from './modals/ReportModal';
import SetupModal from '@/components/Editor/Elements/SetupModal';
import UpvoteButtons from '@/components/Product/UpvoteButtons';
import shadcnuiDeps from '@/components/Editor/Templates/Deps/shadcnui-deps';
import ComponentLimit from './modals/ComponentLimit';
import { NotFoundContent } from '@/app/not-found';

const initSettings = {
    backgroundColor: '#0a0a0a',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column',
    fonts: [{ n: 'Roboto', e: 'ital,wght@0,100..900;1,100..900' }],
    fontFamily: 'Roboto',
    zoomLevel: '1',
}

function EditComponent() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [files, setFiles] = useState({});
    const [template, setTemplate] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const [name, setName] = useState('Untitled-1');
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [imageRequested, setImageRequested] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [isShared, setIsShared] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [previewSettings, setPreviewSettings] = useState(initSettings);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [limitModalMessage, setLimitModalMessage] = useState('');
    const [usedUiFrameworks, setUsedUiFrameworks] = useState([]);
    const [textHash, setTextHash] = useState({})
    const params = useParams();
    const [imageReceivePromise, setImageReceivePromise] = useState(null);
    const imageRef = useRef(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [initialTheme, setInitialTheme] = useState(null);
    const [themeExportError, setThemeExportError] = useState(null);
    const [isSetup, setIsSetup] = useState(true);
    const [upvoteStatus, setUpvoteStatus] = useState(null);
    const [upvoteCount, setUpvoteCount] = useState(0);
    const [usedDeps, setUsedDeps] = useState({ global: {}, files: {} });
    const [canCreate, setCanCreate] = useState(true);
    const [pendingSave, setPendingSave] = useState(false);
    const [activeFile, setActiveFile] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [publishingDomain, setPublishingDomain] = useState('');
    const isSetupServer = useRef(false);
    const gifCaptures = useRef([]);

    const renderSaveStatus = () => {
        if (privacy === 'draft') return 'Not published';
        if (!Object.entries(files).find(([_, data]) => data.main)) return;
        const mainFile = Object.entries(files).find(([_, data]) => data.main)[0]
        const currentFileHash = doubleHash(files[mainFile].code)
        if (currentFileHash === textHash[mainFile]) {
            return ''
        } else {
            return 'Unsaved Changes'
        }
    }


    const setCompFilesByFramework = async (usedUiFrameworks, files) => {
        const hash = generateHashForAllFiles(files);
        setTextHash(hash);

        let updatedFiles = { ...files };

        if (usedUiFrameworks?.includes('shadcn')) {
            const shadcnFiles = await fetchShadcnFiles();
            updatedFiles = { ...updatedFiles, ...shadcnFiles };
        }
        if (usedUiFrameworks?.includes('daisyui') || usedUiFrameworks?.includes('daisyui-ts')) {
            const daisyuiFiles = await fetchDaisyUIFiles();
            updatedFiles = { ...updatedFiles, ...daisyuiFiles };
        }

        setFiles(updatedFiles);
    }



    const loadComponent = async (id) => {
        const response = await getComponent(id);
        if (response.status === 200) {
            await setCompFilesByFramework(response.data.usedUiFrameworks, response.data.files);
            setTemplate(response.data.language);
            setName(response.data.name || 'Untitled-1');
            setIsShared(response.data.isShared || false);
            setDescription(response.data.description || '');
            setPrivacy(response.data.visibility || 'public');
            if (response.data.theme?.id) {
                const themeResponse = await getTheme(response.data.theme.id);
                if (themeResponse.status === 200) {
                    setInitialTheme({ ...themeResponse.data, etag: themeResponse.etag });
                } else {
                    setInitialTheme(response.data.theme);
                }
            } else {
                setInitialTheme(null);
            }
            setPreviewSettings(response.data.pageSettings || initSettings)
            setIsOwner(response.data.isOwner || false);
            setUsedUiFrameworks(response.data.usedUiFrameworks || []);
            setIsSetup(response.data.isSetup || false);
            isSetupServer.current = response.data.isSetup || false;
            setUpvoteStatus(response.data.status || null);
            setUpvoteCount(response.data.upvotesCount || 0);
            setPublishingDomain(response.data.publishingName || '');
            setUsedDeps(response.data.usedDeps || { global: {}, files: {} });
            setActiveFile(response.data.activeFile || null);
            setPreviewFile(response.data.previewFile || null);
        }
        if (response.status === 402) {
            setLimitModalOpen(true);
            setLimitModalMessage(response.data.message);
        }
        if (response.status === 404) {
            router.push('/not-found');
        }
    }

    const loadComponentRef = useRef(loadComponent);
    loadComponentRef.current = loadComponent;

    useEffect(() => {
        const id = params.id;
        if (id) {
            loadComponentRef.current(id);
        }
    }, [params]);

    // useEffect(() => {
    //     if (imageRequested) {
    //         setImageRequested(false);
    //     }
    // }, [imageRequested]);

    const handleImageReceived = (dataUrl) => {
        if (dataUrl) {
            imageRef.current = dataUrl;
            if (imageReceivePromise) {
                imageReceivePromise.resolve(dataUrl);
                setImageReceivePromise(null);
            }
        }
    };

    const onGifReceived = (captures) => {
        if (captures.length > 0) {
            gifCaptures.current = captures;
            if (imageReceivePromise) {
                imageReceivePromise.resolve(gifCaptures.current);
                setImageReceivePromise(null);
            }
        }
    }

    const handleShare = async () => {
        const url = `${window.location.origin}/c/${params.id}`;
        setShareUrl(url);
        if (!isShared) {
            await shareComponent(params.id);
            setIsShared(true);
        }
        setShareModalOpen(true);
    };

    const handleCheckIfCanCreate = async () => {
        const response = await checkIfCanCreate();
        if (response.status === 201) {
            return true;
        } else {
            return false;
        }
    }

    const handleForkComponent = async () => {
        const canCreate = await handleCheckIfCanCreate();
        if (!canCreate) {
            setCanCreate(false);
            return;
        }
        const response = await forkComponent(params.id);
        if (response.status === 201) {
            setToastMessage('Component forked successfully');
            setToastType('success');
            setShowToast(true);
            router.push(`/create/${response.data.id}`);
        }
    }

    const handlePublish = async () => {
        if (isOwner) {
            setImageRequested(true);
            setPublishModalOpen(true);
        } else {
            await handleForkComponent();
        }
    }

    const handleUploadImage = async () => {
        if (!imageRef.current) {
            return;
        }

        const response = await uploadComponentImage({
            file: imageRef.current,
            id: params.id
        });
        if (response.status !== 201) {
            setToastMessage('Failed to upload image');
            setToastType('error');
            setShowToast(true);
        }
    };
    const handleSaveGif = async () => {
        if (!activeFile.includes('.preview')) return;
        if (gifCaptures.current.length > 0) {
            const response = await uploadComponentGif(gifCaptures.current, params.id);
            if (response.status !== 201) {
                setToastMessage('Failed to upload gif');
                setToastType('error');
                setShowToast(true);
            }
        }
    }
    const handleSaveComponent = async (propSetup = null, visibilityOverride = null) => {
        let filesForSave = files;
        if (initialTheme && usedUiFrameworks.includes('theme')) {
            try {
                const compiled = compileThemeCollections(initialTheme);
                const emittedFiles = emitThemeConfigFiles(compiled);
                filesForSave = applyThemeConfigFiles(files, emittedFiles);
                setThemeExportError(null);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Theme tokens could not be compiled.';
                setThemeExportError(message);
                setToastMessage(`Theme cannot be exported: ${message}`);
                setToastType('error');
                setShowToast(true);
                return false;
            }
        } else {
            filesForSave = applyThemeConfigFiles(files, null);
            setThemeExportError(null);
        }
        const filteredFiles = Object.fromEntries(
            Object.entries(filesForSave).filter(([_, fileData]) => fileData.hidden !== true)
        );
        const component = {
            name,
            description,
            code: JSON.stringify(filteredFiles),
            language: template,
            visibility: visibilityOverride ?? privacy,
            isShared: isShared,
            pageSettings: previewSettings,
            usedUiFrameworks: usedUiFrameworks,
            usedDeps: usedDeps,
            activeFile: activeFile,
            previewFile: previewFile,
            publishingName: publishingDomain
        };
        if (typeof propSetup === 'boolean') {
            component.isSetup = propSetup;
        }
        if (params.id) {
            component.id = params.id;
        }
        const response = await createComponent(component);
        if (response.status === 201) {
            setToastMessage('Component saved successfully');
            setToastType('success');
            setFiles(filesForSave);
            const hash = generateHashForAllFiles(filesForSave);
            setTextHash(hash);
        } else {
            setToastMessage(response.data.message || 'Failed to save component');
            setToastType('error');
            setShowToast(true);
            setPublishModalOpen(false);
            return false;
        }
        const themeSaved = await handleThemeSave();
        if (!themeSaved) {
            setPublishModalOpen(false);
            return false;
        }
        handleUploadImage();
        handleSaveGif();
        setShowToast(true);
        setPublishModalOpen(false);
        return response.status === 201;
    };
    const handleSave = async () => {
        setImageRequested(true);
        const imagePromise = new Promise((resolve, reject) => {
            setImageReceivePromise({ resolve, reject });
            setTimeout(() => {
                reject('Image capture timeout');
            }, 1500);
        });

        try {
            await imagePromise;
        } catch (error) {
            console.warn('Image capture timed out, proceeding with save');
        }

        await handleSaveComponent();
    }
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
            case 'tailwind-ts-v4':
            case 'tailwind-v4':
                return {
                    "tailwindcss": "4.0.6"
                }
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
        const configFiles = await getUIConfigFiles(template, previewSettings, usedUiFrameworks, framework, files, true);
        return configFiles;
    }

    const handleUpdateSetup = async () => {
        setPrivacy('draft');
        let updatedFiles = { ...files };

        for (const framework of usedUiFrameworks) {
            const configFiles = await initFrameworkConfigFiles(framework);
            updatedFiles = { ...updatedFiles, ...configFiles };
        }

        setFiles(updatedFiles);
        setPendingSave(true);
    }
    const handleThemeSave = async () => {
        if (!initialTheme?.id) return true;
        const response = await insertTheme({ id: initialTheme.id, factors: initialTheme.factors, groups: initialTheme.groups, values: initialTheme.values }, initialTheme.etag);
        if (response.status === 201) {
            setInitialTheme({ ...response.data, etag: response.etag });
            return true;
        }
        if (response.status === 409) {
            setToastMessage('This theme changed in another tab. Reload it before saving again.');
        } else if (response.status === 404) {
            setToastMessage('This theme no longer exists or you no longer have access. Reload the component.');
        } else if (response.status === 400 && typeof response.data?.message === 'string') {
            setToastMessage(response.data.message.slice(0, 300));
        } else {
            setToastMessage('Failed to save theme. Reload the component and try again.');
        }
        setToastType('error');
        setShowToast(true);
        return false;
    }
    const handleLoadTheme = async () => {
        if (!initialTheme?.id) return;
        const response = await getTheme(initialTheme.id);
        if (response.status === 200) {
            setInitialTheme({ ...response.data, etag: response.etag });
        }
    }
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = undefined;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);
    const handleUpvoteStatus = (newStatus) => {
        if (newStatus === upvoteStatus) {
            setUpvoteStatus(null);
            // Just remove the previous vote
            setUpvoteCount(upvoteCount + (upvoteStatus === 'upvote' ? -1 : 1));
        }
        // If switching from one vote to another
        else if (upvoteStatus !== null) {
            setUpvoteStatus(newStatus);
            // Need to reverse previous vote (-1) and add new vote (+1) = 2 vote difference
            setUpvoteCount(upvoteCount + (newStatus === 'upvote' ? 2 : -2));
        }
        // If voting for the first time
        else {
            setUpvoteStatus(newStatus);
            // Simply add the new vote
            setUpvoteCount(upvoteCount + (newStatus === 'upvote' ? 1 : -1));
        }
    }
    const renderTitle = () => {
        if (isOwner) return 'Component editor';
        return <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-400">{upvoteCount >= 0 ? `+${upvoteCount}` : upvoteCount}</span>
            <UpvoteButtons id={params.id} status={upvoteStatus} changeStatus={handleUpvoteStatus} />
        </div>
    }


    const getFiles = () => {
        return Object.entries(files)
            .filter(([_, fileData]) => fileData.hidden !== true && fileData.code != null && fileData.code.trim() !== '')
            .map(([path, fileData]) => `//${path}\n${fileData.code}`)
            .join('\n');
    }

    const handleSaveComponentRef = useRef(handleSaveComponent);
    handleSaveComponentRef.current = handleSaveComponent;

    useEffect(() => {
        if (pendingSave) {
            const saveFiles = async () => {
                await handleSaveComponentRef.current(true);
                setIsSetup(true);
                setPendingSave(false);
            };
            saveFiles();
        }
    }, [pendingSave, files]);

    return (
        <div className="flex flex-col items-center justify-between px-4 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
            <div className="flex flex-row items-center justify-between w-full mt-8 mb-4">
                <motion.h4
                    className="sm:hidden text-2xl md:text-3xl font-extrabold text-start w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                    initial={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Editor
                </motion.h4>
                <motion.h4
                    className="hidden sm:block text-2xl md:text-3xl font-extrabold text-start w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                    initial={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {renderTitle()}
                </motion.h4>
                <p className='text-sm text-yellow-500 w-[160px]'>{renderSaveStatus()}</p>
                {template && <div className="flex flex-row items-center gap-2">
                    {!isOwner && <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setReportModalOpen(true)}
                        size="small"
                        text=""
                        Icon={TriangleAlert}
                    />}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handlePublish}
                        size="small"
                        text={isOwner ? 'Publish' : 'Fork'}
                        showIcon={false}
                    />
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleShare}
                        size="small"
                        text=""
                        Icon={Share2}
                    />
                </div>
                }

            </div>
            {themeExportError && (
                <p className="mb-4 w-full rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    Theme cannot be exported: {themeExportError}
                </p>
            )}
            {template && <Editor
                key={isSetup ? 'setup' : 'editor'}
                initialFiles={files}
                template={template}
                name={name}
                getFiles={setFiles}
                requestImage={imageRequested}
                onImageReceived={handleImageReceived}
                setRequestImage={setImageRequested}
                previewSettings={previewSettings}
                setPreviewSettings={setPreviewSettings}
                usedUiFrameworks={usedUiFrameworks}
                setUsedUiFrameworks={setUsedUiFrameworks}
                onSave={handleSave}
                textHash={textHash}
                initialTheme={initialTheme}
                setTheme={setInitialTheme}
                id={params.id}
                handleLoadTheme={handleLoadTheme}
                usedDeps={usedDeps}
                setUsedDeps={setUsedDeps}
                setTextHash={setTextHash}
                activeFile={activeFile}
                setActiveFile={setActiveFile}
                onGifReceived={onGifReceived}
                setPreviewFile={setPreviewFile}
                previewFile={previewFile}
                isSetupServer={isSetupServer.current}
                onThemeExportError={setThemeExportError}
            />}
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
            <ShareCreateModal
                shareModalOpen={shareModalOpen}
                setShareModalOpen={setShareModalOpen}
                shareUrl={shareUrl}
                setShareUrl={setShareUrl}
                setToastMessage={setToastMessage}
                setToastType={setToastType}
                setShowToast={setShowToast}
                id={params.id}
                image={imageRef.current}
                privacy={privacy}
            />

            <PublishCreateModal
                publishModalOpen={publishModalOpen}
                setPublishModalOpen={setPublishModalOpen}
                name={name}
                setName={setName}
                description={description}
                setDescription={setDescription}
                privacy={privacy}
                setPrivacy={setPrivacy}
                handleSaveComponent={handleSaveComponent}
                image={imageRef.current}
                publishingDomain={publishingDomain}
                setPublishingDomain={setPublishingDomain}
                componentId={params.id}
                fileTextContent={getFiles()}
            />
            <ReportModal
                reportModalOpen={reportModalOpen}
                setReportModalOpen={setReportModalOpen}
                id={params.id}
                setToastMessage={setToastMessage}
                setToastType={setToastType}
                setShowToast={setShowToast}
            />
            <LimitModal isOpen={limitModalOpen} onClose={() => setLimitModalOpen(false)} message={limitModalMessage} />
            <SetupModal
                isOpen={!isSetup}
                onClose={() => setIsSetup(true)}
                template={template}
                setSelectedUIFramework={setUsedUiFrameworks}
                setPageView={(view) => setPreviewSettings({ ...previewSettings, ...view })}
                onContinue={() => handleUpdateSetup()}
            />
            <ComponentLimit isOpen={!canCreate} onClose={() => setCanCreate(true)} />

        </div>
    )
}

export default withAuth(EditComponent)
