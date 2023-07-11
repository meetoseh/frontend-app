import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  subtitle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "OpenSans-Regular",
    fontSize: 12,
    lineHeight: 28,
    letterSpacing: 0.25,
    color: Colors.WHITE,
  },
  title: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "OpenSans-Light",
    fontSize: 22,
    lineHeight: 32,
    color: Colors.WHITE,
    paddingLeft: 24,
    paddingRight: 24,
    maxWidth: 285,
    alignSelf: "center",
  },
});
