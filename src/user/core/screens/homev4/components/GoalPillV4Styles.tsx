import { StyleSheet } from 'react-native';
import { OsehColors } from '../../../../../shared/OsehColors';

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
  vstack: {
    position: 'relative',
  },
  vstackItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalVisualText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 32,
    color: OsehColors.v4.primary.light,
  },
  streakAndGoal: {
    borderRadius: 10,
    backgroundColor: OsehColors.v4.experimental.lighten15,
  },
  sectionTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: OsehColors.v4.primary.smoke,
  },
  sectionValue: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 20,
    color: OsehColors.v4.primary.light,
  },
});
