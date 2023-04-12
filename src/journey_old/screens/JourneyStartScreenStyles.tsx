import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  invAFriendContainer: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 390,
    paddingLeft: 24,
    paddingRight: 24,
  },

  letsGoContainer: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 32,
    maxWidth: 390,
    paddingLeft: 24,
    paddingRight: 24,
  },

  title: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 22,
  },

  titleContainer: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 64,
    maxHeight: 32,
  },
});
