import { StyleSheet } from 'react-native';
import * as Colors from '../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: Colors.WHITE,
  },
  innerContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  shareContainerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  shareContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  shareInfo: {
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  shareTitle: {
    color: Colors.PRIMARY_LIGHT,
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    marginBottom: 2,
  },
  shareInstructor: {
    color: Colors.GRAYSCALE_MID_GRAY,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
  },
  shareControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 12,
    gap: 9,
  },
  feedback: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  feedbackText: {
    color: Colors.PRIMARY_LIGHT,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.25,
    marginBottom: 12,
  },
});
