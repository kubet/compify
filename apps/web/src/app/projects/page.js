'use client'
import { Button, Dropdown, InputField } from "@/components/Elements";
import Select from "@/components/Elements/Select";
import { ProjectCard } from "@/components/Projects";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { withAuth } from "@/auth/UseUser";
import ConfirmationModal from "@/components/Common/ConfirmationModal";

const ProjectsPage = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all-projects');
    const [projects, setProjects] = useState([
        { id: 1, name: 'Project Alpha', componentCount: 5, status: 'public', themes: ['dark', 'minimalist'] },
        { id: 2, name: 'Project Beta', componentCount: 3, status: 'private', themes: ['light', 'colorful'] },
        // Add more sample projects as needed
    ]);
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        projectId: null
    });

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (activeFilter === 'all-projects' ||
            (activeFilter === 'my-projects' && project.status === 'private') ||
            (activeFilter === 'public-projects' && project.status === 'public'))
    );

    const handleCreateProject = () => {
        router.push('/projects/new');
    };

    const handleEditProject = (id) => {
        // console.log(`Editing project ${id}`);
    };

    const handleDeleteProject = (e, id) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setDeleteConfirmation({
            isOpen: true,
            projectId: id
        });
    };

    const handleConfirmDelete = async () => {
        if (deleteConfirmation.projectId) {
            // const resp = await deleteProject(deleteConfirmation.projectId);
            // if (resp.status === 200) {
            //     fetchProjects();
            // }
        }
        setDeleteConfirmation({
            isOpen: false,
            projectId: null
        });
    };

    const handleToggleVisibility = (id) => {
        // console.log(`Toggling visibility for project ${id}`);
    };

    const fetchProjects = async () => {
        // const resp = await getAllMyProjects();
        // if (resp.status === 200) {
        //     setProjects(resp.data);
        // }
    }

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <div className="flex flex-col items-center justify-between px-4 mt-8 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
            {/* Projects Section */}
            <motion.h4
                className="text-2xl mb-4 md:text-3xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Projects
            </motion.h4>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 w-full">
                <div className="relative flex-grow max-w-xl w-full">
                    <InputField
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 bg-gray-800 text-white"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="flex items-center gap-4">
                    {/* <Dropdown
                        options={[
                            { value: 'all-projects', label: 'All Projects' },
                            { value: 'my-projects', label: 'My Projects' },
                            { value: 'public-projects', label: 'Public Projects' },
                        ]}
                        className="max-w-52"
                    /> */}
                    <Button onClick={handleCreateProject} text="New Project" Icon={Plus} className="" />
                </div>
            </div>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                <AnimatePresence>
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={handleEditProject}
                            onDelete={(e, id) => handleDeleteProject(e, id)}
                            onToggleVisibility={handleToggleVisibility}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, projectId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Project"
                description="Are you sure you want to delete this project? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
};

export default withAuth(ProjectsPage);