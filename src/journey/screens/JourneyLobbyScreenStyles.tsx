import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'space-between',
    maxHeight: 704,
    paddingBottom: 20,
    paddingTop: 20,
  },
  countdown: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Light',
    fontSize: 100,
    lineHeight: 105,
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'column',
    height: 105 + 28 + 24,
    maxHeight: 105 + 28 + 24,
  },
  title: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 24,
    textAlign: 'center',
  },
});
