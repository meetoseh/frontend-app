import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 24,
    paddingRight: 24,
  },
  text: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
  },
  title: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    letterSpacing: 0.25,
    lineHeight: 28,
    textAlign: 'center',
  },
});
