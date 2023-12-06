import { useCallback, useEffect } from "react";
import { Modals } from "../../../../../shared/contexts/ModalContext";
import {
  Callbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../../shared/lib/Callbacks";
import {
  PromptMergeResult,
  ReadableMergeMessagePipe,
  createReadPipeIfAvailable,
  createWritePipe,
} from "../lib/MergeMessagePipe";
import * as WebBrowser from "expo-web-browser";
import { URLSearchParams } from "react-native-url-polyfill";
import { MergeProvider } from "../MergeAccountState";
import { Platform } from "react-native";
import { useIsMounted } from "../../../../../shared/hooks/useIsMounted";
import { setVWC } from "../../../../../shared/lib/setVWC";
import * as Linking from "expo-linking";

export const mergeRedirectUrl = Linking.createURL("login_callback");

/**
 * Returns a function which can be used to open a secure authentication browser
 * directed at the given URL, expecting that they will be redirected back with
 * a merge token in the url fragment when completing successfully.
 *
 * This function will work even if the component is unmounted during the process,
 * which means it has to store state outside of the React component tree.
 *
 * @param modals The modals to use, if any modals are required.
 * @param onResult The callback for after the user has completed the merge process
 *   and we have a merge token or the reason the web browser was closed. Note that
 *   this may be called for a different component than the one which initially
 *   started this merge as react may rerender while the user is in the browser.
 */
export const usePromptMergeUsingModal = (
  modals: WritableValueWithCallbacks<Modals>,
  onResult: (result: PromptMergeResult) => void
): ((provider: MergeProvider, url: string) => Promise<void>) => {
  const mountedVWC = useIsMounted();
  const checkedMessagePipeVWC = useWritableValueWithCallbacks(() => false);

  useEffect(() => {
    if (checkedMessagePipeVWC.get()) {
      return;
    }

    let active = true;
    const cancelers = new Callbacks<undefined>();
    checkPipe();
    return () => {
      active = false;
      cancelers.call(undefined);
    };

    async function checkPipe() {
      if (!active) {
        return;
      }

      let reader: ReadableMergeMessagePipe | null = null;
      try {
        reader = await createReadPipeIfAvailable();
      } catch (e) {
        console.log("merge failed to create read pipe: ", e);
        setVWC(checkedMessagePipeVWC, true);
        return;
      }

      if (reader === null) {
        setVWC(checkedMessagePipeVWC, true);
        return;
      }
      try {
        const readCancelablePromise = reader.read();
        cancelers.add(() => readCancelablePromise.cancel());
        const timeoutPromise = new Promise<void>((resolve) =>
          setTimeout(resolve, 3000)
        );
        try {
          await Promise.race([timeoutPromise, readCancelablePromise.promise]);
        } finally {
          readCancelablePromise.cancel();
        }

        const read = await readCancelablePromise.promise;
        if (!active) {
          return;
        }
        onResult(read);
      } finally {
        await reader.close();
        if (active) {
          setVWC(checkedMessagePipeVWC, true);
        }
      }
    }
  }, [onResult, checkedMessagePipeVWC]);

  return useCallback(
    async (provider: MergeProvider, url: string): Promise<void> => {
      const options: WebBrowser.AuthSessionOpenOptions = {};
      if (Platform.OS === "ios" && provider === "Google") {
        options.preferEphemeralSession = true;
      }

      const pipe = await createWritePipe();
      const sendPipeMessageOrApplyImmediately = (msg: PromptMergeResult) => {
        if (mountedVWC.get()) {
          onResult(msg);
        } else {
          pipe.send(msg);
        }
      };

      try {
        const result = await WebBrowser.openAuthSessionAsync(
          url,
          mergeRedirectUrl,
          options
        );
        if (result.type === "cancel") {
          sendPipeMessageOrApplyImmediately({ type: "cancel" });
          return;
        } else if (result.type === "dismiss") {
          sendPipeMessageOrApplyImmediately({ type: "dismiss" });
          return;
        } else if (result.type !== "success") {
          sendPipeMessageOrApplyImmediately({
            type: "unknown",
            rawType: result.type,
          });
          return;
        }
        const params = new URLSearchParams(
          result.url.substring(result.url.indexOf("#") + 1)
        );
        if (params.get("auth_error") === "1") {
          const errorMessage = params.get("auth_error_message");
          sendPipeMessageOrApplyImmediately({
            type: "error",
            error: errorMessage ?? "",
          });
          return;
        }

        const mergeToken = params.get("merge_token");
        if (!mergeToken) {
          sendPipeMessageOrApplyImmediately({
            type: "error",
            error: "no merge token",
          });
          return;
        }

        sendPipeMessageOrApplyImmediately({
          type: "success",
          mergeToken,
        });
      } finally {
        setTimeout(pipe.close, 3000);
      }
    },
    [mountedVWC, onResult]
  );
};
