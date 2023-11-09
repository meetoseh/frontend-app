import { ReactElement, useCallback, useRef } from "react";
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import { Channel } from "./RequestNotificationTimeState";
import { useAnimatedValueWithCallbacks } from "../../../../shared/anim/useAnimatedValueWithCallbacks";
import {
  BezierAnimator,
  BezierColorAnimator,
  TrivialAnimator,
} from "../../../../shared/anim/AnimationLoop";
import { ease, easeOut, easeOutBack } from "../../../../shared/lib/Bezier";
import {
  fractionalColorToCss,
  makeSVGNumber,
} from "../../../../shared/anim/svgUtils";
import { setVWC } from "../../../../shared/lib/setVWC";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";
import { PartialIconForChannel } from "./partialIcons/PartialIconForChannel";
import { nameForChannel } from "./formatUtils";
import { styles } from "./ChannelIconStyles";
import * as SVG from "react-native-svg";
import { View, Text } from "react-native";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";

/**
 * The configurable properties when rendering an icon for a channel.
 */
type ChannelAnimationState = {
  /**
   * The first stop color on the background gradient, as 0-1 RGBA.
   */
  backgroundGradientStopColor1: [number, number, number, number];
  /**
   * The second stop color on the background gradient, as 0-1 RGBA.
   */
  backgroundGradientStopColor2: [number, number, number, number];
  /**
   * The stroke color of the actual icon, as 0-1 RGBA.
   */
  iconColor: [number, number, number, number];
  /**
   * The radius of the red dot is scaled by this factor. 1 for normal,
   * 0 for invisible. Negative values are clipped to 0.
   */
  dotScale: number;
  /**
   * Used as a hint to the rendering system for how far into an animation
   * we are, for performance
   */
  progress: number;
  /**
   * A trivially animated value to indicate the direction of the animation,
   * which is used to select the appropriate easing functions.
   */
  direction: number;
  /**
   * The opacity of the label, as a 0-1 value.
   */
  labelOpacity: number;
};

const activeGrad = {
  stop1: [87 / 255, 184 / 255, 162 / 255, 1] as const,
  stop2: [18 / 255, 127 / 255, 125 / 255, 1] as const,
};

const inactiveGrad = {
  stop1: [63 / 255, 72 / 255, 74 / 255, 1] as const,
  stop2: [63 / 255, 72 / 255, 74 / 255, 1] as const,
};

const getTargetChannelIconAnimationState = (
  active: boolean
): ChannelAnimationState => {
  if (active) {
    return {
      backgroundGradientStopColor1: [...activeGrad.stop1],
      backgroundGradientStopColor2: [...activeGrad.stop2],
      iconColor: [1, 1, 1, 1],
      dotScale: 1,
      progress: 1,
      direction: 1,
      labelOpacity: 1,
    };
  } else {
    return {
      backgroundGradientStopColor1: [...inactiveGrad.stop1],
      backgroundGradientStopColor2: [...inactiveGrad.stop2],
      iconColor: [200 / 255, 205 / 255, 208 / 255, 1],
      dotScale: 0,
      progress: 0,
      direction: 0,
      labelOpacity: 0,
    };
  }
};

/**
 * Renders the icon for the given channel. Has two versions for the active and
 * inactive state with a juicy animation between them. Includes a label beneath
 * the icon in the active state.
 */
export const ChannelIcon = ({
  active,
  channel,
}: {
  active: ValueWithCallbacks<boolean>;
  channel: Channel;
}): ReactElement => {
  const labelRef = useRef<Text>(null);
  const toRender = useWritableValueWithCallbacks<ChannelAnimationState>(() =>
    getTargetChannelIconAnimationState(false)
  );

  const target = useAnimatedValueWithCallbacks(
    () => getTargetChannelIconAnimationState(false),
    () => [
      new BezierColorAnimator(
        ease,
        500,
        (p) => p.backgroundGradientStopColor1,
        (p, v) => (p.backgroundGradientStopColor1 = v)
      ),
      new BezierColorAnimator(
        ease,
        500,
        (p) => p.backgroundGradientStopColor2,
        (p, v) => (p.backgroundGradientStopColor2 = v)
      ),
      new BezierColorAnimator(
        ease,
        500,
        (p) => p.iconColor,
        (p, v) => (p.iconColor = v)
      ),
      new BezierAnimator(
        easeOutBack,
        500,
        (p) => p.dotScale,
        (p, v) => (p.dotScale = v)
      ),
      new BezierAnimator(
        ease,
        500,
        (p) => p.labelOpacity,
        (p, v) => (p.labelOpacity = v)
      ),
      new BezierAnimator(
        easeOut,
        350,
        (p) => p.progress,
        (p, v) => (p.progress = v)
      ),
      new TrivialAnimator("direction"),
    ],
    (val) => {
      if (labelRef.current !== null) {
        labelRef.current.setNativeProps({
          opacity: val.labelOpacity,
        });
      }

      setVWC(toRender, val, () => false);
    }
  );

  const colorVWC = useMappedValueWithCallbacks(
    toRender,
    (t) => [...t.iconColor] as [number, number, number, number],
    {
      outputEqualityFn: () => false,
    }
  );

  const stopColorsVWC = useMappedValueWithCallbacks(
    toRender,
    (t) => ({
      stop1: [...t.backgroundGradientStopColor1],
      stop2: [...t.backgroundGradientStopColor2],
      progress: t.progress,
    }),
    {
      outputEqualityFn: () => false,
    }
  );

  const dotScaleVWC = useMappedValueWithCallbacks(toRender, (t) => t.dotScale, {
    outputEqualityFn: (a, b) => a === b,
  });

  useValueWithCallbacksEffect(
    active,
    useCallback(
      (act) => {
        setVWC(target, getTargetChannelIconAnimationState(act));
        return undefined;
      },
      [target]
    )
  );

  return (
    <View style={styles.channel}>
      <SVG.Svg viewBox="0 -23 128 128" width="93px" height="93px">
        <RenderGuardedComponent
          props={stopColorsVWC}
          component={(stops): ReactElement => (
            <SVG.Defs>
              <SVG.LinearGradient
                id="grad"
                gradientUnits="objectBoundingBox"
                x1="0.4577"
                y1="0.31122"
                x2="0.75376"
                y2="0.95651"
              >
                <SVG.Stop
                  stopColor={fractionalColorToCss(stops.stop1 as number[])}
                  stopOpacity={stops.stop1[3]}
                />
                <SVG.Stop
                  offset="1"
                  stopColor={fractionalColorToCss(stops.stop2 as number[])}
                  stopOpacity={stops.stop2[3]}
                />
              </SVG.LinearGradient>
            </SVG.Defs>
          )}
        />
        <SVG.Rect
          x="0"
          y="0"
          width="100"
          height="100"
          rx="10"
          fill="url(#grad)"
        />
        <RenderGuardedComponent
          props={dotScaleVWC}
          component={(scale) => (
            <SVG.Circle
              cx="99"
              cy="1"
              r={makeSVGNumber(14 * scale)}
              fill="red"
            />
          )}
        />
        {/* scaling the icon kills performance */}
        <PartialIconForChannel channel={channel} color={colorVWC} />
      </SVG.Svg>
      <Text
        style={{ ...styles.channelLabel, opacity: toRender.get().labelOpacity }}
        ref={labelRef}
      >
        {nameForChannel(channel, { capitalize: true })}
      </Text>
    </View>
  );
};
