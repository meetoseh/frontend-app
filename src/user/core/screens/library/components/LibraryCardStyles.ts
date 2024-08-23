import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.charcoal,
    borderRadius: 10,
    backgroundColor: OsehColors.v4.primary.dark,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
  instructor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.grey,
  },
  duration: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.grey,
  },
  column: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  growNoBasis: {
    flexGrow: 1,
    flexBasis: 0,
  },
  badge: {
    backgroundColor: OsehColors.v4.primary.darkGrey,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.light,
  },
});
