import { ReactElement } from 'react';
import { Callbacks, ValueWithCallbacks } from '../lib/Callbacks';
import { OldOsehAudioContentState } from './OldOsehAudioContentState';
import { MediaInfo } from './useMediaInfo';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { AVPlaybackStatus } from 'expo-av';
import { setVWC } from '../lib/setVWC';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import { OsehAudioContentState } from './createOsehAudioContentState';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';

export type MediaInfoAudioProps = {
  mediaInfo: MediaInfo;
  audio: ValueWithCallbacks<OldOsehAudioContentState | OsehAudioContentState>;
};

/**
 * Connects the given audio to the given media info. This is essentially acting
 * as a hook since there is nothing that needs to go on the DOM in native, but
 * this component allows for more consistency between audio and video media.
 */
export const MediaInfoAudio = ({
  mediaInfo,
  audio,
}: MediaInfoAudioProps): ReactElement => {
  const soundVWC = useMappedValueWithCallbacks(audio, (aud) => {
    if (aud.type === undefined) {
      if (!aud.loaded || aud.audio === null || aud.audio.sound === null) {
        return null;
      }

      const onStatusUpdateCallbacks = new Callbacks<AVPlaybackStatus>();
      aud.audio.sound.setOnPlaybackStatusUpdate((s) =>
        onStatusUpdateCallbacks.call(s)
      );

      return {
        sound: aud.audio.sound,
        onStatusUpdate: onStatusUpdateCallbacks,
      };
    }

    if (aud.type === 'loaded') {
      return { sound: aud.audio, onStatusUpdate: aud.onStatusUpdate };
    }

    return null;
  });

  useValueWithCallbacksEffect(soundVWC, (soundRaw) => {
    if (soundRaw === null) {
      return undefined;
    }
    const sound = soundRaw;
    setVWC(mediaInfo.readyForDisplay, true);
    sound.onStatusUpdate.add(onPlaybackStatusUpdate);
    sound.sound.getStatusAsync();
    setVWC(mediaInfo.seekTo, (seconds) =>
      sound.sound.setPositionAsync(seconds * 1000)
    );
    return () => {
      sound.onStatusUpdate.remove(onPlaybackStatusUpdate);
      setVWC(mediaInfo.seekTo, null);
      setVWC(mediaInfo.playbackStatus, null);
    };

    function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
      setVWC(mediaInfo.playbackStatus, status, () => false);
    }
  });

  useValuesWithCallbacksEffect([soundVWC, mediaInfo.shouldPlay], () => {
    const sound = soundVWC.get();
    if (sound === null) {
      return undefined;
    }

    const shouldPlay = mediaInfo.shouldPlay.get();
    const isPlaying = mediaInfo.playing.get();

    if (shouldPlay === isPlaying) {
      return;
    }

    if (shouldPlay) {
      sound.sound.playAsync();
    } else {
      sound.sound.pauseAsync();
    }
    return undefined;
  });

  useValuesWithCallbacksEffect([soundVWC, mediaInfo.shouldBeMuted], () => {
    const sound = soundVWC.get();
    if (sound === null || sound === undefined) {
      return undefined;
    }

    const isMuted = mediaInfo.muted.get();
    const shouldBeMuted = mediaInfo.shouldBeMuted.get();

    if (isMuted === shouldBeMuted) {
      return;
    }

    sound.sound.setIsMutedAsync(shouldBeMuted);
  });

  return <></>;
};
