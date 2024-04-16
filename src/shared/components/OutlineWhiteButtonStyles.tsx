import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.TRANSPARENT,
    borderColor: Colors.WHITE,
    borderRadius: 100,
    borderStyle: 'solid',
    borderWidth: 2,
    flex: undefined,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 56,
  },

  containerWithSpinner: {
    position: 'relative',
  },

  spinnerContainer: {
    position: 'absolute',
    top: 16,
    left: 13,
  },

  disabled: {
    borderColor: Colors.GRAYSCALE_DARK_GRAY,
  },

  disabledText: {
    color: Colors.GRAYSCALE_DARK_GRAY,
  },

  pressed: {
    backgroundColor: Colors.TRANSPARENT_BLACK,
  },

  pressedText: {
    color: Colors.WHITE,
  },

  text: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
});

export const thinStyles = StyleSheet.create({
  container: { ...styles.container, minHeight: 36, paddingHorizontal: 14 },
  containerWithSpinner: styles.containerWithSpinner,
  spinnerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: styles.disabled,
  disabledText: styles.disabledText,
  pressed: styles.pressed,
  pressedText: styles.pressedText,
  text: {
    ...styles.text,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
    lineHeight: 17,
  },
});
