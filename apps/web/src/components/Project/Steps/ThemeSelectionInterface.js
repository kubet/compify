'use client'
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Wand2, Palette, Layout } from 'lucide-react';
import GlowingOutline from '@/components/Common/GlowingOutline';
import CardWrapper from '@/components/Elements/CardWrapper';

const ThemeSelectionInterface = ({ onSelectOption }) => {
  const options = [
    {
      title: "AI Quick Setup",
      description: "Let AI design your perfect theme",
      icon: <Wand2 size={24} />,
      bg: 'bg-gradient-to-r from-blue-500 to-purple-500 opacity-70',
      time: "2 minutes",
      onClick: () => onSelectOption('ai'),
      play: true,
      color: 'hsl(252, 100%, 67%)'
    },
    {
      title: "Blank Theme",
      description: "Design your theme from scratch",
      icon: <Palette size={24} />,
      bg: 'bg-gradient-to-r from-orange-500 to-yellow-500 opacity-70',
      time: "10-20 minutes",
      onClick: () => onSelectOption('custom'),
      play: false,
      color: 'hsl(32, 100%, 67%)'
    },
    {
      title: "Pre-built Templates",
      description: "Choose from our curated templates",
      icon: <Layout size={24} />,
      bg: 'bg-gradient-to-r from-green-500 to-blue-500 opacity-70',
      time: "Instant",
      onClick: () => onSelectOption('template'),
      play: false,
      color: 'hsl(192, 100%, 67%)'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.h4
        className="text-2xl mb-6 md:text-3xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Choose Your Theme Setup
      </motion.h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option, index) => (
          <CardWrapper className='p-0' color={option.color} onClick={option.onClick} key={index}>
            <GlowingOutline key={index} play={option.play}>
              <div className='p-6'>
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full mr-3 ${option.bg}`}>
                    {option.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">{option.title}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4 flex-grow">{option.description}</p>
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock size={16} className="mr-2" />
                  <span>{option.time}</span>
                </div>
              </div>
            </GlowingOutline>

          </CardWrapper>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelectionInterface;