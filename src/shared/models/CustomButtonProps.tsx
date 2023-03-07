import { StyleProp, TextStyle } from 'react-native';

export type CustomButtonProps = {
  /**
   * True if the button is disabled, false otherwise. Default false.
   */
  disabled?: boolean;

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
   * Sets the recommended height for the button. Useful as a maxHeight for the
   * container, since otherwise flex: '1' will cause the button to be as tall
   * as possible.
   */
  setHeight?: (height: number) => void;

  /**
   * If set to true, the container will use the screen size to determine its width,
   * with appropriate padding on the left and right. Default false.
   */
  fullWidth?: boolean;

  /**
   * If specified, the button will have a margin on the top of this value.
   */
  marginTop?: number;
};
