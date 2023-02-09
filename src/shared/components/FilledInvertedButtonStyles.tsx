import { Platform, StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderRadius: 100,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    maxHeight: 56,

    ...Platform.select({
      ios: {
        shadowColor: Colors.BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 20,
        shadowColor: Colors.BLACK,
      },
    }),
  },

  disabled: {
    backgroundColor: Colors.GRAYSCALE_MID_GRAY,
  },

  disabledText: {
    color: Colors.GRAYSCALE_DARK_GRAY,
  },

  pressed: {
    backgroundColor: Colors.GRAYSCALE_LIGHT_GRAY,
  },

  pressedText: {
    color: Colors.PRIMARY_DEFAULT,
  },

  text: {
    color: Colors.PRIMARY_DEFAULT,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 24,
  },
});
