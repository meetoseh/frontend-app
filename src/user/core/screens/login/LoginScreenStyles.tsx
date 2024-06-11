import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    flexDirection: "column",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  contentTablet: {
    justifyContent: "center",
  },
  apple: {
    width: 18,
    height: 19,
    marginRight: 12,
    paddingLeft: 1,
    paddingRight: 1,
  },
  google: {
    width: 18,
    height: 19,
    marginRight: 12,
    paddingLeft: 1,
    paddingRight: 1,
  },
  email: {
    width: 20,
    height: 18,
    marginRight: 12,
    paddingTop: 0.5,
    paddingBottom: 0.5,
  },
  header: {
    color: Colors.WHITE,
    fontFamily: "OpenSans-Regular",
    fontSize: 24,
    lineHeight: 32,
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
