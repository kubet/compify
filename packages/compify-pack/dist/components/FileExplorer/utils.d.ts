import type { SandpackBundlerFiles } from "@compify/sandpack-client";
export declare const fromPropsToModules: ({ autoHiddenFiles, visibleFiles, files, prefixedPath, }: {
    prefixedPath: string;
    files: SandpackBundlerFiles;
    autoHiddenFiles?: boolean;
    visibleFiles: string[];
}) => {
    directories: string[];
    modules: string[];
};
