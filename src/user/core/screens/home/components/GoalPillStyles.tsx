import { StyleSheet } from 'react-native';
import * as Colors from '../../../../../styling/colors';

export const styles = StyleSheet.create({
  goal: {
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 14,
    paddingRight: 28,
    paddingBottom: 12,
    paddingLeft: 16,
    borderRadius: 72,
    overflow: 'hidden',
  },
  goalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0593914d',
  },
  goalVisual: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  goalVisualBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalVisualForeground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalVisualTextWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#44b2a1cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalVisualTextInner: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 32,
    color: Colors.PRIMARY_LIGHT,
  },
  goalSection: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  goalSectionGoal: {
    padding: 10,
  },
  goalSectionTitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  goalSectionValue: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: Colors.PRIMARY_LIGHT,
  },
});
