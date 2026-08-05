export declare const useSandpackShellStdout: ({ clientId, maxMessageCount, resetOnPreviewRestart, }: {
    clientId?: string;
    maxMessageCount?: number;
    resetOnPreviewRestart?: boolean;
}) => {
    logs: Array<{
        id: string;
        data: string;
    }>;
    reset: () => void;
};
