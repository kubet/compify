import { useState, useEffect } from "react";
import { Button, Chip, InputField } from "../Elements";
import { Code, Folder, File } from "lucide-react";
import TemplateCard from "./TemplateCard";
import { motion } from "framer-motion";
import NameAndTypeSelector from "./TemplateSelectorSteps/NameAndTypeSelector";
import { runtimeList } from "./Templates/common";
import { ProjectCard } from "../Projects";
import ComponentCard from "../Component/Card";
import { getExampleComponents } from "@/lib/api";


const ExampleScreen = () => {
    const [exampleComponents, setExampleComponents] = useState([]);
    const loadExampleComponents = () => {
        getExampleComponents().then((response) => {
            setExampleComponents(response.data);
        });
    }
    useEffect(() => {
        loadExampleComponents();
    }, []);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleComponents.map((component) => (
                <ComponentCard key={component.id} component={{ ...component, imageUploaded: true }} />
            ))}
        </div>
    )
}

const TemplateSelector = ({ onSelectTemplate = () => { }, step, setStep, name, setName }) => {
    const [projectType, setProjectType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [nameError, setNameError] = useState('');


    const categories = ['All', ...new Set(runtimeList.map(r => r.language))];
    const languageFullNames = {
        'All': 'All',
        'JavaScript': 'JavaScript',
        'TypeScript': 'TypeScript',
        'HTML': 'HTML',
    };

    const filteredRuntimes = runtimeList.filter((runtime) => {
        const matchesSearch = runtime.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || runtime.language === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleRuntimeSelect = (runtimeId) => {
        if (nameError) {
            return;
        }
        onSelectTemplate(runtimeId, projectType, name);
    };

    const dummyProjects = [
        { id: 1, name: 'Project 1', description: 'Description for Project 1', componentCount: 10, themes: ['Theme 1', 'Theme 2'], status: 'public' },
        { id: 2, name: 'Project 2', description: 'Description for Project 2', componentCount: 5, themes: ['Theme 3'], status: 'private' },
        { id: 3, name: 'Project 3', description: 'Description for Project 3', componentCount: 2, themes: ['Theme 4', 'Theme 5'], status: 'public' },
    ];

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <NameAndTypeSelector
                        componentName={name}
                        setComponentName={setName}
                        setNameError={setNameError}
                        nameError={nameError}
                        setStep={setStep}
                        onSelectTemplate={handleRuntimeSelect}
                    />
                );
            case 1:
                return (
                    <>
                        <div className="flex space-x-4 mb-6">
                            {categories.map((category) => (
                                <Chip
                                    key={category}
                                    isSelected={selectedCategory === category}
                                    label={languageFullNames[category]}
                                    onSelect={() => setSelectedCategory(category)}
                                    showX={false}
                                    color={selectedCategory === category ? 'blue' : 'gray'}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRuntimes.map((runtime) => (
                                <TemplateCard
                                    key={runtime.id}
                                    name={runtime.name}
                                    description={runtime.description}
                                    language={runtime.language}
                                    color={runtime.color}
                                    onClick={() => handleRuntimeSelect(runtime.id)}
                                />
                            ))}
                        </div>
                    </>
                );
            case 2:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dummyProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onEdit={() => console.log('Edit', project.id)}
                                onDelete={() => console.log('Delete', project.id)}
                                onToggleVisibility={() => console.log('Toggle visibility', project.id)}
                                controls={false}
                            />
                        ))}
                    </div>
                );
            case 5:
                return <ExampleScreen />
        }
    };

    return (
        <div className="w-full h-full bg-black text-white pt-6">
            {renderStep()}
        </div>
    );
};

export default TemplateSelector;
