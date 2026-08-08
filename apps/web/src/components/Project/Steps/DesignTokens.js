import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ConfirmationModal from '@/components/Common/ConfirmationModal';
import ValueTokens from './DesignToken/ValueTokens';
import GroupTokens from './DesignToken/GroupTokens';
import { motion } from 'framer-motion';
import FactorTokens from './DesignToken/FactorTokens';
import { DELETE_CONFIGS, findPublicGroupAliasCollision, findThemeTokenReferences, getPublicGroupTokenAliases, hasThemeTokenNameCollision, isValidTokenKey, prepareThemeTokenDeletion, rewriteThemeTokenReferences } from './DesignToken/utils';
const DesignTokens = ({ factors, groups, values, setFactors, setGroups, setValues }) => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [integrityError, setIntegrityError] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        type: null,
        groupKey: null,
        index: null,
        key: null,
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

    const publicGroupAliases = getPublicGroupTokenAliases(groups);

    const rejectInvalidRename = (_oldKey, newKey) => {
        if (!isValidTokenKey(newKey)) {
            setIntegrityError('Token names must start with a letter or underscore, use at most 64 letters, numbers, underscores, or hyphens, and cannot be __proto__, prototype, or constructor.');
            return true;
        }
        if (hasThemeTokenNameCollision({ factors, groups, values }, newKey)) {
            setIntegrityError(`Cannot rename to "${newKey}" because that token name or public group alias already exists.`);
            return true;
        }
        return false;
    };

    const applyTheme = useCallback((theme) => {
        setFactors(theme.factors);
        setGroups(theme.groups);
        setValues(theme.values);
    }, [setFactors, setGroups, setValues]);

    const updateFactor = (index, updatedFactor) => {
        const oldKey = factors[index].key;
        if (oldKey !== updatedFactor.key && rejectInvalidRename(oldKey, updatedFactor.key)) return;
        const nextFactors = factors.map((factor, itemIndex) => itemIndex === index ? updatedFactor : factor);
        const nextTheme = { factors: nextFactors, groups, values };
        setIntegrityError('');
        applyTheme(oldKey !== updatedFactor.key
            ? rewriteThemeTokenReferences(nextTheme, { [oldKey]: updatedFactor.key })
            : nextTheme);
    };

    const deletionTarget = (type, groupKey, index) => {
        if (type === 'factor') return { type, groupKey: null, index, key: factors[index]?.key };
        if (type === 'value') return { type, groupKey: null, index, key: values[index]?.key };
        if (type === 'group' && index !== null) {
            return { type, groupKey, index, key: groups[groupKey]?.options[index]?.key };
        }
        return { type, groupKey, index: null, key: groupKey };
    };

    const deletionReferences = (theme, target) => {
        const plan = prepareThemeTokenDeletion(theme, target);
        if (!plan) return { plan: null, references: [] };
        return {
            plan,
            references: findThemeTokenReferences(plan.remainingTheme, plan.tokenKeys)
        };
    };

    const reportDeletionReferences = (references) => {
        const owners = [...new Set(references.map(reference => reference.owner))].join(', ');
        setIntegrityError(`Cannot delete because ${owners} ${references.length === 1 ? 'references' : 'reference'} the token.`);
    };

    const handleDelete = (type, groupKey = null, index = null) => {
        const isGroupItem = type === 'group' && index !== null;
        const config = DELETE_CONFIGS[isGroupItem ? 'groupItem' : type];
        const target = deletionTarget(type, groupKey, index);
        const { plan, references } = deletionReferences({ factors, groups, values }, target);
        if (!plan) {
            setIntegrityError('The token changed before deletion could be checked. Reopen the delete dialog and try again.');
            return;
        }
        if (references.length) {
            reportDeletionReferences(references);
            return;
        }
        setIntegrityError('');
        setDeleteConfirmation({ isOpen: true, ...target, ...config });
    };

    const handleConfirmDelete = () => {
        const target = {
            type: deleteConfirmation.type,
            groupKey: deleteConfirmation.groupKey,
            index: deleteConfirmation.index,
            key: deleteConfirmation.key
        };
        const { plan, references } = deletionReferences({ factors, groups, values }, target);
        if (!plan) {
            setIntegrityError('The token changed while deletion was awaiting confirmation. Nothing was deleted; reopen the dialog to try again.');
            closeDeleteConfirmation();
            return;
        }
        if (references.length) {
            reportDeletionReferences(references);
            closeDeleteConfirmation();
            return;
        }
        applyTheme(plan.remainingTheme);
        if (target.type === 'group' && target.index === null) {
            setExpandedGroups(prev => {
                const { [target.groupKey]: _removed, ...rest } = prev;
                return rest;
            });
        }
        setIntegrityError('');
        closeDeleteConfirmation();
    };

    const closeDeleteConfirmation = () => {
        setDeleteConfirmation({
            isOpen: false,
            type: null,
            groupKey: null,
            index: null,
            key: null,
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
        const oldItem = groups[groupKey].options[index];
        const oldTokenKey = `${groupKey}-${oldItem.key}`;
        const newTokenKey = `${groupKey}-${updatedItem.key}`;
        if (oldItem.key !== updatedItem.key) {
            if (!isValidTokenKey(updatedItem.key)) {
                setIntegrityError('Token names must start with a letter or underscore, use at most 64 letters, numbers, underscores, or hyphens, and cannot be __proto__, prototype, or constructor.');
                return;
            }
            if (rejectInvalidRename(oldTokenKey, newTokenKey)) return;
            if (groups[groupKey].isPublic &&
                rejectInvalidRename(oldItem.key, updatedItem.key)) return;
        }
        const nextGroups = {
            ...groups,
            [groupKey]: {
                ...groups[groupKey],
                options: groups[groupKey].options.map((item, itemIndex) => itemIndex === index ? updatedItem : item)
            }
        };
        const nextTheme = { factors, groups: nextGroups, values };
        setIntegrityError('');
        applyTheme(oldItem.key !== updatedItem.key
            ? rewriteThemeTokenReferences(nextTheme, {
                [oldTokenKey]: newTokenKey,
                ...(groups[groupKey].isPublic ? { [oldItem.key]: updatedItem.key } : {})
            })
            : nextTheme);
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
        const oldKey = values[index].key;
        if (oldKey !== updatedToken.key && rejectInvalidRename(oldKey, updatedToken.key)) return;
        const nextValues = values.map((value, itemIndex) => itemIndex === index ? updatedToken : value);
        const nextTheme = { factors, groups, values: nextValues };
        setIntegrityError('');
        applyTheme(oldKey !== updatedToken.key
            ? rewriteThemeTokenReferences(nextTheme, { [oldKey]: updatedToken.key })
            : nextTheme);
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
            isPublic === groups[oldKey].isPublic) return;

        if (!isValidTokenKey(newKey)) {
            setIntegrityError('Token names must start with a letter or underscore, use at most 64 letters, numbers, underscores, or hyphens, and cannot be __proto__, prototype, or constructor.');
            return;
        }
        if (oldKey !== newKey && Object.prototype.hasOwnProperty.call(groups, newKey)) {
            setIntegrityError(`Cannot rename the group to "${newKey}" because that group already exists.`);
            return;
        }
        const oldGroupTokenKeys = new Set(groups[oldKey].options.map(option => `${oldKey}-${option.key}`));
        const collidingKey = groups[oldKey].options
            .map(option => `${newKey}-${option.key}`)
            .find(key =>
                getAllTokens.some(token => token.key === key && !oldGroupTokenKeys.has(token.key)) ||
                publicGroupAliases.some(alias => alias.key === key));
        if (collidingKey) {
            setIntegrityError(`Cannot rename the group because token "${collidingKey}" already exists.`);
            return;
        }

        const entries = Object.entries(groups);
        const index = entries.findIndex(([key]) => key === oldKey);
        if (index === -1) return;
        const groupData = groups[oldKey];
        if (groupData.isPublic && !isPublic) {
            const aliases = groupData.options.map(option => option.key);
            const privateGroups = { ...groups, [oldKey]: { ...groupData, isPublic: false } };
            const references = findThemeTokenReferences({ factors, groups: privateGroups, values }, aliases);
            if (references.length) {
                reportDeletionReferences(references);
                return;
            }
        }
        const nextGroups = Object.fromEntries([
            ...entries.slice(0, index),
            [newKey, { ...groupData, type, isPublic }],
            ...entries.slice(index + 1)
        ]);
        const aliasCollision = findPublicGroupAliasCollision({ factors, groups: nextGroups, values }, newKey);
        if (aliasCollision) {
            setIntegrityError(`Cannot make this group public because alias "${aliasCollision}" already exists.`);
            return;
        }
        const renames = Object.fromEntries(groupData.options.map(option => [
            `${oldKey}-${option.key}`,
            `${newKey}-${option.key}`
        ]));
        setIntegrityError('');
        applyTheme(oldKey === newKey
            ? { factors, groups: nextGroups, values }
            : rewriteThemeTokenReferences({ factors, groups: nextGroups, values }, renames));

        setExpandedGroups(prev => {
            const nextExpanded = { ...prev };
            const isExpanded = nextExpanded[oldKey];
            delete nextExpanded[oldKey];
            nextExpanded[newKey] = isExpanded;
            return nextExpanded;
        });
    };


    const publicGroups = useMemo(() => {
        return Object.entries(groups).filter(([_, group]) => group.isPublic).map(([key]) => key);
    }, [groups]);

    return (
        <div className="space-y-8">
            {integrityError && (
                <p role="alert" aria-live="assertive" className="text-sm text-yellow-500">
                    {integrityError}
                </p>
            )}

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