import { ReactElement, useCallback } from "react";
import { Modals, addModalWithCallbackToRemove } from "../contexts/ModalContext";
import { WritableValueWithCallbacks } from "../lib/Callbacks";
import { useValueWithCallbacksEffect } from "./useValueWithCallbacksEffect";

/**
 * When an error is set adds it to the modals. Unlike on the web it's assumed
 * the error is already wrapped in an ErrorBanner and so there's no need for
 * additional modal styling
 *
 * @param modals The modals to use to show the error
 * @param error The error to show. We clear the error if dismissed by the user.
 * @param context Used to distinguish where this error is coming from
 */
export const useErrorModal = (
  modals: WritableValueWithCallbacks<Modals>,
  errorVWC: WritableValueWithCallbacks<ReactElement | null>,
  location: string
) => {
  useValueWithCallbacksEffect(
    errorVWC,
    useCallback(
      (error) => {
        if (error === null) {
          return undefined;
        }

        return addModalWithCallbackToRemove(modals, error);
      },
      [modals, location, errorVWC]
    )
  );
};
