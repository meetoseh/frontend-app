import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    maxWidth: 245,
    alignSelf: 'center',
    color: Colors.PRIMARY_LIGHT,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  check: {
    alignSelf: 'center',
  },
});
