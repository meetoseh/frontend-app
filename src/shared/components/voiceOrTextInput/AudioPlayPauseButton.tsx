import { useEffect } from 'react';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../lib/Callbacks';
import { setVWC } from '../../lib/setVWC';
import { RenderGuardedComponent } from '../RenderGuardedComponent';
import { Play } from '../icons/Play';
import { OsehColors } from '../../OsehColors';
import { OsehStyles } from '../../OsehStyles';
import { Pause } from '../icons/Pause';
import { Text } from 'react-native';
import { OsehAudioContentState } from '../../content/createOsehAudioContentState';
import { AVPlaybackStatus } from 'expo-av';

/**
 * Shows a play icon while the audio is paused and a pause icon while the
 * audio is playing
 */
export const AudioPlayPauseIcon = (props: { audio: OsehAudioContentState }) => {
  const playingVWC = useWritableValueWithCallbacks(() => false);

  useEffect(() => {
    if (props.audio.type !== 'loaded') {
      setVWC(playingVWC, false);
      return;
    }

    const active = createWritableValueWithCallbacks(true);
    const audio = props.audio;

    audio.onStatusUpdate.add(onStatusUpdate);
    audio.audio.getStatusAsync();

    return () => {
      audio.onStatusUpdate.remove(onStatusUpdate);
      setVWC(active, false);
    };

    function onStatusUpdate(status: AVPlaybackStatus) {
      setVWC(playingVWC, status.isLoaded && status.isPlaying);
    }
  }, [props.audio, playingVWC]);

  return (
    <RenderGuardedComponent
      props={playingVWC}
      component={(playing) =>
        !playing ? (
          <>
            <Play
              icon={{ width: 32 }}
              container={{ width: 32, height: 32 }}
              startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
              color={OsehColors.v4.primary.light}
            />
            <Text style={OsehStyles.assistive.srOnly}>Play</Text>
          </>
        ) : (
          <>
            <Pause
              icon={{ width: 15 }}
              container={{ width: 32, height: 32 }}
              startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
              color={OsehColors.v4.primary.light}
            />
            <Text style={OsehStyles.assistive.srOnly}>Pause</Text>
          </>
        )
      }
    />
  );
};
