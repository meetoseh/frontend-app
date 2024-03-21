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
import { useCallback } from 'react';
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
import { useValueWithCallbacksEffect } from '../../../shared/hooks/useValueWithCallbacksEffect';
import { useVideoInfo } from '../../../shared/hooks/useVideoInfo';

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
    presign: false,
  });
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

  const videoInfo = useVideoInfo({
    currentTranscriptPhrasesVWC: useCurrentTranscriptPhrases({
      transcriptRef: useReactManagedValueAsValueWithCallbacks(
        course.introVideoTranscript
      ),
    }),
  });

  const progressFullRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const contentWidth = useContentWidth();
  useValuesWithCallbacksEffect(
    [progressFullRef, videoInfo.currentTime],
    useCallback(() => {
      const ele = progressFullRef.get();
      if (ele === null) {
        return undefined;
      }

      const currentTime = videoInfo.currentTime.get();
      const progress = currentTime / course.introVideoDuration;
      ele.setNativeProps({ style: { width: progress * contentWidth } });
      return undefined;
    }, [
      progressFullRef,
      videoInfo.currentTime,
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
              videoStyleVWC,
              videoInfo.shouldPlay,
              videoInfo.shouldBeMuted,
            ],
            () => ({
              target: videoTargetVWC.get(),
              shouldPlay: videoInfo.shouldPlay.get(),
              muted: videoInfo.shouldBeMuted.get(),
              videoStyle: videoStyleVWC.get(),
            })
          )}
          component={({ target, shouldPlay, muted, videoStyle }) => (
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
              onLoadStart={() => setVWC(videoInfo.readyForDisplay, false)}
              onReadyForDisplay={() => setVWC(videoInfo.readyForDisplay, true)}
              onLoad={(status) => setVWC(videoInfo.playbackStatus, status)}
              onPlaybackStatusUpdate={(status) =>
                setVWC(videoInfo.playbackStatus, status)
              }
              isMuted={muted}
              style={videoStyle}
            />
          )}
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
            props={videoInfo.playPauseState}
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
                    const vidState = videoInfo.playbackStatus.get();
                    if (vidState === null || !vidState.isLoaded) {
                      return;
                    }
                    const vid = videoRefVWC.get();
                    if (
                      !vidState.isPlaying &&
                      (vidState.didJustFinish ||
                        (vidState.durationMillis !== undefined &&
                          vidState.positionMillis ===
                            vidState.durationMillis)) &&
                      vid !== null
                    ) {
                      vid.setPositionAsync(0).then((s) => {
                        setVWC(videoInfo.playbackStatus, s);
                        setVWC(videoInfo.shouldPlay, true);
                      });
                      return;
                    }

                    setVWC(videoInfo.shouldPlay, !vidState.isPlaying);
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
              props={videoInfo.closedCaptioning.state}
              component={(state) =>
                !state.enabled || !state.available ? (
                  <></>
                ) : (
                  <View style={styles.transcript}>
                    <TranscriptContainer
                      currentTime={videoInfo.currentTime}
                      currentTranscriptPhrases={
                        videoInfo.closedCaptioning.phrases
                      }
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
                    props={videoInfo.muted}
                    component={(muted) => (
                      <Pressable
                        style={styles.actionIcon}
                        onPress={() => setVWC(videoInfo.shouldBeMuted, !muted)}
                      >
                        {muted ? <Muted /> : <Unmuted />}
                      </Pressable>
                    )}
                  />
                  <RenderGuardedComponent
                    props={videoInfo.closedCaptioning.state}
                    component={(state) =>
                      !state.available ? (
                        <></>
                      ) : (
                        <Pressable
                          style={styles.actionIcon}
                          onPress={() =>
                            setVWC(
                              videoInfo.closedCaptioning.enabled,
                              !state.enabled
                            )
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
                  props={videoInfo.currentTime}
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
              <RenderGuardedComponent
                props={videoInfo.totalTime}
                component={(totalTime) => (
                  <Text style={styles.totalTime}>{totalTime.formatted}</Text>
                )}
              />
            </View>
            <View style={{ width: 1, height: bottomBarHeight }} />
          </View>
        </View>
      </View>
      <StatusBar style="dark" />
    </View>
  );
};
