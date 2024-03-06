import { StyleSheet } from 'react-native';
import * as Colors from '../../../styling/colors';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 10,
  },
  foreground: {
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  title: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    color: Colors.PRIMARY_LIGHT,
  },
  headerRight: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  played: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  duration: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.GRAYSCALE_MID_GRAY,
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: '#191c1d80',
    borderRadius: 4,
  },
  description: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    color: Colors.PRIMARY_LIGHT,
    marginTop: 7,
  },
});
