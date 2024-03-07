import { StyleSheet } from 'react-native';
import * as Colors from '../../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  title: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    color: Colors.GRAYSCALE_WHITE,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_MID_GRAY,
    marginBottom: 8,
  },
});
