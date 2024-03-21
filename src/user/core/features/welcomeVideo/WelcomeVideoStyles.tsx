import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContentText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexBasis: 0,
  },
  transcript: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingBottom: 60,
    paddingLeft: 3,
  },
});
