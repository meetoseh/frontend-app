import { ReactElement, useCallback } from 'react';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../lib/Callbacks';
import { OsehTranscriptPhrase } from '../../transcripts/OsehTranscript';
import { useValueWithCallbacksEffect } from '../../hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../lib/setVWC';
import { styles } from './PlayerForegroundStyles';
import { BezierAnimator } from '../../anim/AnimationLoop';
import { ease } from '../../lib/Bezier';
import {
  UseCurrentTranscriptPhrasesResult,
  fadeTimeSeconds,
  holdLateSeconds,
} from '../../transcripts/useCurrentTranscriptPhrases';
import { MediaInfo } from '../useMediaInfo';
import {
  GestureResponderEvent,
  View,
  Text,
  ViewStyle,
  Pressable,
  StyleProp,
  TextStyle,
} from 'react-native';
import { useAnimationTargetAndRendered } from '../../anim/useAnimationTargetAndRendered';
import { useMappedValueWithCallbacks } from '../../hooks/useMappedValueWithCallbacks';
import { useStyleVWC } from '../../hooks/useStyleVWC';
import { RenderGuardedComponent } from '../../components/RenderGuardedComponent';
import { SimpleBlurView } from '../../components/SimpleBlurView';
import * as Colors from '../../../styling/colors';
import Play from './assets/Play';
import Pause from './assets/Pause';
import { InlineOsehSpinner } from '../../components/InlineOsehSpinner';
import Unmuted from './assets/Unmuted';
import Muted from './assets/Muted';
import ClosedCaptioningDisabled from './assets/ClosedCaptioningDisabled';
import ClosedCaptioningEnabled from './assets/ClosedCaptioningEnabled';
import { OutlineWhiteButton } from '../../components/OutlineWhiteButton';
import Arrow from './assets/Arrow';
import { useMappedValuesWithCallbacks } from '../../hooks/useMappedValuesWithCallbacks';
import { useTopBarHeight } from '../../hooks/useTopBarHeight';
import { useBotBarHeight } from '../../hooks/useBotBarHeight';
import { Close } from '../../components/icons/Close';
import { OsehColors } from '../../OsehColors';
import { BoxError, DisplayableError } from '../../lib/errors';

export type PlayerCTA = {
  /** The title for the button */
  title: string;
  /**
   * Performs the action; as soon as this is pressed, the media is paused and
   * a spinner state is shown until the promise resolves or rejects.
   */
  action: () => Promise<void>;
};

export type PlayerForegroundProps = {
  /**
   * The size to render the player foreground at, or null not to load or
   * render at all.
   */
  size: ValueWithCallbacks<{ width: number; height: number } | null>;

  /** The media info for the content */
  mediaInfo: MediaInfo;

  /**
   * The transcript for the media
   */
  transcript: ValueWithCallbacks<UseCurrentTranscriptPhrasesResult>;

  /** The title for the content, e.g., the name of the journey */
  title: ValueWithCallbacks<string | ReactElement>;

  /** If a subtitle should be rendered, e.g., the instructor name, the subtitle to render */
  subtitle?: ValueWithCallbacks<string | ReactElement | undefined>;

  /**
   * If specified, adds a tag in the top-left containing this element/text.
   */
  label?: string | ReactElement;

  /** The cta to show, or null for no cta, or undefined if there is never a cta */
  cta?: ValueWithCallbacks<PlayerCTA | null>;

  /** The tag to show below the title, or null for no tag, or undefined if there is never a tag */
  tag?: ValueWithCallbacks<string | null>;

  /**
   * A function to show an x in the upper right that uses this handler, or null
   * for no x, or undefined if there is never an x.
   */
  onClose?: ValueWithCallbacks<(() => Promise<void>) | null>;

  /**
   * If true, we will assume the background is dark at the top, which
   * may change some styling.
   */
  assumeDark?: boolean;
};

/**
 * Displays the overlay for media, either an audio file or video file. Doesn't
 * handle the background image (for audio) or actually rendering the video (for
 * video)
 */
