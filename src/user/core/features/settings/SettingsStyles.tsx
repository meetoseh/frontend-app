import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: Colors.GRAYSCALE_BLACK,
    position: 'relative',
  },
  background: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    paddingBottom: 24,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingTop: 0,
  },
  sections: {
    gap: 24,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.GRAYSCALE_MID_GRAY,
    marginTop: 16,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'stretch',
  },
});
