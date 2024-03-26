import { ReactElement, useCallback, useRef } from 'react';
import { styles as whiteWideStyles } from './CheckboxStylesWhiteWide';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import * as SVG from 'react-native-svg';
import { STANDARD_ACTIVE_GRADIENT_SVG } from '../../styling/colors';
import { makeSVGNumber, simpleColorToCss } from '../anim/svgUtils';
import { useWritableValueWithCallbacks } from '../lib/Callbacks';
import { setVWC } from '../lib/setVWC';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { BezierAnimator } from '../anim/AnimationLoop';
import { useAnimatedValueWithCallbacks } from '../anim/useAnimatedValueWithCallbacks';
import { ease } from '../lib/Bezier';
import { SvgColorStop } from '../anim/SvgLinearGradient';

type CheckboxProps = {
  /**
   * The current value of the checkbox
   */
  value: boolean;

  /**
   * Used to set the value of the checkbox
   */
  setValue: (value: boolean) => void;

  /**
   * The label to display next to the checkbox.
   */
  label: string | ReactElement;

  /**
   * Whether the checkbox is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional styles applied to the container. Usually, it's best
   * to add padding here rather in a wrapper to ensure the padding is
   * included in the hitbox.
   */
  containerStyle?: ViewStyle;

  /**
   * The style of the checkbox
   * @default 'whiteWide'
   */
  checkboxStyle?: 'whiteWide' | 'whiteWideRound';
};

/**
 * A checkbox with a label
 */
export const Checkbox = (props: CheckboxProps): ReactElement => {
  return <WhiteWideCheckbox {...props} />;
};

const WhiteWideCheckbox = ({
  value,
  setValue,
  label,
  containerStyle,
  disabled = false,
  checkboxStyle = 'whiteWide',
}: CheckboxProps): ReactElement => {
  const styles = whiteWideStyles;

  const containerRef = useRef<View>(null);
  const stylesTarget = useAnimatedValueWithCallbacks<{ bkndOpacity: number }>(
    () => ({ bkndOpacity: 0 }),
    () => [
      new BezierAnimator(
        ease,
        350,
        (t) => t.bkndOpacity,
        (t, v) => (t.bkndOpacity = v)
      ),
    ],
    (val) => {
      const ref = containerRef.current;
      if (ref !== null) {
        ref.setNativeProps({
          style: Object.assign(
            {},
            styles.container,
            {
              backgroundColor: `rgba(255, 255, 255, ${val.bkndOpacity})`,
            },
            containerStyle
          ),
        });
      }
    }
  );

  const pressingVWC = useWritableValueWithCallbacks(() => false);
  const cancelPressInAnimTimeout = useRef<NodeJS.Timeout | null>(null);
  const handlePressIn = useCallback(() => {
    if (cancelPressInAnimTimeout.current !== null) {
      clearTimeout(cancelPressInAnimTimeout.current);
      cancelPressInAnimTimeout.current = null;
    }
    setVWC(pressingVWC, true);
  }, [pressingVWC]);

  const handlePressOut = useCallback(() => {
    if (cancelPressInAnimTimeout.current !== null) {
      clearTimeout(cancelPressInAnimTimeout.current);
    }
    cancelPressInAnimTimeout.current = setTimeout(() => {
      setVWC(pressingVWC, false);
    }, 500);
  }, [pressingVWC]);

  useValueWithCallbacksEffect(pressingVWC, (p) => {
    setVWC(stylesTarget, { bkndOpacity: p ? 0.1 : 0 });
    return undefined;
  });

  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }

    setValue(!value);
  }, [setValue, value, disabled]);

  const round = checkboxStyle === 'whiteWideRound';

  return (
    <Pressable
      style={Object.assign(
        {},
        styles.container,
        {
          backgroundColor: `rgba(255, 255, 255, ${
            stylesTarget.get().bkndOpacity
          })`,
        },
        containerStyle
      )}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      ref={containerRef}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.iconContainer}>
        {value ? (
          <CheckedIcon
            width={styles.icon.width}
            height={styles.icon.height}
            round={round}
          />
        ) : (
          <UncheckedIcon
            width={styles.icon.width}
            height={styles.icon.height}
            round={round}
          />
        )}
      </View>
    </Pressable>
  );
};

const CheckedIcon = ({
  round,
  ...props
}: SVG.SvgProps & { round: boolean }): ReactElement => {
  const grad = STANDARD_ACTIVE_GRADIENT_SVG;
  const svgn = makeSVGNumber;
  const width = 20;
  const height = 20;

  const stops: SvgColorStop[] =
    grad.stops !== undefined ? grad.stops : [grad.stop1, grad.stop2];
  const stopElements: ReactElement[] = stops.map((stop, i) => (
    <SVG.Stop
      key={i}
      offset={svgn(stop.offset)}
      stopColor={simpleColorToCss(stop.color)}
      stopOpacity={stop.color[3]}
    />
  ));

  return (
    <SVG.Svg
      width={svgn(width)}
      height={svgn(height)}
      viewBox={`0 0 ${svgn(width)} ${svgn(height)}`}
      {...props}
    >
      <SVG.Defs>
        <SVG.LinearGradient
          id="grad"
          gradientUnits="objectBoundingBox"
          x1={svgn(grad.x1)}
          y1={svgn(grad.y1)}
          x2={svgn(grad.x2)}
          y2={svgn(grad.y2)}
        >
          {stopElements}
        </SVG.LinearGradient>
      </SVG.Defs>
      <SVG.Rect
        x="0.5"
        y="0.5"
        width={svgn(width - 1)}
        height={svgn(height - 1)}
        rx={svgn(round ? width / 2 : width * 0.25)}
        ry={svgn(round ? height / 2 : height * 0.25)}
        fill="url(#grad)"
        stroke="none"
      />
      <SVG.G transform={round ? 'translate(-0.75, 0)' : undefined}>
        <SVG.Path
          d="M4.66602 10.20911L8.43725 13.9803L15.9797 6.43787"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit="10"
          fill="none"
        />
      </SVG.G>
    </SVG.Svg>
  );
};

const UncheckedIcon = ({
  round,
  ...props
}: SVG.SvgProps & { round: boolean }): ReactElement => {
  return (
    <SVG.Svg width="20" height="20" viewBox="0 0 20 20" {...props}>
      <SVG.Rect
        x="0.5"
        y="0.5"
        width="19"
        height="19"
        rx={round ? '9.5' : '5'}
        ry={round ? '9.5' : '5'}
        fill="none"
        stroke="#8C8C8C"
        strokeWidth="1"
        strokeMiterlimit="10"
        strokeLinejoin="round"
      />
    </SVG.Svg>
  );
};
