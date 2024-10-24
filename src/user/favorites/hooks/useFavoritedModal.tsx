import { useCallback, useRef } from 'react';
import { useBeforeTime } from '../../../shared/hooks/useBeforeTime';
import {
  Modals,
  addModalWithCallbackToRemove,
} from '../../../shared/contexts/ModalContext';
import { styles } from './useFavoritedModalStyles';
import { useTimedFade } from '../../../shared/hooks/useTimedFade';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../../../shared/anim/VariableStrategyProps';
import { useValuesWithCallbacksEffect } from '../../../shared/hooks/useValuesWithCallbacksEffect';
import { useWindowSize } from '../../../shared/hooks/useWindowSize';
import { View, Text } from 'react-native';
import FullGreenHeart from '../icons/FullGreenHeart';
import { WritableValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { useTopBarHeight } from '../../../shared/hooks/useTopBarHeight';
import { useValueWithCallbacksEffect } from '../../../shared/hooks/useValueWithCallbacksEffect';

/**
 * Shows a basic popup at the top of the screen the a message like
 * "Added to your favorites" while the value is set and the current
 * time is before the specified time in milliseconds since the epoch.
 */
export const useFavoritedModal = (
  showUntilVariableStrategy: VariableStrategyProps<number | undefined>,
  modals: WritableValueWithCallbacks<Modals>
) => {
  const showUntilVWC = useVariableStrategyPropsAsValueWithCallbacks(
    showUntilVariableStrategy
  );
  const showVWC = useBeforeTime(showUntilVariableStrategy);

  useValuesWithCallbacksEffect(
    [showUntilVWC, showVWC],
    useCallback(() => {
      const showUntil = showUntilVWC.get();
      const show = showVWC.get();
      if (!show || showUntil === undefined) {
        return;
      }

      return addModalWithCallbackToRemove(modals, <Modal until={showUntil} />);
    }, [modals, showUntilVWC, showVWC])
  );
};

const Modal = ({ until }: { until: number }) => {
  const containerRef = useRef<View>(null);
  const windowSize = useWindowSize();
  const topBarHeight = useTopBarHeight();

  const opacity = useTimedFade(until);

  const createStyle = useCallback(
    () => ({
      ...styles.container,
      top: 24 + topBarHeight,
      width: windowSize.width - 80,
      opacity: opacity.get(),
    }),
    [topBarHeight, windowSize.width, opacity]
  );

  useValueWithCallbacksEffect(
    opacity,
    useCallback((): undefined => {
      containerRef.current?.setNativeProps({ style: createStyle() });
    }, [createStyle])
  );

  return (
    <View style={createStyle()} ref={containerRef}>
      <View style={styles.innerContainer}>
        <FullGreenHeart />
        <Text style={styles.text}>Added to your favorites</Text>
      </View>
    </View>
  );
};
