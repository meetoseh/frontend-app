import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  image: {
    alignSelf: 'center',
  },
});
