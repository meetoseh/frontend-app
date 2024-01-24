import React, { ReactElement, useCallback, useMemo, useRef } from 'react';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { styles } from './JourneyFeedbackButtonStyles';
import { useValueWithCallbacksEffect } from '../../../shared/hooks/useValueWithCallbacksEffect';
import { useDynamicAnimationEngine } from '../../../shared/anim/useDynamicAnimation';
import { ease, easeInOut, easeOutBack } from '../../../shared/lib/Bezier';
import {
  interpolateColor,
  interpolateNumber,
} from '../../../shared/lib/BezierAnimation';
import { setVWC } from '../../../shared/lib/setVWC';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import {
  Pressable,
  View,
  Text,
  ViewStyle,
  StyleProp,
  LayoutChangeEvent,
} from 'react-native';
import {
  SvgLinearGradientBackground,
  SvgLinearGradientBackgroundState,
} from '../../../shared/anim/SvgLinearGradientBackground';
import { VariableStrategyProps } from '../../../shared/anim/VariableStrategyProps';
import { GrayscaledView } from '../../../shared/components/GrayscaledView';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';

export type JourneyFeedbackButtonProps = {
  /**
   * True if this button is in the selected state, false otherwise.
   */
  selected: ValueWithCallbacks<boolean>;

  /**
   * The background color for the emoji. Animating the emoji goes faster
   * when the renderer doesn't need to worry about transparency, so where
   * transparency is desired it should be approximated
   */
  background: ValueWithCallbacks<[number, number, number]>;

  /**
   * The emoji to display in the button. This will handle grayscaling
   * as necessary
   */
  emoji: string;

  /**
   * The label to display while the button is selected
   */
  label: string;

  /**
   * Callback for when this button is pressed. Should result in this
   * button being selected.
   */
  onPress: () => void;

  /**
   * The width of the button; required for native since align-items stretch
   * doesn't work the same way as on the web
   */
  width: number;
};

type AnimationStateBackground = {
  /* 0-255 rgb, 0-1 opacity */
  color1: [number, number, number, number];
  color2: [number, number, number, number];
};

type AnimationStateEmoji = {
  /* degrees */
  rotation: number;
  /* 1 = 100%  */
  scale: number;
  /* 0-1 grayscale strength */
  grayscale: number;
};

type AnimationStateLabel = {
  /** 0-1 */
  opacity: number;

  /** 1 = 100% */
  scale: number;

  /** 0-1 */
  exclamationOpacity: number;
};

type AnimationState = {
  background: ValueWithCallbacks<AnimationStateBackground>;
  emoji: ValueWithCallbacks<AnimationStateEmoji>;
  label: ValueWithCallbacks<AnimationStateLabel>;
};

