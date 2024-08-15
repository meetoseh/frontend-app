import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 17,
    color: OsehColors.v4.primary.light,
  },
  instructorText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.smoke,
  },
});
