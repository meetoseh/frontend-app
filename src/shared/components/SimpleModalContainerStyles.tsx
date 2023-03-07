import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    backgroundColor: Colors.BLACK_OVERLAY,
    display: 'flex',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
});
