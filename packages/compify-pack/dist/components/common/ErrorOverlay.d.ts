import * as React from "react";
export type ErrorOverlayProps = React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
    actionChildren?: JSX.Element;
};
export declare const ErrorOverlay: React.FC<ErrorOverlayProps>;
