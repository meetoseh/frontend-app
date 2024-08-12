import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  questionError: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 22,
    color: OsehColors.v4.experimental.lightError,
  },
  question: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 22,
    color: OsehColors.v4.primary.light,
  },
  hint: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.grey,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spinner: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