const useAnimationState = (
  selectedVWC: ValueWithCallbacks<boolean>,
  backgroundTargetVWC: ValueWithCallbacks<[number, number, number]>
): AnimationState => {
  const backgroundVWC = useWritableValueWithCallbacks<AnimationStateBackground>(
    () => ({
      color1: [...backgroundTargetVWC.get(), 1],
      color2: [...backgroundTargetVWC.get(), 1],
    })
  );
  const emojiVWC = useWritableValueWithCallbacks<AnimationStateEmoji>(() => ({
    rotation: 0,
    scale: 1,
    grayscale: 0,
  }));
  const labelVWC = useWritableValueWithCallbacks<AnimationStateLabel>(() => ({
    opacity: 0,
    scale: 1,
    exclamationOpacity: 0,
    exclamationScale: 1,
    rotation: 0,
  }));

  const engine = useDynamicAnimationEngine();

  useValueWithCallbacksEffect(selectedVWC, (selected) => {
    const bkndRef = backgroundVWC.get();
    const initialBackground = {
      color1: [...bkndRef.color1],
      color2: [...bkndRef.color2],
    };

    const emojiRef = emojiVWC.get();
    const initialEmoji = { ...emojiRef };

    const labelRef = labelVWC.get();
    const initialLabel = { ...labelRef };

    if (!selected) {
      engine.play([
        {
          id: 'background',
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            const targetZeroTo1 = backgroundTargetVWC.get();
            const target = [
              targetZeroTo1[0] * 255,
              targetZeroTo1[1] * 255,
              targetZeroTo1[2] * 255,
            ];
            setVWC(backgroundVWC, {
              color1: [
                ...interpolateColor(initialBackground.color1, target, progress),
                1,
              ] as [number, number, number, number],
              color2: [
                ...interpolateColor(initialBackground.color2, target, progress),
                1,
              ] as [number, number, number, number],
            });
          },
        },
        {
          id: 'emoji',
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(emojiVWC, {
              rotation: interpolateNumber(initialEmoji.rotation, 0, progress),
              scale: interpolateNumber(initialEmoji.scale, 1, progress),
              grayscale: interpolateNumber(initialEmoji.grayscale, 1, progress),
            });
          },
        },
        {
          id: 'label',
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(labelVWC, {
              opacity: interpolateNumber(initialLabel.opacity, 0, progress),
              scale: interpolateNumber(initialLabel.scale, 1, progress),
              exclamationOpacity: interpolateNumber(
                initialLabel.exclamationOpacity,
                0,
                progress
              ),
            });
          },
        },
      ]);
    } else {
      const scaleFirstDirection = (Math.random() > 0.5 ? 1 : -1) as 1 | -1;
      const rotationTarget = 360 * (Math.random() > 0.5 ? 1 : -1);

      engine.play([
        {
          id: 'background',
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(backgroundVWC, {
              color1: [
                ...interpolateColor(
                  initialBackground.color1,
                  [87, 184, 162],
                  progress
                ),
                1,
              ] as [number, number, number, number],
              color2: [
                ...interpolateColor(
                  initialBackground.color2,
                  [20, 128, 128],
                  progress
                ),
                1,
              ] as [number, number, number, number],
            });
          },
        },
        {
          id: 'emojiGrayscale',
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(emojiVWC, {
              ...emojiVWC.get(),
              grayscale: interpolateNumber(initialEmoji.grayscale, 0, progress),
            });
          },
        },
        {
          id: 'emojiRotation',
          duration: 1000,
          progressEase: { type: 'bezier', bezier: easeOutBack },
          onFrame: (progress) => {
            setVWC(emojiVWC, {
              ...emojiVWC.get(),
              rotation: interpolateNumber(
                initialEmoji.rotation,
                rotationTarget,
                progress
              ),
            });
          },
          onFinish: () => {
            setVWC(emojiVWC, {
              ...emojiVWC.get(),
              rotation: 0,
            });
          },
        },
        {
          id: 'emojiScaleReset',
          duration: 100,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(emojiVWC, {
              ...emojiVWC.get(),
              scale: interpolateNumber(initialEmoji.scale, 1, progress),
            });
          },
        },
        {
          id: 'emojiScale1',
          delayUntil: {
            type: 'relativeToEnd',
            id: 'emojiScaleReset',
            after: 0,
          },
          duration: 175,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(emojiVWC, {
              ...emojiVWC.get(),
              scale: interpolateNumber(
                1,
                1 + 0.1 * scaleFirstDirection,
                progress
              ),
            });
          },
        },
        {
          id: 'emojiScale2',
          delayUntil: { type: 'relativeToEnd', id: 'emojiScale1', after: 0 },
          duration: 350,
          progressEase: { type: 'bezier', bezier: easeInOut },
          onFrame: (progress) => {
            setVWC(emojiVWC, {
              ...emojiVWC.get(),
              scale: interpolateNumber(
                1 + 0.1 * scaleFirstDirection,
                1 - 0.1 * scaleFirstDirection,
                progress
              ),
            });
          },
        },
        {
          id: 'emojiScale3',
          delayUntil: { type: 'relativeToEnd', id: 'emojiScale2', after: 0 },
          duration: 175,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(emojiVWC, {
              ...emojiVWC.get(),
              scale: interpolateNumber(
                1 - 0.1 * scaleFirstDirection,
                1,
                progress
              ),
            });
          },
        },
        {
          id: 'labelPrepare',
          delayUntil: {
            type: 'relativeToStart',
            id: 'emojiRotation',
            after: 0,
          },
          duration: 100,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(labelVWC, {
              ...labelVWC.get(),
              scale: interpolateNumber(initialLabel.scale, 1.4, progress),
            });
          },
        },
        {
          id: 'labelFadeIn',
          delayUntil: {
            type: 'relativeToStart',
            id: 'emojiRotation',
            after: 500,
          },
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(labelVWC, {
              ...labelVWC.get(),
              opacity: interpolateNumber(initialLabel.opacity, 1, progress),
              exclamationOpacity: interpolateNumber(
                initialLabel.exclamationOpacity,
                1,
                progress
              ),
            });
          },
        },
        {
          id: 'labelScaleIn',
          delayUntil: { type: 'relativeToStart', id: 'labelFadeIn', after: 0 },
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(labelVWC, {
              ...labelVWC.get(),
              scale: interpolateNumber(1.4, 1, progress),
            });
          },
        },
        {
          id: 'labelExclamationFadeOut',
          delayUntil: { type: 'relativeToEnd', id: 'labelFadeIn', after: 500 },
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(labelVWC, {
              ...labelVWC.get(),
              exclamationOpacity: interpolateNumber(1, 0, progress),
            });
          },
        },
      ]);
    }
    return undefined;
  });

  return useMemo(
    () => ({
      background: backgroundVWC,
      emoji: emojiVWC,
      label: labelVWC,
    }),
    [backgroundVWC, emojiVWC, labelVWC]
  );
};

