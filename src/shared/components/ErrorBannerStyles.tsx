import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
    // top set programatically
    left: 0,
    right: 0,
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#BA1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 24,
    paddingRight: 24,
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
  },
});
