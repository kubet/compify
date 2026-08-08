import React from 'react'
import { motion } from 'framer-motion'
import InputControl from './InputControl';
import UtilityInput from '@/components/Elements/UtilityInput';
import LabelButton from '@/components/Elements/LabelButton';
import { ChevronDownIcon } from 'lucide-react';


export default function ValueTokens({ values, setValues, updateValue, removeValue, getAllTokens, checkDuplicateName, checkTokenNameExists, publicGroups = [] }) {
    return (
        <div className="space-y-4">
            <motion.h5
                className="text-lg mb-4 md:text-xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Values (Application Level)
            </motion.h5>

            {publicGroups.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-xl"
                >
                    <div className="absolute inset-0" />

                    <div className="relative z-10 flex gap-2 ">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Included whole groups:</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {publicGroups.map((group, idx) => (
                                <motion.span
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-700/50 text-gray-300 font-medium transition-all duration-200 hover:border-gray-600/50 hover:from-gray-800 hover:to-gray-700 cursor-default select-none"
                                >
                                    {group}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {values.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <UtilityInput
                        value={item.key}
                        onChange={(e) => updateValue(index, { ...item, key: e.target.value })}
                        className="w-1/2"
                        errorMessage={checkDuplicateName(item.key, 'values') ? 'Name already exists' : ''}
                        errorColor='#eab208'
                    />
                    {checkDuplicateName(item.key, 'values') && (
                        <span role="alert" className="sr-only">Value name already exists</span>
                    )}
                    <InputControl
                        token={item}
                        onChange={(updatedToken) => updateValue(index, updatedToken)}
                        className="w-full"
                        itemKey={item.key}
                        isNumber={false}
                        tokens={getAllTokens}
                        checkTokenNameExists={checkTokenNameExists}
                    />
                    <LabelButton onClick={() => removeValue(index)} variant='danger'>Remove</LabelButton>
                </div>
            ))}
            <LabelButton onClick={() => {
                setValues(prev => [...prev, { key: `customValue${prev.length + 1}`, value: '', c: '' }]);
            }} variant='info'>
                + Add Custom Value
            </LabelButton>
        </div>
    )
}

