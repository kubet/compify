import React from 'react';
import { motion } from 'framer-motion';
import { Code, Info } from 'lucide-react';
import { GradientSpot } from '../Common';
import CardWrapper from '../Elements/CardWrapper';


const TemplateCard = ({ name, description, language, onClick, color }) => {
    return (
        <CardWrapper color={color} onClick={onClick}>
            <div className="relative z-1">
                <h3 className="text-xl font-bold text-gray-200 truncate mb-2">{name}</h3>
                <p className="text-gray-400 text-sm mb-4">{description}</p>
                <div className="flex justify-between items-center text-gray-400">
                    <div className="flex items-center space-x-2 opacity-80">
                        <Code size={16} className={language === 'JavaScript' ? 'text-yellow-400' : 'text-blue-400'} />
                        <span className={`text-sm ${language === 'JavaScript' ? 'text-yellow-400' : 'text-blue-400'}`}>
                            {language}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Info size={18} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
};

export default TemplateCard;