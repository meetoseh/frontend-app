import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  back: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  header: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 28,
    color: Colors.PRIMARY_LIGHT,
  },
  emotion: {
    textAlign: 'center',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 28,
    color: Colors.WHITE,
    textTransform: 'capitalize',
    textShadowColor: '#ffffff80',
    textShadowRadius: 16,
  },
  subheader: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
});
