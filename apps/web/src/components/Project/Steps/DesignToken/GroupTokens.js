import { AnimatePresence, motion } from 'framer-motion'
import UtilityInput from '@/components/Elements/UtilityInput';
import InputControl from './InputControl';
import LabelButton from '@/components/Elements/LabelButton';
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, ListIcon, PaletteIcon } from 'lucide-react';
import Modal from '@/components/Elements/Modal';
import CardWrapper from '@/components/Elements/CardWrapper';
import { Button } from '@/components/Elements';
import RadioButton from '@/components/Elements/RadioButton';

export default function GroupTokens({ groups,
    updateGroup,
    removeGroup,
    addGroup,
    toggleGroup,
    expandedGroups,
    tokens,
    checkDuplicateName,
    checkTokenNameExists,
    updateGroupName }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalError, setModalError] = useState('');
    const [modalState, setModalState] = useState({
        selectedOption: null,
        name: '',
        isEditing: false,
        editingKey: null,
        isPublic: false
    });

    const options = [
        {
            label: 'Palette Group',
            value: 'palette',
            icon: PaletteIcon,
            color: '#FF69B440',
            description: 'Color variations'
        },
        {
            label: 'Values Group',
            value: 'values',
            icon: ListIcon,
            color: '#1E90FF40',
            description: 'Custom values'
        }
    ];

    const handleOptionClick = (option, e) => {
        e.stopPropagation();

        setModalState(prev => ({
            ...prev,
            selectedOption: option.value === prev.selectedOption?.value ? null : option
        }));
    };

    const handleEditGroup = (groupKey) => {
        const group = groups[groupKey];
        const groupType = group.type;
        const selectedOption = options.find(opt => opt.value === groupType);

        setModalState({
            selectedOption,
            name: groupKey,
            isEditing: true,
            editingKey: groupKey,
            isPublic: group.isPublic || false
        });
        setIsModalOpen(true);
    };

    const handleAddOrUpdateGroup = () => {
        if (!modalState.selectedOption || !modalState.name) return;

        if (modalState.isEditing) {
            const oldKey = modalState.editingKey;
            const newKey = modalState.name;
            const newType = modalState.selectedOption.value;

            if (oldKey !== newKey && groups[newKey]) {
                setModalError('A group with this name already exists');
                return;
            }

            updateGroupName(oldKey, newKey, newType, modalState.isPublic);
        } else {
            if (groups[modalState.name]) {
                setModalError('A group with this name already exists');
                return;
            }
            addGroup(null, modalState.selectedOption.value, modalState.name, modalState.isPublic);
        }

        setModalError('');
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setModalError('');
        setModalState({
            selectedOption: null,
            name: '',
            isEditing: false,
            editingKey: null,
            isPublic: false
        });
    };

    const validateGroupName = (name) => {
        if (modalState.isEditing && name === modalState.editingKey) return true;
        return !groups[name];
    };

    return (
        <div className="space-y-4">
            <motion.h5
                className="text-lg mb-4 md:text-xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Groups (Molecular Level)
            </motion.h5>
            {Object.entries(groups).map(([groupKey, groupValues], index) => (
                <div key={groupKey + index} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <button
                            className="flex items-center justify-between w-full text-left font-semibold"
                            onClick={() => toggleGroup(groupKey)}
                        >
                            <span>{groupKey}</span>
                            {expandedGroups[groupKey] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </button>
                    </div>
                    <AnimatePresence>
                        {expandedGroups[groupKey] && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="py-4 flex items-center justify-between gap-2">
                                    <LabelButton
                                        onClick={() => handleEditGroup(groupKey)}
                                        variant='info'
                                    >
                                        Edit Group
                                    </LabelButton>
                                    <LabelButton
                                        onClick={() => removeGroup(groupKey)}
                                        variant='danger'
                                    >
                                        Remove Group
                                    </LabelButton>
                                </div>
                                {groupValues.options.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <div className="w-1/2">
                                            <UtilityInput
                                                value={item.key}
                                                onChange={(e) => updateGroup(groupKey, index, { ...item, key: e.target.value })}
                                                className="w-full"
                                                StartElement={<div className="text-gray-500">{groupKey}-</div>}
                                                errorMessage={checkDuplicateName(item.key, 'groups', groupKey) ? 'Name already exist' : ''}
                                                errorColor='#eab208'
                                            />
                                            {checkDuplicateName(item.key, 'groups', groupKey) && (
                                                <span role="alert" className="sr-only">Group option name already exists</span>
                                            )}
                                        </div>
                                        <div className="w-1/2">
                                            <InputControl
                                                token={item}
                                                onChange={(updatedToken) => updateGroup(groupKey, index, updatedToken)}
                                                className="w-full"
                                                itemKey={groupKey}
                                                isNumber={false}
                                                tokens={tokens}
                                                checkTokenNameExists={checkTokenNameExists}
                                            />
                                        </div>
                                        <LabelButton onClick={() => removeGroup(groupKey, index)} variant='danger'>Remove</LabelButton>
                                    </div>
                                ))}
                                <LabelButton onClick={() => addGroup(groupKey)} variant='info'>+ Add Item</LabelButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
            <LabelButton onClick={() => setIsModalOpen(true)} variant='info'>
                + Add Group
            </LabelButton>

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                color='hsl(280, 80%, 75%)'
                backdropColor='hsl(280, 80%, 25%)'
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
                            {modalState.isEditing ? 'Edit Group' : 'Add Group'}
                        </motion.h5>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex flex-wrap gap-4 w-full">
                            {options.map((option) => (
                                <CardWrapper
                                    key={option.value}
                                    color={option.color}
                                    onClick={(e) => handleOptionClick(option, e)}
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
                                            <span className="text-xs text-gray-500">{option.description}</span>
                                        </div>
                                    </div>
                                </CardWrapper>
                            ))}
                        </div>

                        {modalState.selectedOption && (
                            <div className="border-t border-[rgba(255,255,255,0.1)] pt-6 space-y-4">
                                <div>
                                    <h6 className="text-sm font-medium text-gray-400 mb-2">Group Name</h6>
                                    <UtilityInput
                                        value={modalState.name}
                                        placeholder="Enter group name..."
                                        onChange={(e) => {
                                            setModalError('');
                                            setModalState(prev => ({ ...prev, name: e.target.value }));
                                        }}
                                        isNumber={false}
                                        className="w-full"
                                        errorMessage={
                                            !validateGroupName(modalState.name)
                                                ? 'Group name already exists'
                                                : ''
                                        }
                                        errorColor='#eab208'
                                    />
                                </div>
                                {modalError && (
                                    <p role="alert" aria-live="assertive" className="text-sm text-yellow-500">
                                        {modalError}
                                    </p>
                                )}

                                <div>
                                    <RadioButton
                                        id="privacy-public"
                                        name="privacy"
                                        value="public"
                                        toggleable={true}
                                        checked={modalState.isPublic}
                                        onChange={(e) => setModalState(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                                        label="Make whole group avalible in application level"
                                        color="primary"
                                        size="medium"
                                        className="flex items-center"
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        text={modalState.isEditing ? 'Update Group' : 'Add Group'}
                                        onClick={handleAddOrUpdateGroup}
                                        color='green'
                                        showIcon={false}
                                        disabled={
                                            !modalState.selectedOption ||
                                            !modalState.name ||
                                            !validateGroupName(modalState.name)
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    )
}