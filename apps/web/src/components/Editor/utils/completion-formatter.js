/**
 * CompletionFormatter class for handling code completions in Monaco Editor
 */
class CompletionFormatter {
    /**
     * Initialize the completion formatter
     * @param {any} editor - Monaco editor model instance
     * @param {any} position - Current cursor position
     * @param {any} monaco - Monaco editor instance
     */
    constructor(editor, position, monaco) {
        if (!monaco) {
            throw new Error('Monaco instance is required for CompletionFormatter');
        }

        this._characterAfterCursor = "";
        this._completion = "";
        this._normalisedCompletion = "";
        this._originalCompletion = "";
        this._textAfterCursor = "";
        this._lineText = "";
        this._characterBeforeCursor = "";
        this._editor = editor;
        this._cursorPosition = position;
        this._monaco = monaco;
        this._lineCount = 0;

        try {
            const lineEndPosition = editor.getFullModelRange()?.getEndPosition();

            // Only create Range if we have valid positions
            if (lineEndPosition) {
                const textAfterRange = new this._monaco.Range(
                    this._cursorPosition.lineNumber,
                    this._cursorPosition.column,
                    lineEndPosition.lineNumber,
                    lineEndPosition.column
                );
                this._textAfterCursor = editor.getValueInRange(textAfterRange);
            }

            this._lineText = editor.getLineContent(this._cursorPosition.lineNumber);
            this._characterBeforeCursor = this._lineText[this._cursorPosition.column - 2] ?? "";
            this._characterAfterCursor = this._lineText[this._cursorPosition.column] ?? "";
            this._lineCount = editor.getLineCount();
        } catch (error) {
            console.error('Error initializing CompletionFormatter:', error);
            throw error;
        }
    }

    static OPENING_BRACKETS = ["(", "[", "{"];
    static CLOSING_BRACKETS = [")", "]", "}"];
    static QUOTES = ['"', "'", "`"];
    static ALL_BRACKETS = [...CompletionFormatter.OPENING_BRACKETS, ...CompletionFormatter.CLOSING_BRACKETS];

    /**
     * Check if opening and closing brackets match
     * @param {string} open - Opening bracket
     * @param {string} close - Closing bracket
     * @returns {boolean}
     */
    isMatchingPair(open, close) {
        return (
            (open === "(" && close === ")") ||
            (open === "[" && close === "]") ||
            (open === "{" && close === "}")
        );
    }

    /**
     * Match and balance brackets in completion
     * @returns {CompletionFormatter}
     */
    matchCompletionBrackets() {
        let accumulatedCompletion = "";
        const openBrackets = [];

        for (const character of this._originalCompletion) {
            if (CompletionFormatter.OPENING_BRACKETS.includes(character)) {
                openBrackets.push(character);
            }

            if (CompletionFormatter.CLOSING_BRACKETS.includes(character)) {
                if (
                    openBrackets.length &&
                    this.isMatchingPair(openBrackets[openBrackets.length - 1], character)
                ) {
                    openBrackets.pop();
                } else {
                    break;
                }
            }
            accumulatedCompletion += character;
        }

        this._completion = accumulatedCompletion.trimEnd() || this._originalCompletion.trimEnd();
        return this;
    }

    /**
     * Handle blank lines in completion
     * @returns {CompletionFormatter}
     */
    ignoreBlankLines() {
        if (this._completion.trimStart() === "" && this._originalCompletion !== "\n") {
            this._completion = this._completion.trim();
        }
        return this;
    }

    /**
     * Normalize text by trimming whitespace
     * @param {string} text - Text to normalize
     * @returns {string}
     */
    normalise(text) {
        return text?.trim();
    }

    /**
     * Remove duplicate text from the start of suggestions
     * @returns {CompletionFormatter}
     */
    removeDuplicateStartOfSuggestions() {
        const before = this._editor
            .getValueInRange(
                new this._monaco.Range(
                    1,
                    1,
                    this._cursorPosition.lineNumber,
                    this._cursorPosition.column
                )
            )
            .trim();

        const completion = this.normalise(this._completion);
        const maxLength = Math.min(completion.length, before.length);
        let overlapLength = 0;

        for (let length = 1; length <= maxLength; length++) {
            const endOfBefore = before.substring(before.length - length);
            const startOfCompletion = completion.substring(0, length);
            if (endOfBefore === startOfCompletion) {
                overlapLength = length;
            }
        }

        if (overlapLength > 0) {
            this._completion = this._completion.substring(overlapLength);
        }

        return this;
    }

    /**
     * Check if cursor is in middle of a word
     * @returns {boolean}
     */
    isCursorAtMiddleOfWord() {
        return (
            this._characterBeforeCursor &&
            /\w/.test(this._characterBeforeCursor) &&
            /\w/.test(this._characterAfterCursor)
        );
    }

