const HARD_LIMITS = Object.freeze({
    maximumDepth: 32,
    maximumInputLength: 100_000,
    maximumResultLength: 100_000,
    maximumFinalOutputLength: 1_000_000,
    maximumSubstitutions: 10_000,
    maximumWork: 8_000_000,
    maximumFactors: 100,
    maximumGroups: 100,
    maximumOptionsPerGroup: 500,
    maximumValues: 1_000,
    maximumTokens: 5_000,
    // Includes derived canonical group-option keys; API-authored payloads are capped at 1 MiB.
    maximumAuthoredCharacters: 2_000_000,
});

const ERROR_MESSAGES = Object.freeze({
    input: 'Theme token resolution input limit exceeded',
    output: 'Theme token resolution output limit exceeded',
    finalOutput: 'Theme token resolution final output limit exceeded',
    substitutions: 'Theme token resolution substitution limit exceeded',
    work: 'Theme token resolution work limit exceeded',
    depth: 'Theme token resolution depth limit exceeded',
    arithmetic: 'Theme token arithmetic produced a non-finite result',
    collection: 'Theme token collection limit exceeded',
    shape: 'Theme token collections are malformed',
});

const isDigit = character => character >= '0' && character <= '9';
const isWordCharacter = (character) => character !== undefined && (
    isDigit(character) ||
    (character >= 'A' && character <= 'Z') ||
    (character >= 'a' && character <= 'z') ||
    character === '_'
);
const isWhitespace = character => character !== undefined && /\s/.test(character);

const assertBoundedTokens = (tokens) => {
    if (!Array.isArray(tokens) || tokens.length > HARD_LIMITS.maximumTokens) {
        throw new Error(ERROR_MESSAGES.collection);
    }
    let authoredCharacters = 0;
    for (const token of tokens) {
        if (
            !token ||
            typeof token.key !== 'string' ||
            !(
                typeof token.value === 'string' ||
                (typeof token.value === 'number' && Number.isFinite(token.value))
            )
        ) {
            throw new Error(ERROR_MESSAGES.shape);
        }
        authoredCharacters += token.key.length;
        if (typeof token.value === 'string') authoredCharacters += token.value.length;
        else authoredCharacters += String(token.value).length;
        if (authoredCharacters > HARD_LIMITS.maximumAuthoredCharacters) {
            throw new Error(ERROR_MESSAGES.collection);
        }
    }
};

const assertBoundedCollections = ({ factors, groups, values }) => {
    if (
        !Array.isArray(factors) ||
        !groups ||
        typeof groups !== 'object' ||
        Array.isArray(groups) ||
        !Array.isArray(values)
    ) {
        throw new Error(ERROR_MESSAGES.shape);
    }
    if (
        factors.length > HARD_LIMITS.maximumFactors ||
        values.length > HARD_LIMITS.maximumValues
    ) {
        throw new Error(ERROR_MESSAGES.collection);
    }

    let authoredCharacters = 0;
    const measureToken = (token, keyPrefixLength = 0) => {
        if (
            !token ||
            typeof token.key !== 'string' ||
            !(
                typeof token.value === 'string' ||
                (typeof token.value === 'number' && Number.isFinite(token.value))
            )
        ) {
            throw new Error(ERROR_MESSAGES.shape);
        }
        authoredCharacters += keyPrefixLength + token.key.length;
        authoredCharacters += typeof token.value === 'string'
            ? token.value.length
            : String(token.value).length;
        if (authoredCharacters > HARD_LIMITS.maximumAuthoredCharacters) {
            throw new Error(ERROR_MESSAGES.collection);
        }
    };

    for (const factor of factors) measureToken(factor);
    for (const value of values) measureToken(value);

    let groupCount = 0;
    let optionCount = 0;
    for (const groupKey in groups) {
        if (!Object.prototype.hasOwnProperty.call(groups, groupKey)) continue;
        groupCount++;
        authoredCharacters += groupKey.length;
        if (
            groupCount > HARD_LIMITS.maximumGroups ||
            authoredCharacters > HARD_LIMITS.maximumAuthoredCharacters
        ) {
            throw new Error(ERROR_MESSAGES.collection);
        }
        const options = groups[groupKey]?.options;
        if (!Array.isArray(options)) throw new Error(ERROR_MESSAGES.shape);
        if (options.length > HARD_LIMITS.maximumOptionsPerGroup) {
            throw new Error(ERROR_MESSAGES.collection);
        }
        optionCount += options.length;
        if (factors.length + values.length + optionCount > HARD_LIMITS.maximumTokens) {
            throw new Error(ERROR_MESSAGES.collection);
        }
        // Charge the canonical `${groupKey}-${optionKey}` before constructing it.
        for (const option of options) measureToken(option, groupKey.length + 1);
    }
};


