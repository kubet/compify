export const getCssVariables = (tokens) => {
    const variables = tokens.map(token => `--${token.key}: ${token.c};`).join('\n');
    return `:root {\n${variables}\n}`;
}

export const getJSONConfig = (tokens) => {
    return tokens.reduce((acc, token) => {
        acc[token.key] = token.c;
        return acc;
    }, {});
}