    /**
     * Remove unnecessary quotes in completion
     * @returns {CompletionFormatter}
     */
    removeUnnecessaryMiddleQuote() {
        const startsWithQuote = CompletionFormatter.QUOTES.includes(this._completion[0] ?? "");
        const endsWithQuote = CompletionFormatter.QUOTES.includes(
            this._completion[this._completion.length - 1] ?? ""
        );

        if (startsWithQuote && endsWithQuote) {
            this._completion = this._completion.substring(1);
        }

        if (endsWithQuote && this.isCursorAtMiddleOfWord()) {
            this._completion = this._completion.slice(0, -1);
        }

        return this;
    }

    /**
     * Prevent duplicate lines in completion
     * @returns {CompletionFormatter}
     */
    preventDuplicateLines() {
        let nextLineIndex = this._cursorPosition.lineNumber + 1;
        while (
            nextLineIndex < this._cursorPosition.lineNumber + 3 &&
            nextLineIndex < this._lineCount
        ) {
            const line = this._editor.getLineContent(nextLineIndex);
            if (this.normalise(line) === this.normalise(this._originalCompletion)) {
                this._completion = "";
                return this;
            }
            nextLineIndex++;
        }
        return this;
    }

    /**
     * Remove invalid line breaks from completion
     * @returns {CompletionFormatter}
     */
    removeInvalidLineBreaks() {
        if (this._completion.endsWith("\n")) {
            this._completion = this._completion.trimEnd();
        }
        return this;
    }

    /**
     * Count number of new lines in completion
     * @returns {string[]}
     */
    newLineCount() {
        return this._completion.match(/\n/g) || [];
    }

    /**
     * Get the column count of the last line
     * @returns {number}
     */
    getLastLineColumnCount() {
        const lines = this._completion.split("\n");
        return lines[lines.length - 1].length;
    }

    /**
     * Trim the start of completion
     * @returns {CompletionFormatter}
     */
    trimStart() {
        const firstNonSpaceIndex = this._completion.search(/\S/);

        if (firstNonSpaceIndex > this._cursorPosition.column - 1) {
            this._completion = this._completion.substring(firstNonSpaceIndex);
        }

        return this;
    }

    /**
     * Strip markdown and suggestion text from completion
     * @returns {CompletionFormatter}
     */
    stripMarkdownAndSuggestionText() {
        this._completion = this._completion.replace(/```.*\n/g, "");
        this._completion = this._completion.replace(/```/g, "");
        this._completion = this._completion.replace(/`/g, "");
        this._completion = this._completion.replace(/# ?Suggestions?: ?/g, "");

        return this;
    }

    /**
     * Check if there's no text before or after cursor
     * @returns {boolean}
     */
    getNoTextBeforeOrAfter() {
        const textAfter = this._textAfterCursor;
        const textBeforeRange = new this._monaco.Range(
            0,
            0,
            this._cursorPosition.lineNumber,
            this._cursorPosition.column
        );

        const textBefore = this._editor.getValueInRange(textBeforeRange);
        return !textAfter || !textBefore;
    }

    /**
     * Handle context-specific completion behavior
     * @returns {CompletionFormatter}
     */
    ignoreContextCompletionAtStartOrEnd() {
        const isNoTextBeforeOrAfter = this.getNoTextBeforeOrAfter();

        const contextMatch = this._normalisedCompletion.match(
            /\/\*\s*Language:\s*(.*)\s*\*\//
        );

        const extensionContext = this._normalisedCompletion.match(
            /\/\*\s*File extension:\s*(.*)\s*\*\//
        );

        const commentMatch = this._normalisedCompletion.match(/\/\*\s*\*\//);

        if (
            isNoTextBeforeOrAfter &&
            (contextMatch || extensionContext || commentMatch)
        ) {
            this._completion = "";
        }

        return this;
    }

    /**
     * Format the completion with proper range
     * @param {object} range - Range object with start and end positions
     * @returns {object} Formatted completion with range
     */
    formatCompletion(range) {
        const newLineCount = this.newLineCount();
        const getLastLineLength = this.getLastLineColumnCount();
        return {
            insertText: this._completion,
            range: {
                startLineNumber: this._cursorPosition.lineNumber,
                startColumn: this._cursorPosition.column,
                endLineNumber: this._cursorPosition.lineNumber + newLineCount.length,
                endColumn:
                    this._cursorPosition.lineNumber === range.startLineNumber &&
                        newLineCount.length === 0
                        ? this._cursorPosition.column + getLastLineLength
                        : getLastLineLength,
            },
        };
    }

    /**
     * Format the completion text
     * @param {string} insertText - Text to be inserted
     * @param {object} range - Range where the text should be inserted
     * @returns {object} Formatted completion
     */
    format(insertText, range) {
        this._completion = "";
        this._normalisedCompletion = this.normalise(insertText);
        this._originalCompletion = insertText;

        return this.matchCompletionBrackets()
            .ignoreBlankLines()
            .removeDuplicateStartOfSuggestions()
            .removeUnnecessaryMiddleQuote()
            .preventDuplicateLines()
            .removeInvalidLineBreaks()
            .trimStart()
            .stripMarkdownAndSuggestionText()
            .ignoreContextCompletionAtStartOrEnd()
            .formatCompletion(range);
    }
}

export { CompletionFormatter };