import { ReactElement } from "react";
import { ValueWithCallbacks } from "../lib/Callbacks";
import { OsehImageState } from "./OsehImageState";
import { useUnwrappedValueWithCallbacks } from "../hooks/useUnwrappedValueWithCallbacks";
import { ImageStyle, StyleProp } from "react-native";
import { OsehImageFromState } from "./OsehImageFromState";

/**
 * Renders a single image state specified as a ValueWithCallbacks. This will
 * never trigger rerenders and does not require that the parent component
 * rerender. In animation-heavy components or when image state has been lifted
 * such as in Features, this is a significant performance improvement compared to
 * OsehImageFromState.
 *
 * For example, if clicking a button plays an animation and loads an image, the
 * animation could be completely untenable if the image is loaded using
 * useOsehImageState, as during the phases of the image loading it will cause
 * react rerenders which will stall the animation. This is particularly true
 * on mobile devices or high-frequency displays. In general, there should be no
 * react rerenders while animating, but delaying image loading until after the
 * animation is also undesirable: the animation is meant to hide the loading
 * times!
 */
export const OsehImageFromStateValueWithCallbacks = ({
  state,
  style,
}: {
  state: ValueWithCallbacks<OsehImageState>;
  /**
   * Additional styles to apply to the image. Should not include a width
   * or height, as these are set by the image state.
   */
  style?: StyleProp<ImageStyle>;
}): ReactElement => {
  const unwrappedState = useUnwrappedValueWithCallbacks(state);
  return <OsehImageFromState state={unwrappedState} style={style} />;
};
