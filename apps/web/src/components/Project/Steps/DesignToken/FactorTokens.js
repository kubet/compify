import { motion } from 'framer-motion'
import UtilityInput from '@/components/Elements/UtilityInput';
import InputControl from './InputControl';
import LabelButton from '@/components/Elements/LabelButton';
import { useState } from 'react';
import { ListIcon, PaletteIcon, SlidersIcon } from 'lucide-react';
import Modal from '@/components/Elements/Modal';
import CardWrapper from '@/components/Elements/CardWrapper';
import { Button } from '@/components/Elements';

export default function FactorTokens({ factors, updateFactor, removeFactor, addFactor, checkDuplicateName, checkTokenNameExists }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalState, setModalState] = useState({
        selectedOption: null,
        name: '',
        min: 0,
        max: 100
    });

    const handleOptionClick = (option) => {
        setModalState(prev => ({
            ...prev,
            selectedOption: option.value === prev.selectedOption?.value ? null : option,
            min: option.min || 0,
            max: option.max || 100
        }));
    };

    const handleAddFactor = () => {
        if (!modalState.selectedOption) return;

        const { selectedOption, name, min, max } = modalState;
        let defaultValue = '';

        switch (selectedOption.value) {
            case 'hue':
                defaultValue = '0';
                break;
            case 'lightness':
            case 'saturation':
                defaultValue = '50';
                break;
            case 'slider':
            case 'value':
                defaultValue = min.toString();
                break;
        }

        const newFactor = {
            key: name || `${selectedOption.value}`,
            type: selectedOption.value,
            value: defaultValue,
            min: parseInt(min),
            max: parseInt(max),
        };

        addFactor(newFactor);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setModalState({
            selectedOption: null,
            name: '',
            min: 0,
            max: 100
        });
    };

    const options = [
        { label: 'Hue slider', value: 'hue', icon: PaletteIcon, color: '#FF69B440', min: 0, max: 360 },
        { label: 'Lightness slider', value: 'lightness', icon: PaletteIcon, color: '#1E90FF40', min: 0, max: 100 },
        { label: 'Saturation slider', value: 'saturation', icon: PaletteIcon, color: '#32CD3240', min: 0, max: 100 },
        { label: 'Custom slider', value: 'slider', icon: SlidersIcon, color: '#FF8C0040', min: 0, max: 100 },
        { label: 'Custom Value', value: 'value', icon: ListIcon, color: '#A020F040' },
    ];

    return (
        <div className="space-y-4">
            <motion.h5
                className="text-lg mb-4 md:text-xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Factors (Atomic Level)
            </motion.h5>
            {factors.map((factor, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <div className="w-1/2">
                        <UtilityInput
                            id={`factor-key-${index}`}
                            value={factor.key}
                            onChange={(e) => updateFactor(index, { ...factor, key: e.target.value })}
                            className="w-full"
                            errorMessage={checkDuplicateName(factor.key, 'factors') ? 'Name already exists' : ''}
                            errorColor='#eab208'
                        />
                        {checkDuplicateName(factor.key, 'factors') && (
                            <span role="alert" className="sr-only">Factor name already exists</span>
                        )}
                    </div>
                    <div className="w-1/2">
                        <InputControl
                            token={factor}
                            onChange={(updatedFactor) => updateFactor(index, updatedFactor)}
                            className="w-full"
                            min={factor.min}
                            max={factor.max}
                            itemKey={factor.type}
                            checkTokenNameExists={checkTokenNameExists}
                        />
                    </div>
                    <div className="flex items-center">
                        <LabelButton onClick={() => removeFactor(index)} variant='danger' className="w-full">
                            Remove
                        </LabelButton>
                    </div>
                </div>
            ))}
            <LabelButton onClick={() => setIsModalOpen(true)} variant='info'>
                + Add Factor
            </LabelButton>
            <Modal isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                color='hsl(220, 80%, 75%)'
                backdropColor='hsl(220, 80%, 25%)'
            >
                <div
                    className='flex flex-col h-auto w-[30rem] items-center'
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-5 w-full">
                        <motion.h5
                            className="text-lg md:text-xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Add Factor
                        </motion.h5>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                        {/* Main Factor Types Grid */}
                        <div className="flex flex-wrap gap-4 w-full">
                            {options.map((option) => (
                                <CardWrapper
                                    key={option.value}
                                    color={option.color}
                                    onClick={() => handleOptionClick(option)}
                                    className="flex-1 basis-[calc(50%-0.5rem)] p-4"
                                    hoverEffect={false}
                                    isChecked={modalState.selectedOption?.value === option.value}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-2xl bg-opacity-10" style={{ backgroundColor: option.color }}>
                                            <option.icon size={24} className="text-gray-300" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-medium text-gray-200">{option.label}</span>
                                            {option.min !== undefined ? (
                                                <span className="text-xs text-gray-500">
                                                    Range: {option.min} - {option.max}
                                                </span>
                                            ) : <span className="text-xs text-gray-500">∞</span>}
                                        </div>
                                    </div>
                                </CardWrapper>
                            ))}
                        </div>

                        {/* Input Fields Section */}
                        {modalState.selectedOption && (
                            <div className="border-t border-[rgba(255,255,255,0.1)] pt-6 space-y-4">
                                <div>
                                    <h6 className="text-sm font-medium text-gray-400 mb-2">Custom Name</h6>
                                    <UtilityInput
                                        value={modalState.name}
                                        placeholder="Enter a custom factor name..."
                                        onChange={(e) => setModalState(prev => ({ ...prev, name: e.target.value }))}
                                        isNumber={false}
                                        className="w-full"
                                    />
                                </div>

                                {(modalState.selectedOption.value === 'slider') && (
                                    <>
                                        <div>
                                            <h6 className="text-sm font-medium text-gray-400 mb-2">Min Value</h6>
                                            <UtilityInput
                                                value={modalState.min}
                                                placeholder='Min Value'
                                                onChange={(e) => setModalState(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                                                isNumber={true}
                                            />
                                        </div>
                                        <div>
                                            <h6 className="text-sm font-medium text-gray-400 mb-2">Max Value</h6>
                                            <UtilityInput
                                                value={modalState.max}
                                                placeholder='Max Value'
                                                onChange={(e) => setModalState(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                                                isNumber={true}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end pt-4">
                                    <Button
                                        text='Add Factor'
                                        onClick={handleAddFactor}
                                        color='purple'
                                        showIcon={false}
                                        disabled={!modalState.selectedOption}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}