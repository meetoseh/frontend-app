import { ReactElement, useEffect, useRef } from 'react';
import { styles } from './JourneyStyles';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { useWritableValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { onJourneyTaken } from '../lib/JourneyFeedbackRequestReviewStore';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { OsehImageFromStateValueWithCallbacks } from '../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { useCurrentTranscriptPhrases } from '../../../shared/transcripts/useCurrentTranscriptPhrases';
import { useReactManagedValueAsValueWithCallbacks } from '../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { useMediaInfo } from '../../../shared/content/useMediaInfo';
import { PlayerForeground } from '../../../shared/content/player/PlayerForeground';
import { MediaInfoAudio } from '../../../shared/content/MediaInfoAudio';
import { useValueWithCallbacksEffect } from '../../../shared/hooks/useValueWithCallbacksEffect';

/**
 * Takes the meta information about a journey returned from any of the endpoints
 * which start a session in the journey (e.g., start_random), then uses that to
 * connect to the "live" information (the true live events, the historical
 * events, profile pictures, and the stats endpoints) and playback the journey
 * to the user, while they are allowed to engage via the prompt and a "like"
 * button.
 */
export const Journey = ({
  journey,
  shared,
  setScreen,
  onCloseEarly,
}: JourneyScreenProps & {
  /**
   * If specified, instead of just using setScreen('feedback') for both the
   * audio ending normally and the user clicking the x to skip the remaining
   * audio, instead we use setScreen('feedback') if it ends normally and
   * onCloseEarly if the user clicks the x to skip the remaining audio.
   */
  onCloseEarly?: (currentTime: number, totalTime: number) => void;
}): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const transcript = useCurrentTranscriptPhrases({
    transcriptRef: useReactManagedValueAsValueWithCallbacks(
      journey.transcript,
      (a, b) =>
        a === null || b === null ? a === b : a.uid === b.uid && a.jwt === b.jwt
    ),
  });
  const mediaVWC = useMappedValueWithCallbacks(shared, (s) => s.audio);
  const mediaInfo = useMediaInfo({
    currentTranscriptPhrasesVWC: transcript,
    durationSeconds: journey.durationSeconds,
    autoplay: true,
  });

  const storedSeen = useRef(false);
  useEffect(() => {
    if (storedSeen.current) {
      return;
    }
    storedSeen.current = true;
    onJourneyTaken();
  }, []);

  useValueWithCallbacksEffect(mediaInfo.ended, (ended) => {
    if (ended) {
      setTimeout(() => {
        setScreen('feedback', false);
      }, 0);
    }
    return undefined;
  });

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <OsehImageFromStateValueWithCallbacks
          state={useMappedValueWithCallbacks(shared, (s) => s.darkenedImage)}
        />
      </View>
      <MediaInfoAudio mediaInfo={mediaInfo} audio={mediaVWC} />
      <PlayerForeground
        size={windowSizeVWC}
        mediaInfo={mediaInfo}
        transcript={transcript}
        title={useReactManagedValueAsValueWithCallbacks(journey.title)}
        subtitle={useReactManagedValueAsValueWithCallbacks(
          journey.instructor.name
        )}
        onClose={useWritableValueWithCallbacks(() => async () => {
          if (onCloseEarly) {
            onCloseEarly(
              mediaInfo.currentTime.get(),
              mediaInfo.totalTime.get().seconds ?? journey.durationSeconds
            );
          } else {
            setScreen('feedback', true);
          }
        })}
        assumeDark
      />
      <StatusBar style="light" />
    </View>
  );
};
