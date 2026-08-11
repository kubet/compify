import type { SandpackBundlerFiles } from '@compify/sandpack-client';
export declare const useSandpackId: () => string;
export declare const useAsyncSandpackId: (files: SandpackBundlerFiles) => (() => Promise<string>) | (() => string);
