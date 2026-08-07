import * as React from "react";
type DevToolsTheme = "dark" | "light" | "auto";
export declare const SandpackReactDevTools: ({ clientId, theme, className, ...props }: {
    clientId?: string;
    theme?: DevToolsTheme;
} & React.HTMLAttributes<HTMLDivElement>) => JSX.Element | null;
export {};