export const PlayerForeground = ({
  size,
  mediaInfo,
  transcript,
  title,
  subtitle,
  label,
  cta,
  tag,
  onClose,
  assumeDark,
}: PlayerForegroundProps): ReactElement => {
  const onPlayButtonClick = useCallback(() => {
    setVWC(mediaInfo.shouldPlay, !mediaInfo.playing.get());
  }, [mediaInfo]);

  const onMuteButtonClick = useCallback(() => {
    setVWC(mediaInfo.shouldBeMuted, !mediaInfo.muted.get());
  }, [mediaInfo]);

  const progressContainerWidth = useMappedValueWithCallbacks(size, (s) =>
    Math.max((s?.width ?? 0) - 48, 0)
  );
  const progressFullRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const progressFullStyleVWC = useMappedValuesWithCallbacks(
    [progressContainerWidth, mediaInfo.progress],
    (): ViewStyle => ({
      width: progressContainerWidth.get() * mediaInfo.progress.get(),
    })
  );
  useStyleVWC(progressFullRef, progressFullStyleVWC);

  const onProgressContainerClick = useCallback(
    (e: GestureResponderEvent) => {
      const location = e.nativeEvent?.locationX;
      if (location === undefined) {
        return;
      }
      const width = progressContainerWidth.get();
      if (
        width <= 0 ||
        location <= 0 ||
        !isFinite(location) ||
        !isFinite(width) ||
        location > width
      ) {
        return;
      }
      const requestedProgress = location / width;
      mediaInfo.seekTo.get()?.(
        requestedProgress * (mediaInfo.totalTime.get().seconds ?? 0)
      );
    },
    [progressContainerWidth, mediaInfo.seekTo, mediaInfo.totalTime]
  );

  const onClosedCaptioningClick = useCallback(() => {
    const newVal = !mediaInfo.closedCaptioning.enabled.get();
    setVWC(mediaInfo.closedCaptioning.enabled, newVal);
  }, [mediaInfo.closedCaptioning]);

  const handlingCTA = useWritableValueWithCallbacks(() => false);
  const onCTAClick = useCallback(async () => {
    if (cta === undefined) {
      return;
    }
    if (handlingCTA.get()) {
      return;
    }
    const val = cta.get();
    if (val === null) {
      return;
    }

    setVWC(handlingCTA, true);
    try {
      setVWC(mediaInfo.shouldPlay, false);
      await val.action();
    } finally {
      setVWC(handlingCTA, false);
    }
  }, [cta, handlingCTA]);

  const handlingClose = useWritableValueWithCallbacks(() => false);
  const onCloseClick = useCallback(async () => {
    if (onClose === undefined) {
      return;
    }
    if (handlingClose.get()) {
      return;
    }
    const val = onClose.get();
    if (val === null) {
      return;
    }

    setVWC(handlingClose, true);
    try {
      setVWC(mediaInfo.shouldPlay, false);
      await val();
    } finally {
      setVWC(handlingClose, false);
    }
  }, [onClose, handlingClose]);

  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const containerStyle = useMappedValueWithCallbacks(
    size,
    (s): ViewStyle =>
      s === null
        ? { display: 'none' }
        : { display: 'flex', width: s.width, height: s.height }
  );
  useStyleVWC(containerRef, containerStyle);

  const headerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const headerStyle = useMappedValueWithCallbacks(
    size,
    (s): ViewStyle => (s === null ? {} : { width: s.width })
  );
  useStyleVWC(headerRef, headerStyle);

  const ctaTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  const ctaForegroundColor = useWritableValueWithCallbacks<string>(
    () => Colors.PRIMARY_LIGHT
  );
  const topBarHeight = useTopBarHeight();
  const botBarHeight = useBotBarHeight();

  return (
    <View
      style={Object.assign({}, styles.container, containerStyle.get())}
      ref={(r) => setVWC(containerRef, r)}
    >
      {label || onClose !== undefined ? (
        <View
          style={Object.assign({}, styles.header, headerStyle.get(), {
            paddingTop: styles.header.paddingTop + topBarHeight,
          })}
          ref={(r) => setVWC(headerRef, r)}
        >
          {label && (
            <View style={styles.labelContainer}>
              <Text style={styles.label}>{label}</Text>
            </View>
          )}
          {onClose !== undefined && (
            <RenderGuardedComponent
              props={onClose}
              component={(rawHandler) =>
                rawHandler === null ? (
                  <></>
                ) : (
                  <View style={styles.closeButtonContainer}>
                    <Pressable
                      style={styles.closeButtonPressableContainer}
                      onPress={onCloseClick}
                    >
                      <View
                        style={Object.assign(
                          {},
                          styles.closeButtonInnerContainer,
                          assumeDark
                            ? styles.closeButtonInnerContainerAssumeDark
                            : undefined
                        )}
                      >
                        <Close
                          icon={{ width: 24 }}
                          container={{ width: 56, height: 56 }}
                          startPadding={{
                            x: { fraction: 0.5 },
                            y: { fraction: 0.5 },
                          }}
                          color={OsehColors.v4.primary.light}
                        />
                      </View>
                    </Pressable>
                  </View>
                )
              }
            />
          )}
        </View>
      ) : (
        <View />
      )}
      <View pointerEvents="box-none" style={styles.playContainer}>
        <Pressable style={styles.playButton} onPress={onPlayButtonClick}>
          <SimpleBlurView
            androidTechnique={{
              type: 'color',
              color: Colors.MORE_TRANSPARENT_WHITE,
            }}
            tint="light"
            intensity={8}
          >
            <View style={styles.playButtonInner}>
              <RenderGuardedComponent
                props={mediaInfo.playPauseState}
                component={(state) => {
                  if (state === 'paused') {
                    return <Play />;
                  }
                  if (state === 'playing') {
                    return <Pause />;
                  }
                  if (state === 'errored') {
                    const err = (() => {
                      const status = mediaInfo.playbackStatus.get();
                      if (status === null || status.isLoaded) {
                        return undefined;
                      }
                      return status.error;
                    })();
                    return (
                      <BoxError
                        error={
                          new DisplayableError('client', 'play media', `${err}`)
                        }
                      />
                    );
                  }
                  return (
                    <InlineOsehSpinner
                      size={{
                        type: 'react-rerender',
                        props: { height: 20 },
                      }}
                    />
                  );
                }}
              />
            </View>
          </SimpleBlurView>
        </Pressable>
      </View>
      <View style={styles.bottomContents}>
        <RenderGuardedComponent
          props={mediaInfo.closedCaptioning.available}
          component={(available) =>
            !available ? (
              <></>
            ) : (
              <RenderGuardedComponent
                props={mediaInfo.closedCaptioning.enabled}
                component={(desired) =>
                  !desired ? (
                    <></>
                  ) : (
                    <View style={styles.transcriptContainer}>
                      <RenderGuardedComponent
                        props={transcript}
                        component={(phrases) => (
                          <>
                            {phrases.phrases.map(({ phrase, id }) => (
                              <TranscriptPhrase
                                phrase={phrase}
                                currentTime={mediaInfo.currentTime}
                                key={id}
                              />
                            ))}
                          </>
                        )}
                      />
                    </View>
                  )
                }
              />
            )
          }
        />
        <View style={styles.controlsContainer}>
          <View style={styles.infoContainer}>
            {subtitle !== undefined && (
              <RenderGuardedComponent
                props={subtitle}
                component={(v) =>
                  v === null ? (
                    <></>
                  ) : (
                    <Text style={styles.instructor}>{v}</Text>
                  )
                }
              />
            )}
            <RenderGuardedComponent
              props={title}
              component={(v) => <Text style={styles.title}>{v}</Text>}
            />
            {tag !== undefined && (
              <RenderGuardedComponent
                props={tag}
                component={(v) =>
                  v === null ? (
                    <></>
                  ) : (
                    <View style={styles.tagContainer}>
                      <Text style={styles.tag}>{v}</Text>
                    </View>
                  )
                }
              />
            )}
          </View>
          <View style={styles.buttonsContainer}>
            <View style={styles.buttonIconsRow}>
              <Pressable style={styles.button} onPress={onMuteButtonClick}>
                <RenderGuardedComponent
                  props={mediaInfo.muted}
                  component={(muted) => (muted ? <Muted /> : <Unmuted />)}
                />
              </Pressable>
              <RenderGuardedComponent
                props={mediaInfo.closedCaptioning.available}
                component={(available) =>
                  !available ? (
                    <></>
                  ) : (
                    <Pressable
                      style={[styles.button, styles.buttonNotFirst]}
                      onPress={onClosedCaptioningClick}
                    >
                      <RenderGuardedComponent
                        props={mediaInfo.closedCaptioning.enabled}
                        component={(desired) =>
                          desired ? (
                            <ClosedCaptioningEnabled />
                          ) : (
                            <ClosedCaptioningDisabled />
                          )
                        }
                      />
                    </Pressable>
                  )
                }
              />
            </View>
            {cta !== undefined && (
              <RenderGuardedComponent
                props={cta}
                component={(v) =>
                  v === null ? (
                    <></>
                  ) : (
                    <View style={styles.buttonCTARow}>
                      <RenderGuardedComponent
                        props={handlingCTA}
                        component={(handling) => (
                          <OutlineWhiteButton
                            thin
                            onPress={onCTAClick}
                            spinner={handling}
                            setTextStyle={(s) => setVWC(ctaTextStyle, s)}
                            setForegroundColor={(c) =>
                              setVWC(ctaForegroundColor, c)
                            }
                          >
                            <View style={styles.ctaInner}>
                              <RenderGuardedComponent
                                props={ctaTextStyle}
                                component={(s) => (
                                  <Text style={s}>{v.title}</Text>
                                )}
                              />
                              <RenderGuardedComponent
                                props={ctaForegroundColor}
                                component={(fill) => <Arrow fill={fill} />}
                              />
                            </View>
                          </OutlineWhiteButton>
                        )}
                      />
                    </View>
                  )
                }
              />
            )}
          </View>
        </View>
        <Pressable
          style={styles.progressContainer}
          onPress={onProgressContainerClick}
        >
          <View
            style={Object.assign(
              {},
              styles.progressFull,
              progressFullStyleVWC.get()
            )}
            ref={(r) => setVWC(progressFullRef, r)}
          />
          <View style={styles.progressDot} />
          <View style={styles.progressEmpty} />
        </Pressable>
        <View style={styles.durationContainer} pointerEvents="none">
          <RenderGuardedComponent
            props={mediaInfo.currentTime}
            component={(inSeconds) => {
              const minutes = Math.floor(inSeconds / 60);
              const seconds = Math.floor(inSeconds) % 60;

              return (
                <Text style={styles.currentTime}>
                  {minutes}:{seconds < 10 ? '0' : ''}
                  {seconds}
                </Text>
              );
            }}
          />
          <RenderGuardedComponent
            props={mediaInfo.totalTime}
            component={(totalTime) => (
              <Text style={styles.totalTime}>{totalTime.formatted}</Text>
            )}
          />
        </View>
        <View style={{ height: botBarHeight }} />
      </View>
    </View>
  );
};

const TranscriptPhrase = (props: {
  currentTime: ValueWithCallbacks<number>;
  phrase: OsehTranscriptPhrase;
}): ReactElement => {
  const opacity = useAnimationTargetAndRendered<{ opacity: number }>(
    () => ({ opacity: 0 }),
    () => [
      new BezierAnimator(
        ease,
        fadeTimeSeconds * 1000,
        (p) => p.opacity,
        (p, v) => (p.opacity = v)
      ),
    ]
  );

  useValueWithCallbacksEffect(props.currentTime, (progressSeconds) => {
    const timeUntilEnd =
      props.phrase.endsAt + holdLateSeconds - progressSeconds;
    setVWC(
      opacity.target,
      { opacity: timeUntilEnd < fadeTimeSeconds ? 0 : 1 },
      (a, b) => a.opacity === b.opacity
    );
    return undefined;
  });

  const wrapperRef = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(wrapperRef, opacity.rendered);

  return (
    <View
      style={Object.assign(
        {},
        styles.transcriptPhraseWrapper,
        opacity.rendered.get()
      )}
      ref={(r) => setVWC(wrapperRef, r)}
    >
      <Text style={styles.transcriptPhrase}>{props.phrase.phrase}</Text>
    </View>
  );
};
