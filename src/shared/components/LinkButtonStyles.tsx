import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.TRANSPARENT,
    borderRadius: 100,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    maxHeight: 56,
  },

  disabled: {
    backgroundColor: Colors.GRAYSCALE_MID_GRAY,
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
    letterSpacing: 0.25,
    lineHeight: 24,
  },
});