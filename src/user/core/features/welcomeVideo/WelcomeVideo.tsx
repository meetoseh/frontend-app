import { ReactElement, useCallback, useRef } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { WelcomeVideoResources } from './WelcomeVideoResources';
import { WelcomeVideoState } from './WelcomeVideoState';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useVideoInfo } from '../../../../shared/hooks/useVideoInfo';
import { useCurrentTranscriptPhrases } from '../../../../shared/transcripts/useCurrentTranscriptPhrases';
import { setVWC } from '../../../../shared/lib/setVWC';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { OsehImageFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { useAnimationTargetAndRendered } from '../../../../shared/anim/useAnimationTargetAndRendered';
import { BezierAnimator } from '../../../../shared/anim/AnimationLoop';
import { ease } from '../../../../shared/lib/Bezier';
import { InlineOsehSpinner } from '../../../../shared/components/InlineOsehSpinner';
import { TranscriptContainer } from '../../../../shared/transcripts/TranscriptContainer';
import { useStartSession } from '../../../../shared/hooks/useInappNotificationSession';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { styles } from './WelcomeVideoStyles';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { ResizeMode, Video } from 'expo-av';
import { Pressable, View, Text } from 'react-native';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';

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
  const videoInfo = useVideoInfo({
    currentTranscriptPhrasesVWC: useCurrentTranscriptPhrases({
      transcriptRef: useMappedValueWithCallbacks(resources, (r) => {
        if (r.onboardingVideo.type !== 'success') {
          return null;
        }
        return r.onboardingVideo.result.transcript;
      }),
    }),
    autoplay: true,
  });

  const coverImageStateVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.coverImage
  );
  const overlayVWC = useAnimationTargetAndRendered<{ opacity: number }>(
    () => ({ opacity: 1 }),
    () => [
      new BezierAnimator(
        ease,
        350,
        (p) => p.opacity,
        (p, v) => (p.opacity = v)
      ),
    ]
  );

  useMappedValueWithCallbacks(videoInfo.playing, (playing) => {
    setVWC(overlayVWC.target, { opacity: playing ? 0 : 1 });
    return undefined;
  });

  const reportedPlayingRef = useRef<boolean>(false);
  useValueWithCallbacksEffect(videoInfo.playing, (playing) => {
    if (playing === reportedPlayingRef.current) {
      return undefined;
    }
    reportedPlayingRef.current = playing;
    if (playing) {
      resources.get().session?.storeAction('play', null);
    } else {
      if (!videoInfo.ended.get()) {
        resources
          .get()
          .session?.storeAction('pause', { time: videoInfo.currentTime.get() });
      }
    }
    return undefined;
  });

  useValueWithCallbacksEffect(
    videoInfo.ended,
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

  const bottomBarHeight = useBotBarHeight();
  const contentWidth = useContentWidth();
  const videoRefVWC = useWritableValueWithCallbacks<Video | null>(() => null);
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

  const overlayRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([overlayRef, overlayVWC.rendered], () => {
    const ele = overlayRef.get();
    const { opacity } = overlayVWC.rendered.get();
    if (ele !== null) {
      ele.setNativeProps({
        style: {
          backgroundColor: `rgba(0, 0, 0, ${opacity * 0.5})`,
          opacity,
        },
      });
    }
    return undefined;
  });

  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([contentRef, overlayVWC.rendered], () => {
    const ele = contentRef.get();
    const { opacity } = overlayVWC.rendered.get();
    if (ele !== null) {
      ele.setNativeProps({
        style: {
          opacity: 1 - opacity,
        },
      });
    }
    return undefined;
  });
  useValuesWithCallbacksEffect([contentRef, windowSizeVWC], () => {
    const ele = contentRef.get();
    const size = windowSizeVWC.get();
    if (ele !== null) {
      ele.setNativeProps({
        style: {
          width: size.width,
          minHeight: size.height,
          flexBasis: size.height,
        },
      });
    }
    return undefined;
  });

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [
              videoVWC,
              videoStyleVWC,
              videoInfo.shouldPlay,
              videoInfo.shouldBeMuted,
            ],
            () => ({
              target: videoVWC.get(),
              shouldPlay: videoInfo.shouldPlay.get(),
              muted: videoInfo.shouldBeMuted.get(),
              videoStyle: videoStyleVWC.get(),
            })
          )}
          component={({ target, shouldPlay, muted, videoStyle }) =>
            target.state !== 'loaded' ? (
              <></>
            ) : (
              <Video
                source={{
                  uri: target.nativeExport.url,
                  headers: { Authorization: `bearer ${target.jwt}` },
                }}
                ref={(r) => setVWC(videoRefVWC, r)}
                resizeMode={ResizeMode.COVER}
                shouldPlay={shouldPlay}
                isLooping={false}
                onLoadStart={() => setVWC(videoInfo.readyForDisplay, false)}
                onReadyForDisplay={() =>
                  setVWC(videoInfo.readyForDisplay, true)
                }
                onLoad={(status) => setVWC(videoInfo.playbackStatus, status)}
                onPlaybackStatusUpdate={(status) =>
                  setVWC(videoInfo.playbackStatus, status)
                }
                isMuted={muted}
                style={videoStyle}
              />
            )
          }
        />
      </View>
      <View style={styles.background}>
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [videoInfo.loaded, videoInfo.playing, videoInfo.currentTime],
            () =>
              !videoInfo.loaded.get() ||
              (!videoInfo.playing.get() && videoInfo.currentTime.get() === 0)
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
      <View
        ref={(v) => setVWC(contentRef, v)}
        style={Object.assign({}, styles.content, {
          opacity: 1 - overlayVWC.rendered.get().opacity,
          width: windowSizeVWC.get().width,
          minHeight: windowSizeVWC.get().height,
          flexBasis: windowSizeVWC.get().height,
        })}
      >
        <RenderGuardedComponent
          props={videoInfo.closedCaptioning.state}
          component={(state) =>
            !state.enabled || !state.available ? (
              <></>
            ) : (
              <View
                style={Object.assign({}, styles.transcript, {
                  width: contentWidth + 3,
                  paddingBottom:
                    styles.transcript.paddingBottom + bottomBarHeight,
                })}
              >
                <TranscriptContainer
                  currentTime={videoInfo.currentTime}
                  currentTranscriptPhrases={videoInfo.closedCaptioning.phrases}
                />
              </View>
            )
          }
        />
      </View>
      <Pressable
        style={Object.assign({}, styles.overlay, {
          backgroundColor: `rgba(0, 0, 0, ${
            overlayVWC.rendered.get().opacity * 0.5
          })`,
          opacity: overlayVWC.rendered.get().opacity,
        })}
        ref={(r) => setVWC(overlayRef, r)}
        onPress={() => {
          const vid = videoRefVWC.get();
          if (videoInfo.loaded.get() && vid !== null) {
            const wasPlaying = videoInfo.playing.get();
            if (wasPlaying) {
              vid.pauseAsync().then((s) => setVWC(videoInfo.playbackStatus, s));
            } else {
              vid.playAsync().then((s) => setVWC(videoInfo.playbackStatus, s));
            }
          }
        }}
      >
        <RenderGuardedComponent
          props={videoInfo.loaded}
          component={(loaded) => (
            <View style={styles.overlayContent}>
              {loaded ? (
                <Text style={styles.overlayContentText}>
                  Press anywhere to play
                </Text>
              ) : (
                <InlineOsehSpinner
                  size={{
                    type: 'react-rerender',
                    props: {
                      width: 60,
                    },
                  }}
                />
              )}
            </View>
          )}
        />
      </Pressable>
    </View>
  );
};
