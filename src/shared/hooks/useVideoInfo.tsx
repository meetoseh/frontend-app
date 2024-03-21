import { AVPlaybackStatus } from 'expo-av';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { OsehTranscriptPhrase } from '../transcripts/OsehTranscript';
import { UseCurrentTranscriptPhrasesResult } from '../transcripts/useCurrentTranscriptPhrases';
import { useMappedValueWithCallbacks } from './useMappedValueWithCallbacks';
import { useValueWithCallbacksEffect } from './useValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
import { useMappedValuesWithCallbacks } from './useMappedValuesWithCallbacks';
import { useMemo } from 'react';
import { OsehContentTarget } from '../content/OsehContentTarget';

export type VideoInfo = {
  /** Should be written with the current playback status */
  playbackStatus: WritableValueWithCallbacks<AVPlaybackStatus | null>;
  /** True if the video is ready to play, false otherwise */
  loaded: ValueWithCallbacks<boolean>;
  /** True if the video is currently playing, false if paused */
  playing: ValueWithCallbacks<boolean>;
  /** Inverted playing; true if currently paused, false if playing */
  paused: ValueWithCallbacks<boolean>;
  /** True if the video is software muted, false if not software muted */
  muted: ValueWithCallbacks<boolean>;
  /** The current playback time in seconds */
  currentTime: ValueWithCallbacks<number>;
  /** The combination of loaded and playing as a string enum, usually for the play button */
  playPauseState: ValueWithCallbacks<'playing' | 'paused' | 'loading'>;
  /** If the video is at the end and hasn't started again */
  ended: ValueWithCallbacks<boolean>;
  /** Closed captioning information */
  closedCaptioning: {
    /** The phrases to render */
    phrases: ValueWithCallbacks<{ phrase: OsehTranscriptPhrase; id: number }[]>;
    /** If closed captioning is actually available (vs always empty phrases) */
    available: ValueWithCallbacks<boolean>;
    /** Can be written to to enable/disable closed captioning */
    enabled: WritableValueWithCallbacks<boolean>;
    /** The combined available and enabled booleans */
    state: ValueWithCallbacks<{ enabled: boolean; available: boolean }>;
  };
  /** The total duration of the video in seconds, and formatted for display */
  totalTime: ValueWithCallbacks<{ seconds?: number; formatted: string }>;
  /** native only: if the `shouldPlay` property on the video should be set */
  shouldPlay: WritableValueWithCallbacks<boolean>;
  /** native only: if the `muted` property on the video should be set */
  shouldBeMuted: WritableValueWithCallbacks<boolean>;
  /** native only: if the first frame of the video has been extracted */
  readyForDisplay: WritableValueWithCallbacks<boolean>;
};

/**
 * Convenience hook for extracting all the common information about a video
 * into the most consumable form.
 *
 * This will handle setting the current time for the current transcript
 * phrases.
 */
