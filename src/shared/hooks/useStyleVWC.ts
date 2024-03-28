import { View, ViewStyle } from 'react-native';
import { ValueWithCallbacks } from '../lib/Callbacks';
import { useValuesWithCallbacksEffect } from './useValuesWithCallbacksEffect';

/**
 * Assigns the given style to the given ref when it's available.
 */
export const useStyleVWC = (
  ref: ValueWithCallbacks<View | null>,
  style: ValueWithCallbacks<ViewStyle>
) => {
  useValuesWithCallbacksEffect([ref, style], () => {
    const ele = ref.get();
    const s = style.get();
    if (ele !== null) {
      ele.setNativeProps({ style: s });
    }
    return undefined;
  });
};
