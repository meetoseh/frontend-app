import { StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.GRAYSCALE_BLACK,
    flex: 1,
    justifyContent: "center",
  },
  fastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.GRAYSCALE_BLACK,
    justifyContent: "center",
    alignItems: "center",
  },
});
