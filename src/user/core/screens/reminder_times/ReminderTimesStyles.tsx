import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  backWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    textAlign: 'center',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
  },
  description: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
});
