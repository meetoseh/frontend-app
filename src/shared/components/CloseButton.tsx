import { ReactElement, useCallback, useMemo } from 'react';
import { useStateCompat as useState } from '../hooks/useStateCompat';
import { Platform, Pressable, View, ViewStyle } from 'react-native';
import { useTopBarHeight } from '../hooks/useTopBarHeight';
import { styles } from './CloseButtonStyles';
import Close from '../icons/Close';
import * as Colors from '../../styling/colors';
import { useWritableValueWithCallbacks } from '../lib/Callbacks';

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
  variant?: 'light' | 'dark';
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
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress?.();
    }
  }, [onPress, disabled]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={Object.assign({}, styles.pressable, {
          paddingTop: styles.pressable.paddingTop + topBarHeight,
        })}
      >
        <Close
          width={14}
          height={14}
          fill={variant === 'dark' ? Colors.GRAYSCALE_DARK_GRAY : Colors.WHITE}
        />
      </Pressable>
    </View>
  );
};
