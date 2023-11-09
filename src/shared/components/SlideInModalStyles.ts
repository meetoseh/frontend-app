import { StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  label: {
    color: Colors.GRAYSCALE_WHITE,
  },
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.GRAYSCALE_BLACK,
  },
  containerLarge: {
    flex: 1,
  },
});
