import { useMappedValueWithCallbacks } from './useMappedValueWithCallbacks';
import { useUnwrappedValueWithCallbacks } from './useUnwrappedValueWithCallbacks';
import { useWindowSizeValueWithCallbacks } from './useWindowSize';

export const useFontScale = (): number => {
  return useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(
      useWindowSizeValueWithCallbacks(),
      (size) => size.fontScale
    )
  );
};
