import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  content: {
    alignItems: 'stretch',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  controls: {
    alignItems: 'stretch',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
  },
  instructor: {
    color: Colors.TRANSPARENT_LIGHT_GRAY,
    fontFamily: 'OpenSans-Light',
    fontSize: 12,
    lineHeight: 16,
  },
  instructorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 44,
  },
  progressContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: Colors.WHITISH_BLUE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
    lineHeight: 30,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 5,
  },
});
