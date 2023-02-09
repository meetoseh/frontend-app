import { ReactElement, useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useTopBarHeight } from '../hooks/useTopBarHeight';
import { styles } from './CloseButtonStyles';
import Close from '../icons/Close';

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
};

/**
 * A close button at the top-right of the screen.
 */
export const CloseButton = ({ disabled, onPress }: CloseButtonProps): ReactElement => {
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
        top: Platform.select({
          android: topBarHeight, // because it's translucent, looks a little further from top than it is
          default: topBarHeight + 8,
        }),
      },
      ...(pressing ? [styles.containerPressed] : []),
      ...(disabled ? [styles.containerDisabled] : [])
    );
  }, [topBarHeight, pressing, disabled]);

  return (
    <View style={containerStyle}>
      <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={styles.paddingStyle}>
          <Close width={14} height={14} />
        </View>
      </Pressable>
    </View>
  );
};
