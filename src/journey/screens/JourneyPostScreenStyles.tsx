import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'stretch',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingTop: 24,
  },
  feedbackPrompt: {
    alignSelf: 'center',
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 28,
    marginBottom: 24,
    marginTop: 80,
    maxWidth: 244,
    textAlign: 'center',
  },
  reviewButton: {
    height: 64,
    padding: 16,
    width: 64,
  },
  reviewButtons: {
    alignSelf: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 50,
    maxHeight: 64,
    maxWidth: 128,
  },
  streak: {
    alignSelf: 'center',
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Light',
    fontSize: 100,
    lineHeight: 105,
    marginBottom: -5,
  },
  streakUnit: {
    alignSelf: 'center',
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Light',
    fontSize: 22,
    lineHeight: 22,
  },
  title: {
    alignSelf: 'center',
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: 244,
    textAlign: 'center',
  },
});
