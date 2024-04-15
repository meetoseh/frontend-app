import { ReactElement } from 'react';
import { ValueWithCallbacks } from '../lib/Callbacks';
import { OsehAudioContentState } from './OsehAudioContentState';
import { MediaInfo } from './useMediaInfo';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { AVPlaybackStatus } from 'expo-av';
import { setVWC } from '../lib/setVWC';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';

export type MediaInfoAudioProps = {
  mediaInfo: MediaInfo;
  audio: ValueWithCallbacks<OsehAudioContentState>;
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
  useValueWithCallbacksEffect(audio, (aud) => {
    if (!aud.loaded || aud.audio === null || aud.audio.sound === null) {
      return;
    }

    setVWC(mediaInfo.readyForDisplay, true);
    const sound = aud.audio.sound;
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    sound.getStatusAsync();
    setVWC(mediaInfo.seekTo, (seconds) =>
      sound.setPositionAsync(seconds * 1000)
    );
    return () => {
      sound.setOnPlaybackStatusUpdate(null);
      setVWC(mediaInfo.seekTo, null);
      setVWC(mediaInfo.playbackStatus, null);
    };

    function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
      setVWC(mediaInfo.playbackStatus, status, () => false);
    }
  });

  useValuesWithCallbacksEffect([audio, mediaInfo.shouldPlay], () => {
    const sound = audio.get().audio?.sound;
    if (sound === null || sound === undefined) {
      return undefined;
    }

    const shouldPlay = mediaInfo.shouldPlay.get();
    const isPlaying = mediaInfo.playing.get();

    if (shouldPlay === isPlaying) {
      return;
    }

    if (shouldPlay) {
      sound.playAsync();
    } else {
      sound.pauseAsync();
    }
    return undefined;
  });

  useValuesWithCallbacksEffect([audio, mediaInfo.shouldBeMuted], () => {
    const sound = audio.get().audio?.sound;
    if (sound === null || sound === undefined) {
      return undefined;
    }

    const isMuted = mediaInfo.muted.get();
    const shouldBeMuted = mediaInfo.shouldBeMuted.get();

    if (isMuted === shouldBeMuted) {
      return;
    }

    sound.setIsMutedAsync(shouldBeMuted);
  });

  return <></>;
};
