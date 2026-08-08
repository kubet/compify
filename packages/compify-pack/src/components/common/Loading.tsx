// Modified by Compify; see packages/compify-pack/PROVENANCE.md.
import * as React from "react";
import { css } from "../../styles";
import { useClassNames } from "../../utils/classNames";


const loadingBackgroundClassName = css({
  backgroundColor: "#0a0a0a",
});

export const Loading = ({
  className,
  showOpenInCodeSandbox,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  showOpenInCodeSandbox: boolean;
}): JSX.Element => {
  const classNames = useClassNames();

  return (
    <div className={classNames("loading-background", [loadingBackgroundClassName])}>
    </div>
  );
};
