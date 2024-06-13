import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  shareHeader: {
    padding: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  shareTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    color: Colors.PRIMARY_LIGHT,
  },
  shareInstructor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  shareActions: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
});
