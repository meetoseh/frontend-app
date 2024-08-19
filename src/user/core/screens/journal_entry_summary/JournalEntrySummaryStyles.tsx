import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  error: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 2,
    color: OsehColors.v4.experimental.lightError,
  },
  title: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  column: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  tag: {
    backgroundColor: OsehColors.v4.experimental.lighten5,
    borderRadius: 10,
  },
  inputWrapper: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 28,
    padding: 16,
  },
  inputText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
});
