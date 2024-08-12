import { ReactElement, useCallback } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTopBarHeight } from '../hooks/useTopBarHeight';
import { styles } from './CloseButtonStyles';
import * as Colors from '../../styling/colors';
import { OsehColors } from '../OsehColors';
import { Close } from './icons/Close';

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
          icon={{ width: 14 }}
          container={{ width: 14, height: 14 }}
          startPadding={{
            x: { fraction: 0.5 },
            y: { fraction: 0.5 },
          }}
          color={
            variant === 'dark'
              ? OsehColors.v4.primary.dark
              : OsehColors.v4.primary.light
          }
        />
      </Pressable>
    </View>
  );
};
