import { StyleProp, TextStyle } from "react-native";

export type CustomButtonProps = {
  /**
   * True if the button is disabled, false otherwise. Default false. If
   * the button is disabled because we're loading/doing something, it's
   * usually good to also set the spinner prop to true.
   */
  disabled?: boolean;

  /**
   * True to show a spinner, false otherwise. Default false.
   */
  spinner?: boolean;

  /**
   * The function to call when the button is pressed
   */
  onPress?: () => void;

  /**
   * Sets the recommended style to use for the text in the button.
   * Unfortunately, since there is no true cascading style sheet, this
   * is the best we can do.
   */
  setTextStyle?: (style: StyleProp<TextStyle>) => void;

  /**
   * Sets the recommended foreground color for icons and text in the button.
   * This should be used if you have non-text elements in the button,
   * typically icons.
   */
  setForegroundColor?: (color: string) => void;

  /**
   * If specified, this button will have this width in pixels.
   */
  width?: number;

  /**
   * If specified, the button will have a margin on the top of this value.
   */
  marginTop?: number;
};
