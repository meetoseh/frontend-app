import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  header: {
    textAlign: 'left',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
  },
  message: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  sectionTitle: {
    textAlign: 'left',
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
});
