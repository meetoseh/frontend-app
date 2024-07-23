import { StyleSheet } from 'react-native';
import * as Colors from '../../../styling/colors';

export const styles = StyleSheet.create({
  header: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 22,
    color: Colors.PRIMARY_LIGHT,
    textAlign: 'left',
  },
  body: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
    textAlign: 'left',
  },
  check: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
