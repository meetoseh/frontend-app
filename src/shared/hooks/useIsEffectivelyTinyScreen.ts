import { useWindowDimensions } from "react-native";

/**
 * Determines if we need to handle a potentially tiny effective
 * screen space in our layout. This generally happens when font
 * scaling or magnification is enabled on the device for accessibility
 * reasons.
 */
export const useIsEffectivelyTinyScreen = (): boolean => {
  const windowDimensions = useWindowDimensions();
  return windowDimensions.fontScale >= 1; /* TODO */
};
