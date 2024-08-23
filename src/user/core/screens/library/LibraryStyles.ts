import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../shared/OsehColors';

export const styles = StyleSheet.create({
  cta: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'center',
  },
  tooltipContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    padding: 16,
    backgroundColor: OsehColors.v4.primary.light,
    borderRadius: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  tooltipHeader: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: OsehColors.v4.primary.dark,
  },
  tooltipBody: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.dark,
  },
  empty: {
    backgroundColor: OsehColors.v4.primary.dark,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.charcoal,
    borderRadius: 10,
    paddingVertical: 17,
    paddingHorizontal: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    lineHeight: 24,
    color: OsehColors.v4.primary.light,
    textAlign: 'center',
  },
  emptyWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spinner: {
    justifyContent: 'center',
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
  filterButton: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.light,
    borderRadius: 10,
  },
  filterButtonText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.light,
  },
  filterButtonActive: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: OsehColors.v4.primary.white,
    borderRadius: 10,
    backgroundColor: OsehColors.v4.primary.white,
  },
  filterButtonActiveText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.dark,
  },
  clearFiltersButton: {
    borderRadius: 10,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.smoke,
  },
  tag: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  tagText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: OsehColors.v4.primary.smoke,
  },
  tagSeparator: {
    alignSelf: 'stretch',
    borderRightWidth: 1,
    borderRightColor: OsehColors.v4.primary.darkGrey,
  },
});
