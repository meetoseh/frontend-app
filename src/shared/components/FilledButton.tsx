import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useStateCompat as useState } from "../hooks/useStateCompat";
import { Pressable, TextStyle, View, ViewStyle } from "react-native";
import { CustomButtonProps } from "../models/CustomButtonProps";
import { useWindowSize } from "../hooks/useWindowSize";
import { InlineOsehSpinner } from "./InlineOsehSpinner";

/**
 * A basic filled button using the given styles.
 */
export const FilledButton = ({
  onPress,
  disabled,
  spinner,
  setTextStyle,
  setForegroundColor,
  styles,
  spinnerVariant,
  fullWidth,
  marginTop,
  children,
}: PropsWithChildren<
  CustomButtonProps & {
    styles: {
      container: ViewStyle & { flex: undefined };
      pressed: ViewStyle;
      disabled: ViewStyle;
      text: TextStyle & { color: string };
      pressedText: TextStyle & { color: string };
      disabledText: TextStyle & { color: string };
      containerWithSpinner: ViewStyle;
      spinnerContainer: ViewStyle;
    };
    spinnerVariant: "white" | "black" | "primary";
  }
>): ReactElement => {
  const screenSize = useWindowSize();
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress?.();
    }
  }, [onPress, disabled]);

  const [pressed, setPressed] = useState(false);

  const handlePressIn = useCallback(() => {
    setPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setPressed(false);
  }, []);

  const containerStyles = useMemo(() => {
    let fullWidthMargin = 24;
    if (screenSize.width - fullWidthMargin * 2 > 400) {
      fullWidthMargin = Math.floor((screenSize.width - 400) / 2);
    }
    return Object.assign(
      {},
      styles.container,
      ...(fullWidth
        ? [
            {
              width: screenSize.width - fullWidthMargin * 2,
              marginLeft: fullWidthMargin,
              marginRight: fullWidthMargin,
            },
          ]
        : []),
      ...(marginTop ? [{ marginTop }] : []),
      ...(pressed ? [styles.pressed] : []),
      ...(disabled ? [styles.disabled] : []),
      ...(spinner ? [styles.containerWithSpinner] : [])
    );
  }, [pressed, disabled, styles, screenSize.width, fullWidth, marginTop]);

  useEffect(() => {
    if (!setTextStyle) {
      return;
    }

    setTextStyle(
      Object.assign(
        {},
        styles.text,
        ...(pressed ? [styles.pressedText] : []),
        ...(disabled ? [styles.disabledText] : [])
      )
    );
  }, [pressed, disabled, setTextStyle, styles]);

  useEffect(() => {
    if (!setForegroundColor) {
      return;
    }

    if (disabled) {
      setForegroundColor(styles.disabledText.color);
      return;
    }

    if (pressed) {
      setForegroundColor(styles.pressedText.color);
      return;
    }

    setForegroundColor(styles.text.color);
  }, [pressed, disabled, setForegroundColor, styles]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={containerStyles}
    >
      {spinner && (
        <View style={styles.spinnerContainer}>
          <InlineOsehSpinner
            size={{ type: "react-rerender", props: { height: 24 } }}
            variant={spinnerVariant}
          />
        </View>
      )}
      {children}
    </Pressable>
  );
};
