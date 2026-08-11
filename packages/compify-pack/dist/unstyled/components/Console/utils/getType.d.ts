import type { SandpackMessageConsoleMethods } from "@compify/sandpack-client";
export declare const getType: (message: SandpackMessageConsoleMethods) => "info" | "warning" | "error" | "clear";
export type SandpackConsoleData = Array<{
    data: Array<string | Record<string, string>> | undefined;
    id: string;
    method: SandpackMessageConsoleMethods;
}>;
