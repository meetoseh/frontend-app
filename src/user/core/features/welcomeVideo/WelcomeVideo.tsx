import { ReactElement, useCallback, useRef } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { WelcomeVideoResources } from './WelcomeVideoResources';
import { WelcomeVideoState } from './WelcomeVideoState';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useMediaInfo } from '../../../../shared/content/useMediaInfo';
import { useCurrentTranscriptPhrases } from '../../../../shared/transcripts/useCurrentTranscriptPhrases';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { OsehImageFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { useStartSession } from '../../../../shared/hooks/useInappNotificationSession';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { styles } from './WelcomeVideoStyles';
import { View } from 'react-native';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { MediaInfoVideo } from '../../../../shared/content/MediaInfoVideo';
import { StatusBar } from 'expo-status-bar';
import {
  PlayerCTA,
  PlayerForeground,
} from '../../../../shared/content/player/PlayerForeground';

/**
 * Displays the full screen welcome video
 */
export const WelcomeVideo = ({
  state,
  resources,
}: FeatureComponentProps<
  WelcomeVideoState,
  WelcomeVideoResources
>): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  useStartSession(
    adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(resources, (r) => r.session)
    ),
    {
      onStart: () => {
        const onboardingVideo = resources.get().onboardingVideo;
        resources.get().session?.storeAction('open', {
          onboarding_video_uid:
            onboardingVideo.type === 'success'
              ? onboardingVideo.result.onboardingVideoUid
              : null,
          content_file_uid:
            onboardingVideo.type === 'success'
              ? onboardingVideo.result.video.uid
              : null,
        });
      },
    }
  );

  const videoVWC = useMappedValueWithCallbacks(resources, (r) => r.video);
  const transcript = useCurrentTranscriptPhrases({
    transcriptRef: useMappedValueWithCallbacks(resources, (r) => {
      if (r.onboardingVideo.type !== 'success') {
        return null;
      }
      return r.onboardingVideo.result.transcript;
    }),
  });
  const mediaInfo = useMediaInfo({
    currentTranscriptPhrasesVWC: transcript,
    autoplay: true,
  });

  const coverImageStateVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.coverImage
  );

  const reportedPlayingRef = useRef<boolean>(false);
  useValueWithCallbacksEffect(mediaInfo.playing, (playing) => {
    if (playing === reportedPlayingRef.current) {
      return undefined;
    }
    reportedPlayingRef.current = playing;
    if (playing) {
      resources.get().session?.storeAction('play', null);
    } else {
      if (!mediaInfo.ended.get()) {
        resources
          .get()
          .session?.storeAction('pause', { time: mediaInfo.currentTime.get() });
      }
    }
    return undefined;
  });

  useValueWithCallbacksEffect(
    mediaInfo.ended,
    useCallback(
      (ended) => {
        if (ended) {
          resources.get().session?.storeAction('ended', null);
          resources.get().session?.reset();
          state.get().ian?.onShown();
        }
        return undefined;
      },
      [resources, state]
    )
  );

  const videoStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC],
    () => {
      const screenSize = windowSizeVWC.get();

      return { width: screenSize.width, height: screenSize.height };
    },
    {
      outputEqualityFn: (a, b) => a.width === b.width && a.height === b.height,
    }
  );

  const cta = useWritableValueWithCallbacks(
    (): PlayerCTA => ({
      title: 'Skip',
      action: async () => {
        resources.get().session?.storeAction('close', null);
        resources.get().session?.reset();
        state.get().ian?.onShown();
      },
    })
  );

  const title = useWritableValueWithCallbacks(() => 'Welcome to Oseh');

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <MediaInfoVideo
          mediaInfo={mediaInfo}
          video={videoVWC}
          styleVWC={videoStyleVWC}
        />
      </View>
      <View style={styles.background}>
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [mediaInfo.loaded, mediaInfo.playing, mediaInfo.currentTime],
            () =>
              !mediaInfo.loaded.get() ||
              (!mediaInfo.playing.get() && mediaInfo.currentTime.get() === 0)
          )}
          component={(showCoverImage) =>
            showCoverImage ? (
              <OsehImageFromStateValueWithCallbacks
                state={coverImageStateVWC}
              />
            ) : (
              <></>
            )
          }
        />
      </View>
      <PlayerForeground
        size={windowSizeVWC}
        mediaInfo={mediaInfo}
        transcript={transcript}
        title={title}
        cta={cta}
      />
      <StatusBar style="dark" />
    </View>
  );
};
