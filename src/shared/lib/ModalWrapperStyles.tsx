import { StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: Colors.BLACK_OVERLAY,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  minimalContainer: {},
  normalContainer: {
    padding: 20,
    backgroundColor: Colors.GRAYSCALE_WHITE,
    borderRadius: 10,
  },
  innerContainer: {},
});
