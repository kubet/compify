const keyReplace = (tokens, text) => {
    const calc = (expression) => {
        // Replace token references, prioritizing longer (more specific) keys
        const tokenReplaced = expression.replace(/--(\w+(-\w+)*)/g, (match, key) => {
            const token = tokens.find(t => t.key === key);
            // Extract numeric value from token, removing units
            return token ? parseFloat(token.value) : match;
        });

        // Remove percentage signs for calculation, but remember their positions
        let percentPositions = [];
        const expressionWithoutPercent = tokenReplaced.replace(/(\d+(\.\d+)?)%/g, (match, number, _, index) => {
            percentPositions.push(index);
            return number;
        });

        // Safely evaluate the expression
        try {
            let result = Function(`'use strict'; return (${expressionWithoutPercent})`)();

            // Reapply percentage signs
            let resultString = result.toString();
            percentPositions.reverse().forEach(position => {
                resultString = resultString.slice(0, position) + '%' + resultString.slice(position);
            });

            return resultString;
        } catch (error) {
            console.error(`Error evaluating expression: ${tokenReplaced}`, error);
            return expression; // Return original expression if evaluation fails
        }
    };

    const resolveMetaToken = (key, depth = 0) => {
        if (depth > 10) {
            console.warn('Maximum meta-token resolution depth reached');
            return key;
        }

        return key.replace(/\${([^}]+)}(-\d+)?/g, (match, metaKey, suffix = '') => {
            const cleanMetaKey = metaKey.startsWith('--') ? metaKey.slice(2) : metaKey;
            const metaToken = tokens.find(t => t.key === cleanMetaKey);
            if (!metaToken) return match;

            let value = String(metaToken.value); // Convert value to string
            // First resolve any nested meta tokens in the value
            if (value.includes('${')) {
                value = resolveMetaToken(value, depth + 1);
            }
            // Then resolve any direct token references
            if (value.includes('--')) {
                value = replaceTokens(value);
            }
            return `${value}${suffix}`;
        });
    };

    const replaceTokens = (input) => {
        if (typeof input !== 'string') {
            return input;
        }

        const resolvedInput = resolveMetaToken(input);

        return resolvedInput.replace(/--(\w+(?:-\w+)*)(-\d+)?(?:\s*([*/+-])\s*(\d+(?:\.\d+)?))?\b|calc\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/g,
            (match, key, suffix = '', operator, factor, calcExpression) => {
                if (calcExpression) {
                    return calc(calcExpression);
                }

                let tokenKey = key;
                let token = tokens.find(t => t.key === tokenKey);

                if (!token && suffix) {
                    // Try without suffix
                    token = tokens.find(t => t.key === key);
                }

                if (!token) return match;

                let value = token.value;

                if (typeof value === 'string' && value.includes('--')) {
                    value = replaceTokens(value);
                }

                if (operator && factor) {
                    factor = parseFloat(factor);
                    value = parseFloat(value);
                    switch (operator) {
                        case '*': value *= factor; break;
                        case '/': value /= factor; break;
                        case '+': value += factor; break;
                        case '-': value -= factor; break;
                    }
                }

                return value.toString() + suffix;
            }
        );
    };
    return replaceTokens(text?.toString());
};
export default keyReplace;