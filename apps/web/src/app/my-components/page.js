'use client'
import { Button, Dropdown, InputField } from "@/components/Elements";
import Select from "@/components/Elements/Select";
import { ProjectCard } from "@/components/Projects";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { deleteComponent, getMyComponents } from "@/lib/api";
import ComponentCard from "@/components/Component/Card";
import { withAuth } from "@/auth/UseUser";
import { useInView } from 'react-intersection-observer';
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import Info from "@/components/Common/Info";
import EmptyState from "@/components/Common/EmptyState";

const MyComponentsPage = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [components, setComponents] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({ value: '', label: 'All Components' });
    const { ref, inView } = useInView({
        threshold: 0,
    });

    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        componentId: null
    });

    const [isScrolled, setIsScrolled] = useState(false);

    // Track if this is the initial mount
    const isInitialMount = useRef(true);

    const loadMyComponents = async (pageNum = 0, query = searchQuery) => {
        if (isLoading && pageNum > 0) return;

        try {
            setIsLoading(true);
            const resp = await getMyComponents(pageNum, query, filter.value);
            if (pageNum === 0) {
                setComponents(resp?.data?.items || []);  // Ensure we set empty array if no items
            } else {
                setComponents(prev => [...prev, ...resp?.data?.items]);
            }
            setHasMore(resp?.data?.items?.length === 12);
        } finally {
            setIsLoading(false);
        }
    }

    // Initial load
    useEffect(() => {
        loadMyComponents(0);
    }, []);

    // Search handling
    useEffect(() => {
        // Skip if this is the initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            setPage(0);
            loadMyComponents(0, searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filter]);

    // Infinite scroll
    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadMyComponents(nextPage);
        }
    }, [inView, hasMore, isLoading]);

    const handleCreateComponent = () => {
        router.push('/create');
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
                loadMyComponents();
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
        <div className="flex flex-col items-center justify-between px-4 sm:mt-8 mt-2 mx-auto w-full max-w-7xl">
            <div className="w-full flex flex-col sm:h-[calc(100vh-110px)] h-[calc(100vh-70px)] ">
                <div className="flex flex-col w-full">
                    <div className="flex items-start gap-2 w-full relative">
                        <motion.h4
                            className="text-2xl mb-4 md:text-3xl font-extrabold bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                            initial={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            My Components
                        </motion.h4>
                        {/* <Info
                            onClick={() => { }}
                            tooltipTitle="My Components"
                            tooltipDescription={`Create and manage your standalone components.
                                Use the search and filters to find specific components.`}
                        /> */}
                    </div>
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
                        <div className="flex items-center sm:hidden w-full gap-4">
                            <Dropdown
                                options={[
                                    { value: '', label: 'All Components' },
                                    { value: 'public', label: 'Public Components' },
                                    { value: 'private', label: 'Private Components' },
                                    { value: 'draft', label: 'Draft Components' },
                                ]}
                                value={filter}
                                onSelect={(value) => setFilter(value)}
                                className="max-w-52"
                            />
                            <Button onClick={handleCreateComponent} fullWidth={true} text="New Component" textSm="New" Icon={Plus} className="" />
                        </div>
                        <div className="items-center hidden sm:flex  gap-4">
                            <Dropdown
                                options={[
                                    { value: '', label: 'All Components' },
                                    { value: 'public', label: 'Public Components' },
                                    { value: 'private', label: 'Private Components' },
                                    { value: 'draft', label: 'Draft Components' },
                                ]}
                                value={filter}
                                onSelect={(value) => setFilter(value)}
                                className="max-w-52"
                            />
                            <Button onClick={handleCreateComponent} text="New Component" textSm="New" Icon={Plus} className="" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto relative pr-2 pl-[2px]" onScroll={handleScroll}>
                    <div className={`sticky top-0 left-0 w-full h-12 bg-gradient-to-b from-black via-black/50 to-transparent pointer-events-none z-10 transition-all duration-200 ${isScrolled ? 'opacity-80 h-12' : 'opacity-0 max-h-4'}`} />

                    {isLoading && components === null ? null : (
                        !components || components.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center">
                                <EmptyState
                                    title="No components found"
                                    description="Create a new component to get started."
                                    action={<Button onClick={handleCreateComponent} text="New Component" textSm="New" Icon={Plus} className="" />}
                                />
                            </div>
                        ) : (
                            <motion.div
                                layout
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
                            >
                                {components?.map((component, index) => (
                                    <motion.div
                                        key={`${component.id}-${index}`}
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
                            </motion.div>
                        )
                    )}

                    {hasMore && (
                        <div ref={ref} className="h-20">
                            {isLoading && components !== null && <div>Loading...</div>}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, componentId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Component"
                description="Are you sure you want to delete this component? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
};

export default withAuth(MyComponentsPage);
