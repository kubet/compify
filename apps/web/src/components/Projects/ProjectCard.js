import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CardWrapper from '../Elements/CardWrapper';
import getColorFromName from '../Common/GetColorFromName';

const ProjectCard = ({ project, onEdit, onDelete, onToggleVisibility, controls = true }) => {
  const router = useRouter();

  return (
    <div className="relative [transform:translateZ(0)]">
      <CardWrapper color={getColorFromName(project.id)} onClick={() => router.push(`/project/${project.id}`)}>
        <div className="relative z-1 h-full flex flex-col justify-between">
          <h3 className="text-xl font-bold text-white truncate mb-2">{project.name}</h3>
          <p className="text-gray-400 text-sm mb-4">Components: {project.componentCount}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {project?.themes?.map((theme, index) => (
              <span key={index} className="px-2 py-1 bg-white/10 rounded-full text-xs text-white">
                {theme.name}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center text-gray-400">
            <span className={`text-sm ${project.status === 'public' ? 'text-green-400' : 'text-yellow-400'}`}>
              {project.status}
            </span>
            {controls && (
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(e, project.id);
                  }}
                >
                  <Trash2 size={20} className="text-red-500" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </CardWrapper>
    </div>
  );
};

export default ProjectCard;