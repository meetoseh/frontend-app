import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { OsehImageFromStateValueWithCallbacks } from '../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { OsehImagePropsLoadable } from '../../../shared/images/OsehImageProps';
import { areOsehImageStatesEqual } from '../../../shared/images/OsehImageState';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import { useOsehImageStateValueWithCallbacks } from '../../../shared/images/useOsehImageStateValueWithCallbacks';
import { useStaleOsehImageOnSwap } from '../../../shared/images/useStaleOsehImageOnSwap';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { ExternalCoursePreviewable } from '../lib/ExternalCourse';
import { styles } from './CoursePreviewStyles';
import { useWritableValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { useValuesWithCallbacksEffect } from '../../../shared/hooks/useValuesWithCallbacksEffect';
import { setVWC } from '../../../shared/lib/setVWC';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { useOsehContentTargetValueWithCallbacks } from '../../../shared/content/useOsehContentTargetValueWithCallbacks';
import { useReactManagedValueAsValueWithCallbacks } from '../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { useCallback, useContext } from 'react';
import { ModalContext } from '../../../shared/contexts/ModalContext';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { InlineOsehSpinner } from '../../../shared/components/InlineOsehSpinner';
import { useCurrentTranscriptPhrases } from '../../../shared/transcripts/useCurrentTranscriptPhrases';
import { TranscriptContainer } from '../../../shared/transcripts/TranscriptContainer';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { Pressable, View, Text, TextStyle, StyleProp } from 'react-native';
import { useContentWidth } from '../../../shared/lib/useContentWidth';
import { StatusBar } from 'expo-status-bar';
import Close from '../../../shared/icons/Close';
import Play from '../assets/Play';
import Pause from '../assets/Pause';
import Muted from '../assets/Muted';
import Unmuted from '../assets/Unmuted';
import ClosedCaptioningEnabled from '../assets/ClosedCaptioningEnabled';
import ClosedCaptioningDisabled from '../assets/ClosedCaptioningDisabled';
import { OutlineWhiteButton } from '../../../shared/components/OutlineWhiteButton';
import Arrow from '../assets/Arrow';
import { useTopBarHeight } from '../../../shared/hooks/useTopBarHeight';
import { useBotBarHeight } from '../../../shared/hooks/useBotBarHeight';
import { SvgLinearGradient } from '../../../shared/anim/SvgLinearGradient';

export type CoursePreviewProps = {
  course: ExternalCoursePreviewable;
  onViewDetails: () => void;
  onBack: () => void;
  imageHandler: OsehImageStateRequestHandler;
};

/**
 * Displays the given course preview at full width/height, with a button
 * to view details or go back
 */
export const CoursePreview = ({
  course,
  onViewDetails,
  onBack,
  imageHandler,
}: CoursePreviewProps) => {
  const modalContext = useContext(ModalContext);
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const coverImageProps = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size): OsehImagePropsLoadable => ({
      uid: course.introVideoThumbnail.uid,
      jwt: course.introVideoThumbnail.jwt,
      displayWidth: size.width,
      displayHeight: size.height,
      alt: '',
    })
  );
  const coverImageState = useMappedValueWithCallbacks(
    useStaleOsehImageOnSwap(
      useOsehImageStateValueWithCallbacks(
        adaptValueWithCallbacksAsVariableStrategyProps(coverImageProps),
        imageHandler
      )
    ),
    (state) => {
      if (state.thumbhash === null && course.introVideoThumbhash !== null) {
        return { ...state, thumbhash: course.introVideoThumbhash };
      }
      return state;
    },
    {
      outputEqualityFn: areOsehImageStatesEqual,
    }
  );

  const videoTargetRefVWC = useReactManagedValueAsValueWithCallbacks(
    course.introVideo
  );
  const videoTargetVWC = useOsehContentTargetValueWithCallbacks({
    ref: videoTargetRefVWC,
    displaySize: windowSizeVWC,
    presign: true,
  });
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
    (status) => status?.isLoaded && status.isPlaying
  );
  const videoMutedVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) => status?.isLoaded && status.isMuted
  );
  const videoCurrentTimeVWC = useMappedValueWithCallbacks(
    playbackStatusVWC,
    (status) => (status?.isLoaded ? status.positionMillis / 1000 : 0)
  );

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

  const currentTranscriptPhrasesVWC = useCurrentTranscriptPhrases({
    transcriptRef: useReactManagedValueAsValueWithCallbacks(
      course.introVideoTranscript
    ),
    currentTime: videoCurrentTimeVWC,
  });
  const closedCaptioningPhrasesVWC = useMappedValueWithCallbacks(
    currentTranscriptPhrasesVWC,
    (v) => v.phrases
  );
  const closedCaptioningAvailableVWC = useMappedValueWithCallbacks(
    currentTranscriptPhrasesVWC,
    useCallback(
      (v) => {
        return course.introVideoTranscript !== null && v.error === null;
      },
      [course]
    )
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

  const totalTime = ((durationSeconds) => {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  })(course.introVideoDuration);

  const progressFullRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const contentWidth = useContentWidth();
  useValuesWithCallbacksEffect(
    [progressFullRef, videoCurrentTimeVWC],
    useCallback(() => {
      const ele = progressFullRef.get();
      if (ele === null) {
        return undefined;
      }

      const currentTime = videoCurrentTimeVWC.get();
      const progress = currentTime / course.introVideoDuration;
      ele.setNativeProps({ style: { width: progress * contentWidth } });
      return undefined;
    }, [
      progressFullRef,
      videoCurrentTimeVWC,
      course.introVideoDuration,
      contentWidth,
    ])
  );

  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([contentRef, windowSizeVWC], () => {
    const ref = contentRef.get();
    if (ref === null) {
      return undefined;
    }
    const size = windowSizeVWC.get();
    ref.setNativeProps({
      style: {
        width: size.width,
        minHeight: size.height,
        flexBasis: size.height,
      },
    });
    return undefined;
  });

  const viewDetailsTextStyleVWC = useWritableValueWithCallbacks(
    (): StyleProp<TextStyle> => undefined
  );

  const topBarHeight = useTopBarHeight();
  const bottomBarHeight = useBotBarHeight();
  const videoRefVWC = useWritableValueWithCallbacks<Video | null>(() => null);

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [
              videoTargetVWC,
              windowSizeVWC,
              vidShouldPlayVWC,
              vidShouldBeMutedVWC,
            ],
            () => ({
              target: videoTargetVWC.get(),
              size: windowSizeVWC.get(),
              shouldPlay: vidShouldPlayVWC.get(),
              muted: vidShouldBeMutedVWC.get(),
            })
          )}
          component={({ target, size, shouldPlay, muted }) => (
            <Video
              source={
                target.state === 'loaded'
                  ? {
                      uri: target.nativeExport.url,
                      headers: { Authorization: `bearer ${target.jwt}` },
                    }
                  : undefined
              }
              ref={(r) => setVWC(videoRefVWC, r)}
              resizeMode={ResizeMode.COVER}
              shouldPlay={shouldPlay}
              isLooping={false}
              onLoadStart={() => setVWC(videoReadyForDisplayVWC, false)}
              onReadyForDisplay={() => setVWC(videoReadyForDisplayVWC, true)}
              onLoad={(status) => setVWC(playbackStatusVWC, status)}
              onPlaybackStatusUpdate={(status) =>
                setVWC(playbackStatusVWC, status)
              }
              isMuted={muted}
              style={{ width: size.width, height: size.height }}
            />
          )}
        />
      </View>
      <View style={styles.background}>
        <RenderGuardedComponent
          props={videoLoadedVWC}
          component={(loaded) =>
            !loaded ? (
              <OsehImageFromStateValueWithCallbacks state={coverImageState} />
            ) : (
              <></>
            )
          }
        />
      </View>
      <View style={styles.backgroundOverlay}>
        <SvgLinearGradient
          state={{
            stops: [
              {
                color: [0, 0, 0, 0.6],
                offset: 0,
              },
              {
                color: [0, 0, 0, 0],
                offset: 0.5,
              },
              {
                color: [0, 0, 0, 0],
                offset: 1,
              },
            ],
            x1: 0.5,
            y1: 1,
            x2: 0.5,
            y2: 0,
          }}
        />
      </View>
      <View style={styles.content} ref={(r) => setVWC(contentRef, r)}>
        <View
          style={Object.assign({}, styles.closeButtonContainer, {
            paddingTop: styles.closeButtonContainer.paddingTop + topBarHeight,
          })}
        >
          <View style={styles.closeButtonInnerContainer}>
            <Pressable onPress={onBack} style={styles.closeButton}>
              <Close width={20} height={20} />
            </Pressable>
          </View>
        </View>
        <View style={styles.pausePlayControlContainer}>
          <RenderGuardedComponent
            props={videoPlayPauseStateVWC}
            component={(state) =>
              state === 'loading' ? (
                <InlineOsehSpinner
                  size={{
                    type: 'react-rerender',
                    props: {
                      width: 25,
                    },
                  }}
                />
              ) : (
                <Pressable
                  style={styles.pausePlayControlLoaded}
                  onPress={() => {
                    const vidState = playbackStatusVWC.get();
                    if (vidState === null || !vidState.isLoaded) {
                      return;
                    }
                    console.log('pause/play toggle with', vidState);

                    const vid = videoRefVWC.get();
                    if (
                      !vidState.isPlaying &&
                      (vidState.didJustFinish ||
                        (vidState.durationMillis !== undefined &&
                          vidState.positionMillis ===
                            vidState.durationMillis)) &&
                      vid !== null
                    ) {
                      console.log(
                        'using setPositionAsync(0) followed by shouldPlay=true'
                      );
                      vid.setPositionAsync(0).then((s) => {
                        console.log('new state after setting pos:', s);
                        setVWC(playbackStatusVWC, s);
                        setVWC(vidShouldPlayVWC, true);
                      });
                      return;
                    }

                    console.log('toggling shouldPlay via react');
                    setVWC(vidShouldPlayVWC, !vidState.isPlaying);
                  }}
                >
                  {state === 'playing' && <Pause />}
                  {state === 'paused' && <Play />}
                </Pressable>
              )
            }
          />
        </View>
        <View style={styles.footer}>
          <View
            style={Object.assign({}, styles.footerInnerContainer, {
              width: contentWidth,
            })}
          >
            <RenderGuardedComponent
              props={closedCaptioningStateVWC}
              component={(state) =>
                !state.enabled || !state.available ? (
                  <></>
                ) : (
                  <View style={styles.transcript}>
                    <TranscriptContainer
                      currentTime={videoCurrentTimeVWC}
                      currentTranscriptPhrases={closedCaptioningPhrasesVWC}
                    />
                  </View>
                )
              }
            />
            <View style={styles.infoAndActions}>
              <View style={styles.info}>
                <Text style={styles.instructor}>{course.instructor.name}</Text>
                <Text style={styles.title}>{course.title}</Text>
                <View style={styles.numClassesContainer}>
                  <Text style={styles.numClasses}>
                    {course.numJourneys.toLocaleString()} Classes
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <View style={styles.actionIconsRow}>
                  <RenderGuardedComponent
                    props={videoMutedVWC}
                    component={(muted) => (
                      <Pressable
                        style={styles.actionIcon}
                        onPress={() => setVWC(vidShouldBeMutedVWC, !muted)}
                      >
                        {muted ? <Muted /> : <Unmuted />}
                      </Pressable>
                    )}
                  />
                  <RenderGuardedComponent
                    props={closedCaptioningStateVWC}
                    component={(state) =>
                      !state.available ? (
                        <></>
                      ) : (
                        <Pressable
                          style={styles.actionIcon}
                          onPress={() =>
                            setVWC(closedCaptioningEnabledVWC, !state.enabled)
                          }
                        >
                          {state.enabled ? (
                            <ClosedCaptioningEnabled />
                          ) : (
                            <ClosedCaptioningDisabled />
                          )}
                        </Pressable>
                      )
                    }
                  />
                </View>
                <View style={styles.viewDetailsContainer}>
                  <OutlineWhiteButton
                    onPress={onViewDetails}
                    setTextStyle={(s) => setVWC(viewDetailsTextStyleVWC, s)}
                    thin
                  >
                    <View style={styles.viewDetailsContent}>
                      <RenderGuardedComponent
                        props={viewDetailsTextStyleVWC}
                        component={(s) => <Text style={s}>View Series</Text>}
                      />
                      <Arrow style={styles.viewDetailsArrow} />
                    </View>
                  </OutlineWhiteButton>
                </View>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View
                style={Object.assign({}, styles.progressFull, { width: 0 })}
                ref={(v) => setVWC(progressFullRef, v)}
              />
              <View style={styles.progressDot} />
              <View style={styles.progressEmpty} />
            </View>
            <View style={styles.durationContainer}>
              <Text style={styles.currentTime}>
                <RenderGuardedComponent
                  props={videoCurrentTimeVWC}
                  component={(inFractionalSeconds) => {
                    const inSeconds = Math.floor(inFractionalSeconds);
                    const minutes = Math.floor(inSeconds / 60);
                    const seconds = Math.floor(inSeconds) % 60;

                    return (
                      <>
                        {minutes}:{seconds < 10 ? '0' : ''}
                        {seconds}
                      </>
                    );
                  }}
                />
              </Text>
              <Text style={styles.totalTime}>{totalTime}</Text>
            </View>
            <View style={{ width: 1, height: bottomBarHeight }} />
          </View>
        </View>
      </View>
      <StatusBar style="dark" />
    </View>
  );
};
