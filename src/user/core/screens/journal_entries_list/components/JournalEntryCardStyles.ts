import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  centered: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  card: {
    minHeight: 292,
    backgroundColor: OsehColors.v4.primary.dark,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.charcoal,
    borderRadius: 10,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dateTimeText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.grey,
  },
  header: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: OsehColors.v4.primary.smoke,
    flexBasis: 0,
    flexGrow: 1,
  },
  body: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.smoke,
    flexBasis: 0,
    flexGrow: 1,
  },
  column: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  tag: {
    backgroundColor: OsehColors.v4.experimental.lighten5,
    borderRadius: 10,
  },
  abridgedBody: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.smoke,
    flexBasis: 0,
    flexGrow: 1,
  },
});