/**
 * Create a stateful resolver. Its limits are shared by every result produced by
 * the instance, which is why a whole theme compilation must use one instance.
 */
export const createThemeTokenResolver = (tokens = []) => {
    assertBoundedTokens(tokens);
    const tokenMap = new Map();
    for (const token of Array.isArray(tokens) ? tokens : []) {
        if (token && !tokenMap.has(token.key)) tokenMap.set(token.key, token);
    }

    const budget = { substitutions: 0, work: 0, finalOutput: 0 };
    const chargeWork = (amount = 1) => {
        budget.work += amount;
        if (budget.work > HARD_LIMITS.maximumWork) throw new Error(ERROR_MESSAGES.work);
    };
    const chargeSubstitution = () => {
        budget.substitutions++;
        if (budget.substitutions > HARD_LIMITS.maximumSubstitutions) {
            throw new Error(ERROR_MESSAGES.substitutions);
        }
    };

    const calculate = (expression) => {
        let position = 0;
        let hasPercent = false;
        const skipWhitespace = () => {
            while (isWhitespace(expression[position])) { position++; chargeWork(); }
        };
        const parsePrimary = (depth) => {
            if (depth > 100) return null;
            skipWhitespace();
            if (expression[position] === '(') {
                position++; chargeWork();
                const value = parseExpression(depth + 1);
                skipWhitespace();
                if (value === null || expression[position] !== ')') return null;
                position++; chargeWork();
                return value;
            }
            if (expression.startsWith('--', position)) {
                let end = position + 2;
                if (!isWordCharacter(expression[end])) return null;
                while (isWordCharacter(expression[end])) { end++; chargeWork(); }
                while (expression[end] === '-' && isWordCharacter(expression[end + 1])) {
                    end++; chargeWork();
                    while (isWordCharacter(expression[end])) { end++; chargeWork(); }
                }
                const token = tokenMap.get(expression.slice(position + 2, end));
                if (!token) return null;
                const value = Number.parseFloat(token.value);
                if (!Number.isFinite(value)) return null;
                if (String(token.value).trim().endsWith('%')) hasPercent = true;
                position = end;
                return value;
            }
            const start = position;
            let digits = 0;
            while (isDigit(expression[position])) { position++; digits++; chargeWork(); }
            if (expression[position] === '.') {
                position++; chargeWork();
                while (isDigit(expression[position])) { position++; digits++; chargeWork(); }
            }
            if (!digits) return null;
            const value = Number(expression.slice(start, position));
            if (!Number.isFinite(value)) return null;
            if (expression[position] === '%') { hasPercent = true; position++; chargeWork(); }
            return value;
        };
        const parseFactor = (depth) => {
            if (depth > 100) return null;
            skipWhitespace();
            if ('+-'.includes(expression[position]) && !expression.startsWith('--', position)) {
                const sign = expression[position++]; chargeWork();
                const value = parseFactor(depth + 1);
                return value === null ? null : sign === '-' ? -value : value;
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
                position++; chargeWork();
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
                position++; chargeWork();
                const right = parseTerm(depth);
                if (right === null) return null;
                value = operator === '+' ? value + right : value - right;
                if (!Number.isFinite(value)) return null;
            }
        };
        const result = parseExpression();
        skipWhitespace();
        return result === null || position !== expression.length || !Number.isFinite(result)
            ? null
            : `${result}${hasPercent ? '%' : ''}`;
    };

    const buildParts = () => {
        const parts = [];
        let length = 0;
        return {
            append(part) {
                const string = String(part);
                if (length + string.length > HARD_LIMITS.maximumResultLength) {
                    throw new Error(ERROR_MESSAGES.output);
                }
                parts.push(string);
                length += string.length;
            },
            finish: () => parts.join(''),
        };
    };
    const cycleMessage = (stack, key) => {
        const path = [...stack, key];
        const boundedPath = path.slice(-10).map(item => item.length > 64 ? `${item.slice(0, 61)}...` : item);
        const prefix = path.length > boundedPath.length ? '... -> ' : '';
        return `Theme token cycle detected: ${prefix}${boundedPath.join(' -> ')}`;
    };
    const enterToken = (token, stack) => {
        if (stack.includes(token.key)) {
            throw new Error(cycleMessage(stack, token.key));
        }
        if (stack.length >= HARD_LIMITS.maximumDepth) throw new Error(ERROR_MESSAGES.depth);
        chargeSubstitution();
        return [...stack, token.key];
    };

    let resolvePass;
    let resolveMetaPhase;

    resolveMetaPhase = (input, stack) => {
        if (input.length > HARD_LIMITS.maximumInputLength) throw new Error(ERROR_MESSAGES.input);
        const output = buildParts();
        let cursor = 0;
        while (cursor < input.length) {
            chargeWork();
            if (input.startsWith('${', cursor)) {
                const close = input.indexOf('}', cursor + 2);
                if (close !== -1) {
                    chargeWork(close - cursor);
                    let key = input.slice(cursor + 2, close);
                    if (key.startsWith('--')) key = key.slice(2);
                    const token = tokenMap.get(key);
                    let end = close + 1;
                    if (input[end] === '-' && isDigit(input[end + 1])) {
                        end += 2;
                        while (isDigit(input[end])) { end++; chargeWork(); }
                    }
                    if (token) {
                        const nextStack = enterToken(token, stack);
                        let value = String(token.value);
                        if (value.includes('${')) value = resolveMetaPhase(value, nextStack);
                        if (value.includes('--')) value = resolvePass(value, nextStack);
                        output.append(value);
                        output.append(input.slice(close + 1, end));
                        cursor = end;
                        continue;
                    }
                } else {
                    // indexOf inspected the remaining input even though it found no close.
                    chargeWork(input.length - cursor - 2);
                }
            }
            output.append(input[cursor]);
            cursor++;
        }
        return output.finish();
    };

    const checkMetaReferenceToActiveToken = (input, stack) => {
        // Direct substitutions intentionally leave meta-only values unresolved, but
        // an edge back to the active chain is still a real mixed-form cycle.
        let cursor = 0;
        while ((cursor = input.indexOf('${', cursor)) !== -1) {
            const close = input.indexOf('}', cursor + 2);
            if (close === -1) return;
            chargeWork(close - cursor);
            let key = input.slice(cursor + 2, close);
            if (key.startsWith('--')) key = key.slice(2);
            if (tokenMap.has(key) && stack.includes(key)) {
                throw new Error(cycleMessage(stack, key));
            }
            cursor = close + 1;
        }
    };

    const resolveDirectPhase = (input, stack) => {
        if (input.length > HARD_LIMITS.maximumInputLength) throw new Error(ERROR_MESSAGES.input);
        const output = buildParts();
        let cursor = 0;
        while (cursor < input.length) {
            chargeWork();
            if (input.startsWith('calc(', cursor)) {
                let depth = 1;
                let end = cursor + 5;
                for (; end < input.length && depth; end++) {
                    chargeWork();
                    if (input[end] === '(') depth++;
                    else if (input[end] === ')') depth--;
                }
                if (!depth) {
                    const calculated = calculate(input.slice(cursor + 5, end - 1));
                    output.append(calculated === null ? input.slice(cursor, end) : calculated);
                    cursor = end;
                    continue;
                }
                output.append(input.slice(cursor));
                cursor = input.length;
                continue;
            }

            if (input.startsWith('--', cursor) && isWordCharacter(input[cursor + 2])) {
                let end = cursor + 2;
                while (isWordCharacter(input[end])) { end++; chargeWork(); }
                while (input[end] === '-' && isWordCharacter(input[end + 1])) {
                    end++; chargeWork();
                    while (isWordCharacter(input[end])) { end++; chargeWork(); }
                }
                const fullKey = input.slice(cursor + 2, end);
                let token = tokenMap.get(fullKey);
                let suffix = '';
                if (!token) {
                    const suffixStart = fullKey.lastIndexOf('-');
                    const suffixDigits = fullKey.slice(suffixStart + 1);
                    if (suffixStart > 0 && suffixDigits && [...suffixDigits].every(isDigit)) {
                        token = tokenMap.get(fullKey.slice(0, suffixStart));
                        if (token) suffix = fullKey.slice(suffixStart);
                    }
                }
                if (token) {
                    let arithmeticEnd = end;
                    let operator;
                    let factor;
                    let position = end;
                    while (isWhitespace(input[position])) { position++; chargeWork(); }
                    if ('*/+-'.includes(input[position])) {
                        const candidate = input[position++]; chargeWork();
                        while (isWhitespace(input[position])) { position++; chargeWork(); }
                        const numberStart = position;
                        while (isDigit(input[position])) { position++; chargeWork(); }
                        if (input[position] === '.' && isDigit(input[position + 1])) {
                            position++; chargeWork();
                            while (isDigit(input[position])) { position++; chargeWork(); }
                        }
                        if (position > numberStart && !isWordCharacter(input[position])) {
                            operator = candidate;
                            factor = Number.parseFloat(input.slice(numberStart, position));
                            arithmeticEnd = position;
                        }
                    }
                    const nextStack = enterToken(token, stack);
                    let value = token.value;
                    if (typeof value === 'string') {
                        if (!value.includes('--')) checkMetaReferenceToActiveToken(value, nextStack);
                        else value = resolvePass(value, nextStack);
                    }
                    if (operator) {
                        value = Number.parseFloat(value);
                        if (operator === '*') value *= factor;
                        else if (operator === '/') value /= factor;
                        else if (operator === '+') value += factor;
                        else value -= factor;
                        if (!Number.isFinite(value)) throw new Error(ERROR_MESSAGES.arithmetic);
                    }
                    output.append(`${value}${suffix}`);
                    cursor = arithmeticEnd;
                    continue;
                }
            }
            output.append(input[cursor]);
            cursor++;
        }
        return output.finish();
    };

    resolvePass = (input, stack) => resolveDirectPhase(resolveMetaPhase(input, stack), stack);

    const commitFinalOutput = (value) => {
        const outputLength = typeof value === 'string'
            ? value.length
            : typeof value === 'number' && Number.isFinite(value)
                ? String(value).length
                : 0;
        if (budget.finalOutput + outputLength > HARD_LIMITS.maximumFinalOutputLength) {
            throw new Error(ERROR_MESSAGES.finalOutput);
        }
        budget.finalOutput += outputLength;
        return value;
    };
    const resolve = (value) => commitFinalOutput(
        typeof value === 'string' ? resolvePass(value, []) : value
    );
    resolve.compile = (value) => {
        if (typeof value !== 'string') return value;
        const firstPass = resolvePass(value, []);
        const finalResult = firstPass.includes('--')
            ? resolvePass(firstPass, [])
            : firstPass;
        return commitFinalOutput(finalResult);
    };
    return resolve;
};

export const compileThemeCollections = ({ factors = [], groups = {}, values = [] } = {}) => {
    assertBoundedCollections({ factors, groups, values });
    const factorTokens = factors.map(factor => ({ key: factor.key, value: factor.value, c: factor.c }));
    const groupTokens = Object.entries(groups).flatMap(([groupKey, group]) =>
        (group?.options || []).map(item => ({ key: `${groupKey}-${item.key}`, value: item.value, c: item.c }))
    );
    const resolver = createThemeTokenResolver([...factorTokens, ...groupTokens, ...values]);
    const compileValue = value => resolver.compile(value);
    const compiledFactors = factors.map(factor => ({ ...factor, c: compileValue(factor.value) }));
    const compiledGroups = Object.fromEntries(Object.entries(groups).map(([key, group]) => [
        key,
        { ...group, options: (group?.options || []).map(item => ({ ...item, c: compileValue(item.value) })) },
    ]));
    const compiledValues = values.map(value => ({ ...value, c: compileValue(value.value) }));
    return { factors: compiledFactors, groups: compiledGroups, values: compiledValues };
};

const keyReplace = (tokens, text) => createThemeTokenResolver(tokens)(text?.toString());
export default keyReplace;
