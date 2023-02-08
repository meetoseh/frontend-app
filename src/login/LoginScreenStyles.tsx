import { Platform, StyleSheet } from 'react-native';
import * as Colors from '../styling/colors';

export const styles = StyleSheet.create({
  apple: {
    height: 18,
    marginRight: 12,
    width: 18,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  continueWithApple: {
    alignItems: 'center',
    borderColor: Colors.WHITE,
    borderRadius: 100,
    borderStyle: 'solid',
    borderWidth: 2,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    maxHeight: 56,
  },
  continueWithAppleContainer: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 60,
    maxHeight: 56,
    maxWidth: 390,
    paddingLeft: 24,
    paddingRight: 24,
  },
  continueWithApplePressed: {
    backgroundColor: Colors.TRANSPARENT_WHITE,
  },
  continueWithAppleText: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 24,
  },
  continueWithGoogle: {
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY_DEFAULT,
    borderRadius: 100,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    maxHeight: 56,

    ...Platform.select({
      ios: {
        shadowColor: Colors.BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 20,
        shadowColor: Colors.BLACK,
      },
    }),
  },
  continueWithGoogleContainer: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 32,
    maxHeight: 56,
    maxWidth: 390,
    paddingLeft: 24,
    paddingRight: 24,
  },
  continueWithGooglePressed: {
    backgroundColor: Colors.PRIMARY_LIGHT,
  },
  continueWithGoogleText: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 24,
  },
  google: {
    height: 16,
    marginRight: 12,
    width: 16,
  },
  header: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 40,
    maxWidth: 390,
    paddingLeft: 24,
    paddingRight: 24,
    textAlign: 'center',
  },
  legal: {
    color: Colors.WHITE,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    letterSpacing: 0.15,
    lineHeight: 20,
    textAlign: 'center',
  },
  legalContainer: {
    marginLeft: 'auto',
    marginRight: 'auto',
    maxWidth: 240,
    paddingLeft: 24,
    paddingRight: 24,
  },
});
