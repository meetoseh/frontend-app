import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  messages: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
  },
  message: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  legal: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: Colors.GRAYSCALE_MID_GRAY,
    textAlign: 'justify',
  },
  legalLink: {
    color: Colors.WHITE,
    textDecorationColor: Colors.WHITE,
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
  },
});
