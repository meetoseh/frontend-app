import { useEffect } from 'react';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { Audio } from 'expo-av';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { waitForValueWithCallbacksConditionCancelable } from '../../../../../shared/lib/waitForValueWithCallbacksCondition';

type UseIsAudioRecordingSupportedResult = {
  /** pending if the value might change, final if the value is final */
  type: 'pending' | 'final';
  /** true if google auth is supported, false otherwise */
  value: boolean;
};

/**
 * Attempts to determine if audio recording support is available. Where possible
 * this uses feature detection. If we find some browsers that make feature detection
 * difficult/impossible, we will try other methods.
 */
export const useIsAudioRecordingSupported =
  (): ValueWithCallbacks<UseIsAudioRecordingSupportedResult> => {
    const result =
      useWritableValueWithCallbacks<UseIsAudioRecordingSupportedResult>(() => ({
        type: 'pending',
        value: true,
      }));

    useEffect(() => {
      const active = createWritableValueWithCallbacks(true);
      checkPermissions();
      return () => {
        setVWC(active, false);
      };

      async function checkPermissions() {
        const perm = await Audio.getPermissionsAsync();
        if (!active.get()) {
          return;
        }
        setVWC(
          result,
          {
            type: 'final',
            value: perm.status === 'granted' || perm.canAskAgain,
          } as const,
          (a, b) => a.type === b.type && a.value === b.value
        );
      }
    }, []);

    return result;
  };
