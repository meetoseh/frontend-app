import { Platform, StyleSheet } from 'react-native';
import * as Colors from '../../../styling/colors';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: Colors.TRANSPARENT,
  },
  buttonPressed: {},
  emojiBackground: {
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiInner: {
    fontSize: Platform.select({
      ios: 28,
      android: 24,
    }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  labelText: {
    color: Colors.GRAYSCALE_MID_GRAY,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  labelExclamation: {},
});
