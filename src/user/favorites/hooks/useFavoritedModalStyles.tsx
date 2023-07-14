import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    position: "absolute",
    // top set in js
    left: 40,
    // width set in js
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.WHITE,
    borderRadius: 58,
  },
  text: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.25,
    color: Colors.PRIMARY_DARK,
    marginLeft: 12,
  },
});
