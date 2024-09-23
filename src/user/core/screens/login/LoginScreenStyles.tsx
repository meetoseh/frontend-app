import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  message: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
    textAlign: 'center',
  },
});
