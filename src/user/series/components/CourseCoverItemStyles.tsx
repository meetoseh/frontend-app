import { StyleSheet } from 'react-native';
import * as Colors from '../../../styling/colors';

export const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.BLACK_OVERLAY,
    borderRadius: 10,
  },
  content: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallback: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 28,
    color: Colors.PRIMARY_LIGHT,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  logo: {},
  instructor: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
    marginTop: 4,
    textAlign: 'center',
  },
});