/**
 * Shows a single small juicy feedback button with an emoji and a label.
 */
export const JourneyFeedbackButton = ({
  selected,
  background,
  emoji,
  label,
  onPress,
  width,
}: JourneyFeedbackButtonProps): ReactElement => {
  const pressing = useWritableValueWithCallbacks(() => false);
  const animationState = useAnimationState(selected, background);

  const containerStyle = useMappedValueWithCallbacks(pressing, (pressing) =>
    Object.assign(
      {},
      styles.button,
      pressing ? styles.buttonPressed : undefined
    )
  );

  const containerRef = useRef<View>(null);
  useValueWithCallbacksEffect(containerStyle, (style) => {
    if (containerRef.current !== null) {
      containerRef.current.setNativeProps({ style });
    }
    return undefined;
  });

  const emojiBackgroundState = useMappedValueWithCallbacks(
    animationState.background,
    (background): SvgLinearGradientBackgroundState => ({
      stop1: {
        color: background.color1,
        offset: 0.2239,
      },
      stop2: {
        color: background.color2,
        offset: 0.8462,
      },
      x1: 25,
      y1: 35,
      x2: 75,
      y2: 65,
    })
  );

  const emojiBackgroundVSP = useMemo(
    (): VariableStrategyProps<SvgLinearGradientBackgroundState> => ({
      type: 'callbacks',
      props: emojiBackgroundState.get,
      callbacks: emojiBackgroundState.callbacks,
    }),
    [emojiBackgroundState]
  );

  const emojiGrayscaleStrength = useMappedValueWithCallbacks(
    animationState.emoji,
    (emoji) => emoji.grayscale
  );
  const emojiGrayscaleStrengthVSP = useMemo(
    (): VariableStrategyProps<number> => ({
      type: 'callbacks',
      props: emojiGrayscaleStrength.get,
      callbacks: emojiGrayscaleStrength.callbacks,
    }),
    [emojiGrayscaleStrength]
  );

  const emojiGrayscalerWrapperStyle = useMappedValueWithCallbacks(
    animationState.emoji,
    (emoji) =>
      Object.assign({}, styles.emojiGrayscaler, {
        transform: [
          ...(emoji.rotation !== 0 ? [{ rotate: `${emoji.rotation}deg` }] : []),
          ...(emoji.scale !== 1 ? [{ scale: emoji.scale }] : []),
        ],
      })
  );
  const emojiGrayscalerWrapperRef = useRef<View>(null);
  useValueWithCallbacksEffect(emojiGrayscalerWrapperStyle, (style) => {
    if (emojiGrayscalerWrapperRef.current !== null) {
      emojiGrayscalerWrapperRef.current.setNativeProps({ style });
    }
    return undefined;
  });

  const labelContainerStyle = useMappedValueWithCallbacks(
    animationState.label,
    (label): StyleProp<ViewStyle> =>
      Object.assign({}, styles.labelContainer, {
        opacity: label.opacity,
        transform: [{ scale: label.scale }],
      })
  );

  const labelContainerRef = useRef<View>(null);
  useValueWithCallbacksEffect(labelContainerStyle, (style) => {
    if (labelContainerRef.current !== null) {
      labelContainerRef.current.setNativeProps({ style });
    }
    return undefined;
  });

  const labelTextStyle = useMappedValueWithCallbacks(
    animationState.label,
    (label): StyleProp<ViewStyle> =>
      Object.assign({}, styles.labelText, {
        opacity: label.opacity,
      })
  );

  const labelTextRef = useRef<Text>(null);
  useValueWithCallbacksEffect(labelTextStyle, (style) => {
    if (labelTextRef.current !== null) {
      labelTextRef.current.setNativeProps({ style });
    }
    return undefined;
  });

  const labelExclamationWidth = useWritableValueWithCallbacks(() => 3);
  const labelExclamationStyle = useMappedValuesWithCallbacks(
    [animationState.label, labelExclamationWidth],
    (): StyleProp<ViewStyle> =>
      Object.assign({}, styles.labelText, styles.labelExclamation, {
        opacity: animationState.label.get().exclamationOpacity,
        marginRight: -labelExclamationWidth.get(),
      })
  );
  const labelExclamationRef = useRef<Text>(null);
  const labelExclamationOnLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event?.nativeEvent?.layout?.width;
      if (
        width === undefined ||
        typeof width !== 'number' ||
        isNaN(width) ||
        !isFinite(width) ||
        width < 0
      ) {
        return;
      }
      setVWC(labelExclamationWidth, width);
    },
    [labelExclamationWidth]
  );
  useValueWithCallbacksEffect(labelExclamationStyle, (style) => {
    const ref = labelExclamationRef.current;
    if (ref !== null) {
      ref.setNativeProps({ style });
    }
    return undefined;
  });

  return (
    <Pressable
      ref={containerRef}
      style={containerStyle.get()}
      onPress={onPress}
      onPressIn={() => setVWC(pressing, true)}
      onPressOut={() => setVWC(pressing, false)}
    >
      <SvgLinearGradientBackground
        state={emojiBackgroundVSP}
        containerStyle={Object.assign({}, styles.emoji, { width })}
      >
        <View
          style={emojiGrayscalerWrapperStyle.get()}
          ref={emojiGrayscalerWrapperRef}
        >
          <GrayscaledView
            strength={emojiGrayscaleStrengthVSP}
            style={{ type: 'react-rerender', props: styles.emojiGrayscaler }}
            child={{
              type: 'react-rerender',
              props: <Text style={styles.emojiInner}>{emoji}</Text>,
            }}
          />
        </View>
      </SvgLinearGradientBackground>
      <View ref={labelContainerRef} style={labelContainerStyle.get()}>
        <Text ref={labelTextRef} style={labelTextStyle.get()}>
          {label}
        </Text>
        <Text
          ref={labelExclamationRef}
          style={labelExclamationStyle.get()}
          onLayout={labelExclamationOnLayout}
        >
          !
        </Text>
      </View>
    </Pressable>
  );
};
