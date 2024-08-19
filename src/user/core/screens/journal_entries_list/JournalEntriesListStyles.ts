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
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    lineHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    color: OsehColors.v4.primary.light,
  },
  emptyWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
