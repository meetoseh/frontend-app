import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.ERROR_DEFAULT,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    left: 0,
    paddingLeft: 24,
    paddingRight: 24,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  text: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 28,
    textAlign: 'center',
  },
});
