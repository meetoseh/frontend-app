import { useIsEffectivelyTinyScreen } from "../hooks/useIsEffectivelyTinyScreen";
import { useWindowSize } from "../hooks/useWindowSize";

/**
 * Returns the suggested width of the content area, after taking
 * into account horizontal padding.
 */
export const useContentWidth = (): number => {
  const windowSize = useWindowSize();
  const isEffectivelyTinyScreen = useIsEffectivelyTinyScreen();

  if (isEffectivelyTinyScreen) {
    return windowSize.width - 24;
  }

  return Math.min(windowSize.width - 24, 342);
};