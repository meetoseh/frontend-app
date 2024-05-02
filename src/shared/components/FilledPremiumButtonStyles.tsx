import { Platform, StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';
import { LinearGradientState } from '../anim/LinearGradientBackground';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    // @ts-ignore
    gradient: {
      stops: [
        { color: [90, 214, 173, 1], offset: 0 },
        { color: [47, 149, 193, 1], offset: 0.5521 },
        { color: [67, 98, 169, 1], offset: 0.9219 },
      ],
      angleDegreesClockwiseFromTop: 90,
      borderRadius: 28,
    } as LinearGradientState,
    borderRadius: 100,
    flex: undefined,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 56,

    ...Platform.select({
      ios: {
        shadowColor: Colors.BLACK_SHADOW,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 20,
        shadowColor: Colors.BLACK,
      },
    }),
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
    backgroundColor: Colors.GRAYSCALE_MID_GRAY,
  },

  disabledText: {
    color: Colors.GRAYSCALE_DARK_GRAY,
  },

  pressed: {
    backgroundColor: Colors.PRIMARY_LIGHT,
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
