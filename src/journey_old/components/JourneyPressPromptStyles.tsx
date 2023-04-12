import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  info: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Light',
    fontSize: 16,
  },
});