export const useVideoInfo = ({
  currentTranscriptPhrasesVWC,
  autoplay,
}: {
  currentTranscriptPhrasesVWC: ValueWithCallbacks<UseCurrentTranscriptPhrasesResult>;
  /**
   * Only for native; if true, will autoplay once the video is ready. This value is
   * only considered when this hook is first mounted.
   */
  autoplay?: boolean;
}): VideoInfo => {
  const videoReadyForDisplayVWC = useWritableValueWithCallbacks(() => false);
  const playbackStatusVWC =
    useWritableValueWithCallbacks<AVPlaybackStatus | null>(() => null);
  const vidShouldPlayVWC = useWritableValueWithCallbacks(() => false);
  const vidShouldBeMutedVWC = useWritableValueWithCallbacks(() => false);

  const videoLoadedVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) =>
      status === null || !status.isLoaded
        ? false
        : status.isPlaying ||
          status.shouldPlay ||
          status.positionMillis > 0 ||
          !status.isBuffering
  );
  const videoPlayingVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) => !!status?.isLoaded && status.isPlaying
  );
  const videoPausedVWC = useMappedValueWithCallbacks(
    videoPlayingVWC,
    (v) => !v
  );
  const videoMutedVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) => !!status?.isLoaded && status.isMuted
  );
  const videoCurrentTimeVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) => (status?.isLoaded ? status.positionMillis / 1000 : 0)
  );
  const videoTotalTimeVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) => {
      if (!status?.isLoaded || status.durationMillis === undefined) {
        return { formatted: '?:??' };
      }
      const durationSeconds = status.durationMillis / 1000;
      return {
        seconds: durationSeconds,
        formatted: formatSeconds(durationSeconds),
      };
    }
  );
  const videoEndedVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) => !!status?.isLoaded && status.didJustFinish
  );
  const wantToAutoplayVWC = useWritableValueWithCallbacks(() => !!autoplay);
  useValueWithCallbacksEffect(videoLoadedVWC, (loaded) => {
    if (loaded && wantToAutoplayVWC.get()) {
      setVWC(wantToAutoplayVWC, false);
      setVWC(vidShouldPlayVWC, true);
    }
    return undefined;
  });
  const videoPlayPauseStateVWC = useMappedValuesWithCallbacks(
    [videoLoadedVWC, videoPlayingVWC],
    (): 'loading' | 'playing' | 'paused' => {
      if (!videoLoadedVWC.get()) {
        return 'loading';
      }
      if (videoPlayingVWC.get()) {
        return 'playing';
      }
      return 'paused';
    }
  );

  const closedCaptioningPhrasesVWC = useMappedValueWithCallbacks(
    currentTranscriptPhrasesVWC,
    (v) => v.phrases
  );
  const closedCaptioningAvailableVWC = useMappedValueWithCallbacks(
    currentTranscriptPhrasesVWC,
    (v) => {
      return v.type !== 'unavailable';
    }
  );
  const closedCaptioningEnabledVWC = useWritableValueWithCallbacks(() => true);

  const closedCaptioningStateVWC = useMappedValuesWithCallbacks(
    [closedCaptioningAvailableVWC, closedCaptioningEnabledVWC],
    () => ({
      available: closedCaptioningAvailableVWC.get(),
      enabled: closedCaptioningEnabledVWC.get(),
    }),
    {
      outputEqualityFn: (a, b) =>
        a.available === b.available && a.enabled === b.enabled,
    }
  );

  useValueWithCallbacksEffect(videoCurrentTimeVWC, (currentTime) => {
    setVWC(currentTranscriptPhrasesVWC.get().currentTime, currentTime);
    return undefined;
  });

  return useMemo(
    (): VideoInfo => ({
      playbackStatus: playbackStatusVWC,
      loaded: videoLoadedVWC,
      playing: videoPlayingVWC,
      paused: videoPausedVWC,
      muted: videoMutedVWC,
      currentTime: videoCurrentTimeVWC,
      playPauseState: videoPlayPauseStateVWC,
      ended: videoEndedVWC,
      closedCaptioning: {
        phrases: closedCaptioningPhrasesVWC,
        available: closedCaptioningAvailableVWC,
        enabled: closedCaptioningEnabledVWC,
        state: closedCaptioningStateVWC,
      },
      totalTime: videoTotalTimeVWC,
      shouldPlay: vidShouldPlayVWC,
      readyForDisplay: videoReadyForDisplayVWC,
      shouldBeMuted: vidShouldBeMutedVWC,
    }),
    [
      playbackStatusVWC,
      videoLoadedVWC,
      videoPlayingVWC,
      videoPausedVWC,
      videoMutedVWC,
      videoCurrentTimeVWC,
      videoPlayPauseStateVWC,
      videoEndedVWC,
      currentTranscriptPhrasesVWC,
      closedCaptioningPhrasesVWC,
      closedCaptioningAvailableVWC,
      closedCaptioningEnabledVWC,
      closedCaptioningStateVWC,
      videoTotalTimeVWC,
      vidShouldPlayVWC,
      videoReadyForDisplayVWC,
      vidShouldBeMutedVWC,
    ]
  );
};

const formatSeconds = (durationSeconds: number) => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);

  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};
