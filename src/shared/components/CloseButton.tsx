import { ReactElement, useCallback, useMemo } from "react";
import { useStateCompat as useState } from "../hooks/useStateCompat";
import { Platform, Pressable, View, ViewStyle } from "react-native";
import { useTopBarHeight } from "../hooks/useTopBarHeight";
import { styles } from "./CloseButtonStyles";
import Close from "../icons/Close";
import * as Colors from "../../styling/colors";

type CloseButtonProps = {
  /**
   * Whether the button is disabled or not
   * Default false
   */
  disabled?: boolean;

  /**
   * The function to call when the button is pressed
   */
  onPress?: () => void;

  /**
   * Additional styles to apply to the button container, e.g., opacity
   */
  bonusStyle?: ViewStyle;

  /**
   * The icon variant to use.
   * @default 'light'
   */
  variant?: "light" | "dark";
};

/**
 * A close button at the top-right of the screen.
 */
export const CloseButton = ({
  disabled,
  variant,
  onPress,
  bonusStyle,
}: CloseButtonProps): ReactElement => {
  const topBarHeight = useTopBarHeight();
  const [pressing, setPressing] = useState(false);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress?.();
    }
  }, [onPress, disabled]);

  const handlePressIn = useCallback(() => {
    setPressing(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setPressing(false);
  }, []);

  const containerStyle = useMemo(() => {
    return Object.assign(
      {},
      styles.container,
      {
        top: topBarHeight + 8,
      },
      ...(pressing ? [styles.containerPressed] : []),
      ...(disabled ? [styles.containerDisabled] : []),
      bonusStyle
    );
  }, [topBarHeight, pressing, disabled, bonusStyle]);

  return (
    <View style={containerStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.paddingStyle}>
          <Close
            width={14}
            height={14}
            fill={
              variant === "dark" ? Colors.GRAYSCALE_DARK_GRAY : Colors.WHITE
            }
          />
        </View>
      </Pressable>
    </View>
  );
};
