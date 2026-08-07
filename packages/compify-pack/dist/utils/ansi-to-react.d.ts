/**
 * Stole from https://github.com/nteract/ansi-to-react/blob/master/src/index.ts
 */
declare interface Props {
    children?: string;
    linkify?: boolean;
    className?: string;
    useClasses?: boolean;
}
export default function Ansi(props: Props): JSX.Element;
export {};
