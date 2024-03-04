import { useCallback, useContext } from 'react';
import {
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from './Callbacks';
import { setVWC } from './setVWC';
import { LoginContext } from '../contexts/LoginContext';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';

export type FeatureFlag = 'series';

export type FeatureFlagState = {
  [flag in FeatureFlag]: boolean;
};

/**
 * Fetches the current feature flags, for now stored locally.
 *
 * @returns the current value of the flag: null if loading, undefined if an error occurred,
 *   true if enabled, and false if disabled.
 */
export const useFeatureFlag = (
  flag: FeatureFlag
): WritableValueWithCallbacks<boolean | null | undefined> => {
  const loginContextRaw = useContext(LoginContext);
  const result = useWritableValueWithCallbacks<boolean | null | undefined>(
    () => null
  );

  useValueWithCallbacksEffect(
    loginContextRaw.value,
    useCallback(
      (loginContextUnch) => {
        if (loginContextUnch.state !== 'logged-in') {
          setVWC(
            result,
            loginContextUnch.state === 'loading' ? null : undefined
          );
          return undefined;
        }
        const loginContext = loginContextUnch;
        const flags = loginContext.userAttributes.featureFlags;
        setVWC(result, flags.has(flag));
        return undefined;
      },
      [flag]
    )
  );

  return result;
};
