import { Platform, StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  apple: {
    height: 18,
    marginRight: 12,
    width: 18,
  },
  container: {
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    flexDirection: "column",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 60,
  },
  continueWithApple: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 56,
    maxWidth: 328,
    borderColor: Colors.WHITE,
    borderRadius: 100,
    borderStyle: "solid",
    borderWidth: 2,
  },
  continueWithApplePressed: {
    backgroundColor: Colors.TRANSPARENT_WHITE,
  },
  continueWithAppleText: {
    color: Colors.WHITE,
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 24,
  },
  continueWithGoogle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 56,
    maxWidth: 328,
    backgroundColor: Colors.PRIMARY_DEFAULT,
    borderRadius: 100,
    marginBottom: 32,

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
  continueWithGooglePressed: {
    backgroundColor: Colors.PRIMARY_LIGHT,
  },
  continueWithGoogleText: {
    color: Colors.WHITE,
    fontFamily: "OpenSans-Regular",
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
    fontFamily: "OpenSans-Regular",
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 40,
    maxWidth: 390,
    paddingLeft: 24,
    paddingRight: 24,
    textAlign: "center",
  },
  logo: {
    alignSelf: "center",
  },
  message: {
    alignSelf: "center",
    color: Colors.WHITE,
    fontFamily: "OpenSans-Light",
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 28,
    marginBottom: 60,
    marginTop: 32,
    maxWidth: 262,
    textAlign: "center",
  },
});
