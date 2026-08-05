import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ConfirmationModal from '@/components/Common/ConfirmationModal';
import ValueTokens from './DesignToken/ValueTokens';
import GroupTokens from './DesignToken/GroupTokens';
import { motion } from 'framer-motion';
import FactorTokens from './DesignToken/FactorTokens';
import { DELETE_CONFIGS } from './DesignToken/utils';
const DesignTokens = ({ factors, groups, values, setFactors, setGroups, setValues }) => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        type: null,
        groupKey: null,
        index: null,
        title: '',
        message: ''
    });

    const getAllTokens = useMemo(() => {
        const factorTokens = factors.map(factor => ({ key: factor.key, value: factor.value, c: factor.c }));
        const groupTokens = Object.entries(groups).flatMap(([groupKey, group]) =>
            group.options.map(item => ({ key: `${groupKey}-${item.key}`, value: item.value, c: item.c }))
        );
        return [...factorTokens, ...groupTokens, ...values];
    }, [factors, groups, values]);

    const updateFactor = useCallback((index, updatedFactor) => {
        setFactors(prev => {
            const newFactors = [...prev];
            newFactors[index] = updatedFactor;
            return newFactors;
        });
    }, [setFactors]);

    const handleDelete = (type, groupKey = null, index = null) => {
        const isGroupItem = type === 'group' && index !== null;
        const config = DELETE_CONFIGS[isGroupItem ? 'groupItem' : type];

        setDeleteConfirmation({
            isOpen: true,
            type,
            groupKey,
            index,
            ...config
        });
    };

    const handleConfirmDelete = () => {
        const { type, groupKey, index } = deleteConfirmation;

        const deleteActions = {
            factor: () => {
                setFactors(prev => prev.filter((_, i) => i !== index));
            },
            group: () => {
                if (index === null) {
                    // Delete entire group
                    setGroups(prev => {
                        const { [groupKey]: _, ...rest } = prev;
                        return rest;
                    });
                    setExpandedGroups(prev => {
                        const { [groupKey]: _, ...rest } = prev;
                        return rest;
                    });
                } else {
                    // Delete single group item
                    setGroups(prev => ({
                        ...prev,
                        [groupKey]: {
                            ...prev[groupKey],
                            options: prev[groupKey].options.filter((_, i) => i !== index)
                        }
                    }));
                }
            },
            value: () => {
                setValues(prev => prev.filter((_, i) => i !== index));
            }
        };

        deleteActions[type]?.();
        closeDeleteConfirmation();
    };

    const closeDeleteConfirmation = () => {
        setDeleteConfirmation({
            isOpen: false,
            type: null,
            groupKey: null,
            index: null,
            title: '',
            message: ''
        });
    };

    const removeFactor = (index) => handleDelete('factor', null, index);
    const removeGroup = (groupKey, index = null) => handleDelete('group', groupKey, index);
    const removeValue = (index) => handleDelete('value', null, index);

    const addFactor = (factor) => {
        setFactors(prev => [...prev, factor]);
    };
    const toggleGroup = (groupKey) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const updateGroup = (groupKey, index, updatedItem) => {
        setGroups(prev => ({
            ...prev,
            [groupKey]: {
                ...prev[groupKey],
                options: prev[groupKey].options.map((item, i) => i === index ? updatedItem : item)
            }
        }));
    };

    const addGroup = (groupKey = null, type, groupName, isPublic = false) => {
        if (groupKey) {
            setGroups(prev => ({
                ...prev,
                [groupKey]: {
                    ...prev[groupKey],
                    options: [...prev[groupKey].options, { key: 'new-item', value: '', c: '' }]
                }
            }));
        } else {
            const newGroupKey = groupName || `newGroup${Object.keys(groups).length + 1}`;
            setGroups(prev => ({
                ...prev,
                [newGroupKey]: {
                    type,
                    options: [{ key: 'new-item', value: '', c: '' }],
                    isPublic
                }
            }));
            setExpandedGroups(prev => ({
                ...prev,
                [newGroupKey]: true
            }));
        }
    };

    const updateValue = (index, updatedToken) => {
        setValues(prev => {
            const newValues = [...prev];
            newValues[index] = updatedToken;
            return newValues;
        });
    };


    const checkTokenNameExists = (tokenName) => {
        return getAllTokens.some(token => token.key === tokenName.slice(2));
    }

    const tokenScopes = useMemo(() => {
        const factorNames = factors.map(factor => factor.key);
        const groupNames = Object.entries(groups).flatMap(([groupKey, group]) =>
            group.options.map(item => `${groupKey}-${item.key}`)
        );

        return {
            factorsScope: factorNames,
            groupsScope: [...factorNames, ...groupNames]
        };
    }, [factors, groups]);

    const valueTokenScope = useMemo(() => {
        const publicGroupTokens = Object.entries(groups)
            .filter(([_, group]) => group.isPublic)
            .flatMap(([groupKey, group]) =>
                group.options.map(item => `${groupKey}-${item.key}`)
            );
        return [...values.map(value => value.key), ...publicGroupTokens];
    }, [values, groups]);

    const checkDuplicateName = useCallback((tokenName, scope, groupKey = null) => {
        if (!tokenName) return false;
        const tokenKey = groupKey ? groupKey + '-' + tokenName : tokenName;
        const nameList = scope === 'values' ? valueTokenScope : tokenScopes[`${scope}Scope`] || [];
        const occurrences = nameList.reduce((count, name) =>
            name === tokenKey ? count + 1 : count, 0);
        return occurrences > 1;
    }, [tokenScopes, valueTokenScope]);

    const updateGroupName = (oldKey, newKey, type, isPublic) => {
        if (oldKey === newKey &&
            type === groups[oldKey].type &&
            isPublic === groups[oldKey].isPublic) return; // No change if all properties are the same

        setGroups(prev => {
            const entries = Object.entries(prev);
            const index = entries.findIndex(([key]) => key === oldKey);

            if (index === -1) return prev;

            const groupData = prev[oldKey];

            const newEntries = [
                ...entries.slice(0, index),
                [newKey, {
                    ...groupData,
                    type,
                    isPublic
                }],
                ...entries.slice(index + 1)
            ];

            return Object.fromEntries(newEntries);
        });

        setExpandedGroups(prev => {
            const newExpanded = { ...prev };
            const isExpanded = newExpanded[oldKey];
            delete newExpanded[oldKey];
            newExpanded[newKey] = isExpanded;
            return newExpanded;
        });
    };


    const publicGroups = useMemo(() => {
        return Object.entries(groups).filter(([_, group]) => group.isPublic).map(([key]) => key);
    }, [groups]);

    return (
        <div className="space-y-8">

            <FactorTokens
                factors={factors}
                updateFactor={updateFactor}
                removeFactor={removeFactor}
                addFactor={addFactor}
                checkDuplicateName={checkDuplicateName}
                checkTokenNameExists={checkTokenNameExists}
            />

            <GroupTokens
                groups={groups}
                updateGroup={updateGroup}
                removeGroup={removeGroup}
                addGroup={addGroup}
                toggleGroup={toggleGroup}
                expandedGroups={expandedGroups}
                tokens={getAllTokens}
                checkDuplicateName={checkDuplicateName}
                checkTokenNameExists={checkTokenNameExists}
                updateGroupName={updateGroupName}
            />

            <ValueTokens
                values={values}
                setValues={setValues}
                updateValue={updateValue}
                removeValue={removeValue}
                getAllTokens={getAllTokens}
                checkDuplicateName={checkDuplicateName}
                checkTokenNameExists={checkTokenNameExists}
                publicGroups={publicGroups}
            />

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={closeDeleteConfirmation}
                onConfirm={handleConfirmDelete}
                title={deleteConfirmation.title}
                description={deleteConfirmation.message}
                confirmText="Delete"
            />
        </div>
    );
};

export default DesignTokens;