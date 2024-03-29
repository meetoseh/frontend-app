import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  backgroundContainer: {},
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentInner: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  contentWrapper: {},
  contentGrowingPadding: {
    flexBasis: 0,
    flexGrow: 1,
  },
  title: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 20,
    color: Colors.PRIMARY_LIGHT,
  },
  subtitle: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    color: Colors.GRAYSCALE_MID_GRAY,
    marginTop: 8,
    marginBottom: 12,
  },
  footer: {},
});
