import { StyleSheet } from 'react-native';
import * as Colors from '../../../../styling/colors';

export const styles = StyleSheet.create({
  container: {},
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  foreground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  keyboardVisiblePadding: {
    height: 40,
  },
  contentSpacer: { flexGrow: 1, flexBasis: 0 },
  form: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 16,
  },
  title: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 20,
    textAlign: 'center',
    color: Colors.PRIMARY_LIGHT,
  },
  footer: {
    marginBottom: 24,
  },
});
