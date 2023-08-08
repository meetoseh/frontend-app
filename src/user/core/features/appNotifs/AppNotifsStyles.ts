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
    paddingHorizontal: 32,
  },
  content: {
    maxWidth: 454,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    paddingTop: 0,
  },
  appWithBadge: {
    paddingTop: 19,
    paddingRight: 19,
    width: 66 /*brandmark*/ + 15 * 2 /*padding*/ + 19 /*badge half width*/,
    height: 62.754 + 15 * 2 + 19,
    position: "relative",
  },
  appIcon: {
    width: 66 + 15 * 2,
    height: 62.754 + 15 * 2,
    position: "absolute",
    top: 19,
    left: 0,
    padding: 15,
    backgroundColor: Colors.PRIMARY_DEFAULT,
    borderRadius: 16.84,
  },
  appBadge: {
    width: 38,
    height: 38,
    position: "absolute",
    top: 0,
    right: 0,
  },
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 24,
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
});
