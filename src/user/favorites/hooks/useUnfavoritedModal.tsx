import { useCallback, useMemo, useRef } from "react";
import { useBeforeTime } from "../../../shared/hooks/useBeforeTime";
import {
  Modals,
  addModalWithCallbackToRemove,
} from "../../../shared/contexts/ModalContext";
import { styles } from "./useFavoritedModalStyles";
import { useTimedFade } from "../../../shared/hooks/useTimedFade";
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from "../../../shared/anim/VariableStrategyProps";
import { useValuesWithCallbacksEffect } from "../../../shared/hooks/useValuesWithCallbacksEffect";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";
import { View, Text } from "react-native";
import { WritableValueWithCallbacks } from "../../../shared/lib/Callbacks";
import { useTopBarHeight } from "../../../shared/hooks/useTopBarHeight";
import RedX from "../icons/RedX";

/**
 * Shows a basic popup at the top of the screen the a message like
 * "Removed from your favorites" while the value is set and the current
 * time is before the specified time in milliseconds since the epoch.
 */
export const useUnfavoritedModal = (
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

  const baseContainerStyle = useMemo(
    () => ({
      ...styles.container,
      top: 24 + topBarHeight,
      width: windowSize.width - 80,
    }),
    [windowSize.width, topBarHeight]
  );

  useTimedFade(containerRef, baseContainerStyle, until);

  return (
    <View style={baseContainerStyle} ref={containerRef}>
      <View style={styles.innerContainer}>
        <RedX />
        <Text style={styles.text}>Removed from your favorites</Text>
      </View>
    </View>
  );
};
