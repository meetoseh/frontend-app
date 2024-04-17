import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { StandardScreenTransitionState } from '../hooks/useStandardTransitions';
import { ReactElement } from 'react';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { useWindowSizeValueWithCallbacks } from '../hooks/useWindowSize';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { View, ViewStyle } from 'react-native';
import { useWritableValueWithCallbacks } from '../lib/Callbacks';
import {
  SvgLinearGradient,
  SvgLinearGradientState,
} from '../anim/SvgLinearGradient';
import { STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG } from '../../styling/colors';
import { styles } from './WipeTransitionOverlayStyles';
import { setVWC } from '../lib/setVWC';
import { useStyleVWC } from '../hooks/useStyleVWC';
import { interpolateColor } from '../lib/BezierAnimation';

export type WipeTransitionOverlayProps = Pick<
  StandardScreenTransitionState,
  'wipe'
>;

/**
 * Places itself at the appropriate size and location using the window
 * size and position: 'absolute' to cover the nearest relative parent,
 * whose size must exactly match the window size.
 */
export const WipeTransitionOverlay = ({
  wipe,
}: WipeTransitionOverlayProps): ReactElement => {
  const neededVWC = useMappedValueWithCallbacks(wipe, (w) => w !== null);

  return (
    <RenderGuardedComponent
      props={neededVWC}
      component={(needed) =>
        !needed ? <></> : <WipeTransitionOverlayNeeded wipe={wipe} />
      }
    />
  );
};

const WipeTransitionOverlayNeeded = ({
  wipe,
}: WipeTransitionOverlayProps): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();

  const directionVWC = useMappedValueWithCallbacks(
    wipe,
    (w) => w?.direction ?? 'up'
  );

  // we reparameterize the wipe to account for a faded edge
  // instead of height from 0 to 1, its height from -0.25 to 1
  const hardHeightTopVWC = useMappedValueWithCallbacks(wipe, (w) => {
    const time = w?.heightPercentage ?? 0;
    return time * 1.25 - 0.25;
  });

  const hardHeightTopClippedVWC = useMappedValueWithCallbacks(
    hardHeightTopVWC,
    (h) => Math.max(0, h)
  );

  const hardHeightContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const hardHeightContainerStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, directionVWC, hardHeightTopClippedVWC],
    (): ViewStyle => {
      const size = windowSizeVWC.get();
      const hardHeight = hardHeightTopClippedVWC.get();
      const direction = directionVWC.get();

      return {
        top: direction === 'up' ? 0 : undefined,
        bottom: direction === 'down' ? 0 : undefined,
        left: 0,
        right: 0,
        height: size.height * hardHeight,
      };
    }
  );
  useStyleVWC(hardHeightContainerRef, hardHeightContainerStyleVWC);

  const gradientContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const gradientStyleVWC = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size): ViewStyle => ({
      width: size.width,
      height: size.height,
    })
  );
  useStyleVWC(gradientContainerRef, gradientStyleVWC);

  const bottomGradientContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const bottomGradientStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, hardHeightTopVWC, directionVWC],
    (): ViewStyle => {
      const size = windowSizeVWC.get();
      const hardHeight = hardHeightTopVWC.get();
      const direction = directionVWC.get();

      return {
        position: 'absolute',
        width: size.width,
        height: size.height * 0.2,
        top: direction === 'up' ? hardHeight * size.height : undefined,
        bottom: direction === 'down' ? hardHeight * size.height : undefined,
        display: 'flex',
      };
    }
  );
  useStyleVWC(bottomGradientContainerRef, bottomGradientStyleVWC);

  const bottomGradientStateVWC = useMappedValuesWithCallbacks(
    [hardHeightTopVWC, directionVWC],
    (): SvgLinearGradientState => {
      const hardHeight = hardHeightTopVWC.get();
      const direction = directionVWC.get();

      const startColor = (() => {
        const stop1 = [20, 25, 28]; // at the top
        const stop2 = [1, 1, 1]; // at the bottom

        const fromTop = direction === 'up' ? hardHeight : 1 - hardHeight;
        if (fromTop <= 0) {
          return stop1;
        }
        if (fromTop >= 1) {
          return stop2;
        }
        return interpolateColor(stop1, stop2, fromTop);
      })();

      return {
        stop1: {
          color: [startColor[0], startColor[1], startColor[2], 1],
          offset: 0,
        },
        stop2: { color: [0, 0, 0, 0], offset: 1 },
        x1: 0.5,
        y1: direction === 'up' ? 0 : 1,
        x2: 0.5,
        y2: direction === 'up' ? 1 : 0,
      };
    }
  );

  return (
    <>
      <View
        style={Object.assign(
          {},
          styles.container,
          hardHeightContainerStyleVWC.get()
        )}
        ref={(r) => setVWC(hardHeightContainerRef, r)}
      >
        <View
          style={Object.assign(
            {},
            styles.gradientContainer,
            gradientStyleVWC.get()
          )}
          ref={(r) => setVWC(gradientContainerRef, r)}
        >
          <SvgLinearGradient state={STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG} />
        </View>
      </View>
      <View
        style={Object.assign(
          {},
          styles.gradientContainer,
          bottomGradientStyleVWC.get()
        )}
        ref={(r) => setVWC(bottomGradientContainerRef, r)}
      >
        <RenderGuardedComponent
          props={bottomGradientStateVWC}
          component={(state) => <SvgLinearGradient state={state} />}
        />
      </View>
    </>
  );
};
