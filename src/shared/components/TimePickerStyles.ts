import { StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 8,
    paddingLeft: 12,
    fontFamily: "OpenSans-Regular",
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.25,
    borderRadius: 5,
  },
  pressingContainer: {
    backgroundColor: Colors.NEW_GRAYSCALE_BORDER,
  },
  label: {
    color: Colors.GRAYSCALE_WHITE,
  },
});
