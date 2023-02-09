import { PropsWithChildren, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, TextStyle, ViewStyle } from 'react-native';
import { CustomButtonProps } from '../models/CustomButtonProps';

/**
 * A basic filled button using the given styles.
 */
export const FilledButton = ({
  onPress,
  disabled,
  setTextStyle,
  setForegroundColor,
  setHeight,
  styles,
  children,
}: PropsWithChildren<
  CustomButtonProps & {
    styles: {
      container: ViewStyle & { maxHeight: number };
      pressed: ViewStyle;
      disabled: ViewStyle;
      text: TextStyle & { color: string };
      pressedText: TextStyle & { color: string };
      disabledText: TextStyle & { color: string };
    };
  }
>): ReactElement => {
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
    return Object.assign(
      {},
      styles.container,
      ...(pressed ? [styles.pressed] : []),
      ...(disabled ? [styles.disabled] : [])
    );
  }, [pressed, disabled, styles]);

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

  useEffect(() => {
    if (!setHeight) {
      return;
    }

    setHeight(styles.container.maxHeight);
  }, [setHeight, styles]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={containerStyles}>
      {children}
    </Pressable>
  );
};
