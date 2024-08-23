import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  cta: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'center',
  },
  label: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.smoke,
  },
  error: {
    padding: 12,
    backgroundColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 10,
  },
  errorText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.experimental.lightError,
  },
});
