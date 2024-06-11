import { PropsWithChildren, ReactElement, useEffect } from 'react';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { setVWC } from '../lib/setVWC';
import { convertLogicalWidthToPhysicalWidth } from '../images/DisplayRatioHelper';
import { useStyleVWC } from '../hooks/useStyleVWC';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { useReactManagedValueAsValueWithCallbacks } from '../hooks/useReactManagedValueAsValueWithCallbacks';
import { ScrollView, View, ViewStyle } from 'react-native';
import { RenderGuardedComponent } from './RenderGuardedComponent';

/**
 * The standard grid container for content. In nativ
 *
 * Typical vdom layout:
 * ```tsx
 * <GridFullscreenContainer>
 *   <GridContentContainer>
 *     <div>stuff</div>
 *   </GridContentContainer>
 * </GridFullscreenContainer>
 * ```
 */
export const GridContentContainer = ({
  contentWidthVWC,
  left,
  opacity,
  gridSizeVWC,
  noPointerEvents,
  scrollable,
  children,
}: PropsWithChildren<{
  contentWidthVWC: ValueWithCallbacks<number>;
  /**
   * The absolute size of the grid, usually windowSizeImmediate
   * For some god-awful reason grid-area 1 / 1 / -1 / -1 works for
   * the x-axis but chrome realllly wants to expand it on the y-axis
   */
  gridSizeVWC: ValueWithCallbacks<{ width: number; height: number }>;
  /** Left offset for slide transitions */
  left?: ValueWithCallbacks<number>;
  /** Opacity for fade transitions */
  opacity?: ValueWithCallbacks<number>;
  /** We always want to do this for consistency */
  justifyContent: 'flex-start';
  /** If true, disables pointer events on the container itself */
  noPointerEvents?: boolean;
  /** True to enable vertical scrolling, false to disable vertical scrolling */
  scrollable: boolean;
}>): ReactElement => {
  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);

  const containerTransitionState = useWritableValueWithCallbacks<{
    left: number;
    opacity: number;
  }>(() => ({
    left: left?.get() ?? 0,
    opacity: opacity?.get() ?? 1,
  }));

  useEffect(() => {
    if (left === undefined && opacity === undefined) {
      setVWC(containerTransitionState, { left: 0, opacity: 1 });
      return;
    }

    left?.callbacks.add(update);
    opacity?.callbacks.add(update);
    update();
    return () => {
      left?.callbacks.remove(update);
      opacity?.callbacks.remove(update);
    };

    function update() {
      setVWC(
        containerTransitionState,
        {
          left: left?.get() ?? 0,
          opacity: opacity?.get() ?? 1,
        },
        (a, b) => a.left === b.left && a.opacity === b.opacity
      );
    }
  }, [left, opacity, containerTransitionState]);

  const containerStyleVWC = useMappedValuesWithCallbacks(
    [
      containerTransitionState,
      gridSizeVWC,
      useReactManagedValueAsValueWithCallbacks(noPointerEvents),
    ],
    (): ViewStyle => {
      const transitionState = containerTransitionState.get();
      const leftValue = transitionState.left;
      const opacityValue = transitionState.opacity;

      const leftIsZero =
        convertLogicalWidthToPhysicalWidth(Math.abs(leftValue)) < 1;
      const opacityIsOne = opacityValue > 0.999;

      return {
        position: 'relative',
        left: leftIsZero ? 0 : leftValue,
        opacity: opacityIsOne ? 1 : opacityValue,
        width: gridSizeVWC.get().width,
        height: gridSizeVWC.get().height,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
      };
    }
  );
  useStyleVWC(containerRef, containerStyleVWC);

  const contentStyleVWC = useMappedValuesWithCallbacks(
    [gridSizeVWC, contentWidthVWC],
    (): ViewStyle => ({
      width: contentWidthVWC.get(),
      minHeight: gridSizeVWC.get().height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    })
  );
  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(contentRef, contentStyleVWC);

  return scrollable ? (
    <RenderGuardedComponent
      props={contentStyleVWC}
      component={(style) => (
        <ScrollView
          style={{ width: style.width, height: style.height }}
          contentContainerStyle={style}
        >
          {children}
        </ScrollView>
      )}
    />
  ) : (
    <View
      style={containerStyleVWC.get()}
      ref={(r) => setVWC(containerRef, r)}
      pointerEvents={noPointerEvents ? 'none' : 'auto'}
    >
      <View
        style={contentStyleVWC.get()}
        ref={(r) => setVWC(contentRef, r)}
        pointerEvents={noPointerEvents ? 'none' : 'auto'}
      >
        {children}
      </View>
    </View>
  );
};
