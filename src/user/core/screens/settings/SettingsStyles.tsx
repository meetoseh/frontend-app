import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  footer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  version: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
});
