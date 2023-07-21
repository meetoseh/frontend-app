import { StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.TRANSPARENT_BLACK,
    borderRadius: 10,
  },
  loadingText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
});
