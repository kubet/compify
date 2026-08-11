// Modified by Compify; see packages/compify-pack/PROVENANCE.md.
import * as React from "react";

import { useSandpack } from "./useSandpack";

export const useSandpackPreviewProgress = (
  props:
    | {
        timeout?: number;
        clientId?: string;
      }
    | undefined
) => {
  const [isReady, setIsReady] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState<null | string>(
    null
  );

  const timeout = props?.timeout;
  const clientId = props?.clientId;

  const { listen } = useSandpack();

  React.useEffect(() => {
    let timer: NodeJS.Timer;
    const unsubscribe = listen((message) => {
      if (message.type === "start" && message.firstLoad) {
        setIsReady(false);
      }

      if (timeout) {
        timer = setTimeout(() => {
          setLoadingMessage(null);
        }, timeout);
      }

      if (message.type === "dependencies") {
        setLoadingMessage(() => {
          switch (message.data.state) {
            case "downloading_manifest":
              return "[1/3] Downloading manifest";

            case "downloaded_module":
              return `[2/3] Downloaded ${message.data.name} (${message.data.progress}/${message.data.total})`;

            case "starting":
              return "[3/3] Starting";
          }

          return null;
        });
      }

      if (message.type === "done" && message.compilatonError === false) {
        setLoadingMessage(null);
        setIsReady(true);
        clearTimeout(timer);
      }
    }, clientId);

    return (): void => {
      if (timer) {
        clearTimeout(timer);
      }
      unsubscribe();
    };
  }, [clientId, isReady, timeout]);

  return loadingMessage;
};
