import { StyleSheet } from 'react-native';
import * as Colors from '../../styling/colors';

export const styles = StyleSheet.create({
  bigLink: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 32,
    lineHeight: 48,
  },
  bigLinkWrapper: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    flexBasis: 48,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'flex-start',
    marginBottom: 32,
    maxHeight: 48,
    minHeight: 48,
  },
  container: {
    alignItems: 'stretch',
    backgroundColor: Colors.GRAYSCALE_BLACK,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  firstSmallLinkWrapper: { marginBottom: 24, marginTop: 80 - 32 },
  smallLink: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 12,
    letterSpacing: 0.15,
    lineHeight: 22,
  },
  smallLinkWrapper: { marginBottom: 24 },
});
