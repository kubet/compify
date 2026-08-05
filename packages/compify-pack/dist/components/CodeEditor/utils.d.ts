import type { LanguageSupport } from "@codemirror/language";
import { HighlightStyle } from "@codemirror/language";
import type { Extension, Text } from "@codemirror/state";
import * as React from "react";
import type { CustomLanguage, SandpackTheme } from "../../types";
export declare const getCodeMirrorPosition: (doc: Text, { line, column }: {
    line: number;
    column?: number;
}) => number;
export declare const getEditorTheme: () => Extension;
export declare const styleTokens: () => Record<string, string>;
export declare const getSyntaxHighlight: (theme: SandpackTheme) => HighlightStyle;
export declare const getLanguageFromFile: (filePath: string | undefined, fileType: string | undefined, additionalLanguages: CustomLanguage[]) => string;
export declare const getCodeMirrorLanguage: (extension: string, additionalLanguages: CustomLanguage[]) => LanguageSupport;
export declare const useCombinedRefs: <T>(...refs: Array<React.Ref<T>>) => React.Ref<T>;
