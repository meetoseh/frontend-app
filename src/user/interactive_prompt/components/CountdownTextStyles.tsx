import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  title: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    color: Colors.WHITE,
    marginBottom: 8,
  },
  countdown: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "OpenSans-Light",
    fontSize: 100,
    lineHeight: 100,
    color: Colors.SLIGHTLY_TRANSPARENT_WHITE,
  },
});
