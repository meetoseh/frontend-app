import { AVPlaybackStatus } from 'expo-av';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { OsehTranscriptPhrase } from '../transcripts/OsehTranscript';
import { UseCurrentTranscriptPhrasesResult } from '../transcripts/useCurrentTranscriptPhrases';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { useMemo } from 'react';

export type MediaInfo = {
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
  /** The video progress, which is the current time over the total time in seconds, or 0 if duration is not loaded */
  progress: ValueWithCallbacks<number>;
  /** The combination of loaded and playing as a string enum, usually for the play button */
  playPauseState: ValueWithCallbacks<
    'playing' | 'paused' | 'errored' | 'loading'
  >;
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
  /** native only: if we want the video to be playing (as opposed to paused) */
  shouldPlay: WritableValueWithCallbacks<boolean>;
  /** native only: if we want the video to be muted (as opposed to unmuted) */
  shouldBeMuted: WritableValueWithCallbacks<boolean>;
  /**
   * native only: set by the MediaInfoVideo component; if the first frame
   * has been extracted. always true for audio
   */
  readyForDisplay: WritableValueWithCallbacks<boolean>;
  /** native only: can be called to seek to the given time in seconds */
  seekTo: WritableValueWithCallbacks<((seconds: number) => void) | null>;
};

/**
 * Convenience hook for extracting all the common information about media
 * into the most consumable form.
 *
 * This will handle setting the current time for the current transcript
 * phrases.
 *
 * On native, since there isn't an equivalent to HTMLMediaElement, the
 * caller must write to the returned playbackStatus whenever the playback
 * status changes. The most convenient way to do this is to use either
 * the MediaInfoAudio component or the MediaInfoVideo component.
 */
export const useMediaInfo = ({
  currentTranscriptPhrasesVWC,
  autoplay,
  durationSeconds,
}: {
  currentTranscriptPhrasesVWC: ValueWithCallbacks<UseCurrentTranscriptPhrasesResult>;
  /**
   * Only for native; if true, will autoplay once the video is ready. This value is
   * only considered when this hook is first mounted.
   */
  autoplay?: boolean;
  /**
   * If the duration of the media is known out of band, it can be provided
   * and will be used when the medias metadata is not available.
   */
  durationSeconds?: number;
}): MediaInfo => {
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
  const videoErroredVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (v) => v !== null && !v.isLoaded && v.error !== undefined
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
      const seconds =
        !status?.isLoaded || status.durationMillis === undefined
          ? durationSeconds
          : status.durationMillis / 1000;
      if (seconds === undefined) {
        return { formatted: '?:??' };
      }
      return {
        seconds: seconds,
        formatted: formatSeconds(seconds),
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
    [videoErroredVWC, videoLoadedVWC, videoPlayingVWC],
    (): 'loading' | 'playing' | 'paused' | 'errored' => {
      if (videoPlayingVWC.get()) {
        return 'playing';
      }
      if (videoErroredVWC.get()) {
        return 'errored';
      }
      if (!videoLoadedVWC.get()) {
        return 'loading';
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

  const progressVWC = useMappedValuesWithCallbacks(
    [videoCurrentTimeVWC, videoTotalTimeVWC],
    () => {
      const currentTime = videoCurrentTimeVWC.get();
      const totalTime = videoTotalTimeVWC.get();
      if (totalTime.seconds === undefined || totalTime.seconds <= 0) {
        return 0;
      }
      return currentTime / totalTime.seconds;
    }
  );

  const seekToVWC = useWritableValueWithCallbacks<
    ((seconds: number) => void) | null
  >(() => null);

  return useMemo(
    (): MediaInfo => ({
      playbackStatus: playbackStatusVWC,
      loaded: videoLoadedVWC,
      playing: videoPlayingVWC,
      paused: videoPausedVWC,
      muted: videoMutedVWC,
      currentTime: videoCurrentTimeVWC,
      progress: progressVWC,
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
      seekTo: seekToVWC,
    }),
    [
      playbackStatusVWC,
      videoLoadedVWC,
      videoPlayingVWC,
      videoPausedVWC,
      videoMutedVWC,
      videoCurrentTimeVWC,
      progressVWC,
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
      seekToVWC,
    ]
  );
};

const formatSeconds = (durationSeconds: number) => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);

  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};
