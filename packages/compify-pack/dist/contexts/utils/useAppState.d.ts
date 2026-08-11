import type { SandpackBundlerFiles } from "@compify/sandpack-client";
import type { SandpackProviderProps } from "../..";
interface SandpackAppState {
    editorState: "pristine" | "dirty";
}
type UseAppState = (props: SandpackProviderProps, files: SandpackBundlerFiles) => SandpackAppState;
export declare const useAppState: UseAppState;
export {};
