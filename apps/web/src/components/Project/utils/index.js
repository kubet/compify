const keyReplace = (tokens, text) => {
    const maximumTokenResolutionDepth = 32;
    const calc = (expression) => {
        let position = 0;
        let hasPercent = false;
        const maximumDepth = 100;
        const isWhitespace = character => character !== undefined && /\s/.test(character);
        const skipWhitespace = () => {
            while (isWhitespace(expression[position])) position++;
        };

        const parsePrimary = (depth) => {
            if (depth > maximumDepth) return null;
            skipWhitespace();

            if (expression[position] === '(') {
                position++;
                const value = parseExpression(depth + 1);
                skipWhitespace();
                if (value === null || expression[position] !== ')') return null;
                position++;
                return value;
            }

            if (expression.startsWith('--', position)) {
                let end = position + 2;
                if (!isWordCharacter(expression[end])) return null;
                while (isWordCharacter(expression[end])) end++;
                while (expression[end] === '-' && isWordCharacter(expression[end + 1])) {
                    end++;
                    while (isWordCharacter(expression[end])) end++;
                }

                const key = expression.slice(position + 2, end);
                const token = tokens.find(candidate => candidate.key === key);
                if (!token) return null;
                const value = Number.parseFloat(token.value);
                if (!Number.isFinite(value)) return null;
                if (String(token.value).trim().endsWith('%')) hasPercent = true;
                position = end;
                return value;
            }

            const numberStart = position;
            let digits = 0;
            while (isDigit(expression[position])) {
                position++;
                digits++;
            }
            if (expression[position] === '.') {
                position++;
                while (isDigit(expression[position])) {
                    position++;
                    digits++;
                }
            }
            if (digits === 0) return null;

            const value = Number(expression.slice(numberStart, position));
            if (!Number.isFinite(value)) return null;
            if (expression[position] === '%') {
                hasPercent = true;
                position++;
            }
            return value;
        };

        const parseFactor = (depth) => {
            if (depth > maximumDepth) return null;
            skipWhitespace();
            if ((expression[position] === '+' || expression[position] === '-') &&
                !expression.startsWith('--', position)) {
                const sign = expression[position++];
                const value = parseFactor(depth + 1);
                return value === null ? null : (sign === '-' ? -value : value);
            }
            return parsePrimary(depth);
        };

        const parseTerm = (depth) => {
            let value = parseFactor(depth);
            if (value === null) return null;
            while (true) {
                skipWhitespace();
                const operator = expression[position];
                if (operator !== '*' && operator !== '/') return value;
                position++;
                const right = parseFactor(depth);
                if (right === null) return null;
                value = operator === '*' ? value * right : value / right;
                if (!Number.isFinite(value)) return null;
            }
        };

        const parseExpression = (depth = 0) => {
            let value = parseTerm(depth);
            if (value === null) return null;
            while (true) {
                skipWhitespace();
                const operator = expression[position];
                if (operator !== '+' && operator !== '-') return value;
                position++;
                const right = parseTerm(depth);
                if (right === null) return null;
                value = operator === '+' ? value + right : value - right;
                if (!Number.isFinite(value)) return null;
            }
        };

        const result = parseExpression();
        skipWhitespace();
        if (result === null || position !== expression.length || !Number.isFinite(result)) {
            return null;
        }
        return `${result}${hasPercent ? '%' : ''}`;
    };

    const resolveMetaToken = (key, depth = 0, resolutionState) => {
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
                value = resolveMetaToken(value, depth + 1, resolutionState);
            }
            // Then resolve any direct token references
            if (value.includes('--')) {
                value = replaceTokens(value, resolutionState);
            }
            return `${value}${suffix}`;
        });
    };

    const replaceCalcExpressions = (input, resolutionState) => {
        let result = '';
        let cursor = 0;

        // Scan balanced parentheses instead of using a nested-alternation regex. Aside
        // from supporting arbitrary nesting, this makes malformed input linear-time.
        while (cursor < input.length) {
            const start = input.indexOf('calc(', cursor);
            if (start === -1) {
                result += replaceDirectTokens(input.slice(cursor), resolutionState);
                break;
            }

            let depth = 1;
            let end = start + 5;
            for (; end < input.length && depth > 0; end++) {
                if (input[end] === '(') depth++;
                else if (input[end] === ')') depth--;
            }

            if (depth !== 0) {
                result += replaceDirectTokens(input.slice(cursor, start), resolutionState);
                result += input.slice(start);
                break;
            }

            result += replaceDirectTokens(input.slice(cursor, start), resolutionState);
            const calculated = calc(input.slice(start + 5, end - 1));
            result += calculated === null ? input.slice(start, end) : calculated;
            cursor = end;
        }

        return result;
    };

    const isDigit = character => character >= '0' && character <= '9';
    const isWordCharacter = (character) => {
        if (character === undefined) return false;
        return isDigit(character) ||
            (character >= 'A' && character <= 'Z') ||
            (character >= 'a' && character <= 'z') ||
            character === '_';
    };

    const replaceDirectTokens = (input, resolutionState) => {
        let result = '';
        let cursor = 0;

        while (cursor < input.length) {
            const start = input.indexOf('--', cursor);
            if (start === -1) {
                result += input.slice(cursor);
                break;
            }

            result += input.slice(cursor, start);
            let end = start + 2;
            if (!isWordCharacter(input[end])) {
                result += '--';
                cursor = end;
                continue;
            }

            while (isWordCharacter(input[end])) end++;
            while (input[end] === '-' && isWordCharacter(input[end + 1])) {
                end++;
                while (isWordCharacter(input[end])) end++;
            }

            const fullKey = input.slice(start + 2, end);
            let token = tokens.find(candidate => candidate.key === fullKey);
            let suffix = '';

            // A numeric final segment can be a suffix when the complete key does not exist.
            if (!token) {
                const suffixStart = fullKey.lastIndexOf('-');
                const suffixDigits = fullKey.slice(suffixStart + 1);
                if (suffixStart > 0 && suffixDigits && [...suffixDigits].every(isDigit)) {
                    token = tokens.find(candidate => candidate.key === fullKey.slice(0, suffixStart));
                    if (token) suffix = fullKey.slice(suffixStart);
                }
            }

            if (!token) {
                result += input.slice(start, end);
                cursor = end;
                continue;
            }

            let operator;
            let factor;
            let arithmeticEnd = end;
            let position = end;
            while (/\s/.test(input[position] || '')) position++;
            if ('*/+-'.includes(input[position])) {
                const candidateOperator = input[position++];
                while (/\s/.test(input[position] || '')) position++;
                const numberStart = position;
                while (isDigit(input[position])) position++;
                if (input[position] === '.' && isDigit(input[position + 1])) {
                    position++;
                    while (isDigit(input[position])) position++;
                }
                if (position > numberStart && !isWordCharacter(input[position])) {
                    operator = candidateOperator;
                    factor = parseFloat(input.slice(numberStart, position));
                    arithmeticEnd = position;
                }
            }

            let value = token.value;
            if (typeof value === 'string' && value.includes('--')) {
                if (resolutionState.depth >= maximumTokenResolutionDepth ||
                    resolutionState.resolving.has(token.key)) {
                    result += input.slice(start, arithmeticEnd);
                    cursor = arithmeticEnd;
                    continue;
                }

                const resolving = new Set(resolutionState.resolving);
                resolving.add(token.key);
                value = replaceTokens(value, {
                    depth: resolutionState.depth + 1,
                    resolving,
                });
            }

            if (operator) {
                value = parseFloat(value);
                switch (operator) {
                    case '*': value *= factor; break;
                    case '/': value /= factor; break;
                    case '+': value += factor; break;
                    case '-': value -= factor; break;
                }
            }

            result += value.toString() + suffix;
            cursor = arithmeticEnd;
        }

        return result;
    };

    const replaceTokens = (input, resolutionState = { depth: 0, resolving: new Set() }) => {
        if (typeof input !== 'string') {
            return input;
        }

        const resolvedInput = resolveMetaToken(input, 0, resolutionState);
        return replaceCalcExpressions(resolvedInput, resolutionState);
    };
    return replaceTokens(text?.toString());
};
export default keyReplace;