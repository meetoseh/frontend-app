import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { setVWC } from '../lib/setVWC';
import { useSingletonEffect } from '../lib/useSingletonEffect';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

/**
 * Configured expo-av to play audio in the background
 *
 * Returns a value with callbacks that's true when the audio is configured successfully
 * and false otherwise.
 */
export const useConfigureBackgroundAudio = (): ValueWithCallbacks<boolean> => {
  const configured = useWritableValueWithCallbacks(() => false);

  useSingletonEffect(
    (onDone) => {
      let active = true;
      configure().finally(() => {
        onDone();
      });
      return () => {
        if (active) {
          active = false;
        }
      };

      async function configure() {
        if (configured.get()) {
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
        setVWC(configured, true);
      }
    },
    [configured]
  );

  return configured;
};
