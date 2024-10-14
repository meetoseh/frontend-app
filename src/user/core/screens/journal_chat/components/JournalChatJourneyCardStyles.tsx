import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  topForegroundPaid: {
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 4,
    backgroundColor: '#191c1d80',
    borderRadius: 4,
  },
  bottom: {
    backgroundColor: OsehColors.v4.primary.dark,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingTop: 14.5,
    paddingRight: 16,
    paddingBottom: 14.5,
    paddingLeft: 16,
  },
});
