import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.GRAYSCALE_BLACK,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  background: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    maxWidth: 454,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    paddingTop: 0,
  },
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 22,
    lineHeight: 32,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 12,
  },
  disclaimer: {
    fontFamily: "OpenSans-Light",
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.15,
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 16,
  },
  phoneInput: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    paddingTop: 5,
    paddingRight: 16,
    paddingBottom: 5,
    paddingLeft: 16,
    marginBottom: 40,
    color: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.WHITE,
  },
  errorPhoneInput: {
    color: Colors.ERROR_LIGHT,
    borderBottomColor: Colors.ERROR_LIGHT,
  },
});
