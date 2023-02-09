import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  background: {
    alignItems: 'stretch',
    backgroundColor: Colors.BLACK,
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
  },

  container: {
    alignItems: 'stretch',
    backgroundColor: Colors.WHITE,
    flex: 1,
    justifyContent: 'center',
  },
});
