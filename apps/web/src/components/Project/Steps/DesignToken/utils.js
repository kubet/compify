import { constructColorValue } from "./InputControl";

export const DELETE_CONFIGS = {
    factor: {
        title: 'Delete Factor',
        message: 'Are you sure you want to delete this factor? This action cannot be undone.',
    },
    groupItem: {
        title: 'Delete Group Item',
        message: 'Are you sure you want to delete this group item? This action cannot be undone.',
    },
    group: {
        title: 'Delete Group',
        message: 'Are you sure you want to delete this entire group? This action cannot be undone.',
    },
    value: {
        title: 'Delete Value',
        message: 'Are you sure you want to delete this value? This action cannot be undone.',
    }
};

export const hasKeysToBeReplaced = (tokens, value) => {
    if (typeof value !== 'string') return false;

    const tokenKeys = tokens.map(token => token.key);
    const regex = new RegExp(`--(?:${tokenKeys.join('|')})(?:[^\\w-]|$)`);
    const hasKeys = regex.test(value);

    return hasKeys;
}

export const isValidColor = (color) => {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
};

export const isValidColorValue = (color) => {
    const colorValue = constructColorValue(color);
    return isValidColor(colorValue) || isValidColor(color);
};
