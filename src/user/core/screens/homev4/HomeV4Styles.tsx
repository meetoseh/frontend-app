import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
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
  headline: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: OsehColors.v4.primary.light,
  },
  subheadline: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
  subheadlineQuote: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
  subheadlineAuthor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.smoke,
  },
  bottomButton: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 28,
    backgroundColor: OsehColors.v4.primary.dark,
  },
  checkinButton: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.darkGrey,
    borderRadius: 28,
    backgroundColor: OsehColors.v4.primary.dark,
    flexGrow: 5,
  },
  checkinText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
});
