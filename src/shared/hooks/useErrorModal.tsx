import { useCallback } from 'react';
import { Modals, addModalWithCallbackToRemove } from '../contexts/ModalContext';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
} from '../lib/Callbacks';
import { useValueWithCallbacksEffect } from './useValueWithCallbacksEffect';
import {
  DisplayableError,
  SimpleDismissBoxError,
  SimpleDismissModalBoxError,
} from '../lib/errors';
import { OsehStyles } from '../OsehStyles';
import { View } from 'react-native';
import { RenderGuardedComponent } from '../components/RenderGuardedComponent';
import { VerticalSpacer } from '../components/VerticalSpacer';

/**
 * When an error is set adds it to the modals with some extra top padding
 *
 * @param modals The modals to use to show the error
 * @param error The error to show. We clear the error if dismissed by the user.
 */
export const useErrorModal = (
  modals: WritableValueWithCallbacks<Modals>,
  errorVWC: WritableValueWithCallbacks<DisplayableError | null>,
  { topBarHeightVWC }: { topBarHeightVWC: ValueWithCallbacks<number> }
) => {
  useValueWithCallbacksEffect(
    errorVWC,
    useCallback(
      (error) => {
        if (error === null) {
          return undefined;
        }

        return addModalWithCallbackToRemove(
          modals,
          <View style={OsehStyles.layout.column}>
            <RenderGuardedComponent
              props={topBarHeightVWC}
              component={(h) => <VerticalSpacer height={h} />}
            />
            <SimpleDismissBoxError error={errorVWC} />
          </View>
        );
      },
      [modals, errorVWC]
    )
  );
};
