import { StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    marginTop: 24,
    color: Colors.GRAYSCALE_LIGHT_GRAY,
    fontFamily: "OpenSans-Regular",
    letterSpacing: 0.25,
    fontSize: 24,
    lineHeight: 32,
  },
});
