import { useWindowSize } from "../hooks/useWindowSize";

/**
 * Returns if we're running on an iPad or other tablet with a particularly large
 * viewport
 */
export const useIsTablet = (): boolean => {
  const windowSize = useWindowSize();
  return windowSize.width > 700 && windowSize.height > 700;
};
