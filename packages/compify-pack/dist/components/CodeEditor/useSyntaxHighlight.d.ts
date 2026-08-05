import type { HighlightStyle, LanguageSupport } from "@codemirror/language";
export declare const useSyntaxHighlight: ({ langSupport, highlightTheme, code, }: {
    langSupport: LanguageSupport;
    highlightTheme: HighlightStyle;
    code?: string;
}) => React.ReactNode[];
