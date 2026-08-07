'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import LabelButton from '@/components/Elements/LabelButton';
import { ArrowLeft, Palette, Plus, Search } from 'lucide-react';
// import { deleteComponent, getProjectDetails } from '@/lib/api';
import Tab from '@/components/Elements/Tab';
import { useInView } from 'react-intersection-observer';
import { Button, InputField } from '@/components/Elements';
import ConfirmationModal from '@/components/Common/ConfirmationModal';
import ComponentCard from '@/components/Component/Card';
import UILibStep from '@/components/Project/Steps/UILibStep';
import QuickStartCard from '@/components/Elements/QuickStartCard';
import TemplateCard from '@/components/Editor/TemplateCard';

function ComponentTab({ components }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredComponents, setFilteredComponents] = useState(components || []);
    const { ref, inView } = useInView({
        threshold: 0,
    });
    const [isScrolled, setIsScrolled] = useState(false);
    const router = useRouter();
    const params = useParams();

    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        componentId: null
    });

    useEffect(() => {
        const filtered = components?.filter(component => component.name.toLowerCase().includes(searchQuery.toLowerCase()));
        setFilteredComponents(filtered);
    }, [components, searchQuery]);

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadProjectComponents(nextPage);
        }
    }, [inView]);

    const handleCreateComponent = () => {
        router.push(`/project/${params.id}/create`);
    };

    const handleDeleteComponent = async (id) => {
        setDeleteConfirmation({
            isOpen: true,
            componentId: id
        });
    };

    const handleConfirmDelete = async () => {
        if (deleteConfirmation.componentId) {
            const resp = await deleteComponent(deleteConfirmation.componentId);
            if (resp.status === 200) {
                loadProjectComponents(0);
            }
        }
        setDeleteConfirmation({
            isOpen: false,
            componentId: null
        });
    };

    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 0);
    };

    return (
        <>
            <div className="flex flex-col w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 w-full">
                    <div className="relative flex-grow max-w-xl w-full">
                        <InputField
                            type="text"
                            placeholder="Search components..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 bg-gray-800 text-white"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleCreateComponent} text="New Component" Icon={Plus} />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative pr-2 pl-[2px]" onScroll={handleScroll}>
                <div className={`sticky top-0 left-0 w-full h-12 bg-gradient-to-b from-black via-black/50 to-transparent pointer-events-none z-10 transition-all duration-200 ${isScrolled ? 'opacity-80 h-12' : 'opacity-0 max-h-4'}`} />

                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-2"
                >
                    <AnimatePresence>
                        {filteredComponents?.map(component => (
                            <motion.div
                                key={component.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ComponentCard
                                    component={component}
                                    onDelete={handleDeleteComponent}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, componentId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Component"
                description="Are you sure you want to delete this component? This action cannot be undone."
                confirmText="Delete"
            />
        </>
    );
}

function ProjectPage() {
    const [project, setProject] = useState({ name: '' })
    const [activeTab, setActiveTab] = useState('components')
    const router = useRouter();
    const params = useParams();
    useEffect(() => {
        const fetchProjectDetails = async () => {
            // const response = await getProjectDetails(params.id)
            // setProject(response.data)
        }
        fetchProjectDetails()
    }, [])

    return (
        <div className="flex flex-col items-start justify-between px-4 mt-8 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
            <LabelButton
                Icon={ArrowLeft}
                variant='info'
                onClick={() => router.back()}
            >Back</LabelButton>
            <motion.h4
                className="text-2xl my-4 md:text-3xl font-extrabold text-start w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {project.name}
            </motion.h4>

            <div className="w-full border-b border-[rgba(255,255,255,0.1)]">
                <nav className="-mb-px flex">
                    <Tab isActive={activeTab === 'components'} onClick={() => setActiveTab('components')}>
                        Components
                    </Tab>
                    <Tab isActive={activeTab === 'themes'} onClick={() => setActiveTab('themes')}>
                        Themes
                    </Tab>
                    <Tab isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
                        Settings
                    </Tab>
                </nav>
            </div>

            <div className="w-full mt-6 relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'components' && (
                        <motion.div
                            key="components"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ComponentTab components={project.components} />
                        </motion.div>
                    )}
                    {activeTab === 'themes' && (
                        <motion.div
                            key="themes"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {project.themes?.map((theme) => (
                                    <TemplateCard
                                        key={theme.id}
                                        name={theme.name}
                                        description={`Theme configuration for ${project.name}`}
                                        language={project.language}
                                        onClick={() => {
                                            const searchParams = new URLSearchParams({
                                                p: project.id,
                                                t: theme.id
                                            }).toString();
                                            router.push(`/theme?${searchParams}`);
                                        }}
                                        color="#9333ea"  // Purple color for themes
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'settings' && (
                        <UILibStep runtime={project.language} handleUiLibSelect={() => { }} saveText="Save" pageSettings={project?.pageSettings} uiLibs={project?.useduiframeworks} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default ProjectPage