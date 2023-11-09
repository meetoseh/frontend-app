import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {},
  title: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  options: {
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
    borderRadius: 10,
    marginTop: 8,
  },
  option: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionNotFirst: {
    borderTopWidth: 1,
    borderTopColor: Colors.NEW_GRAYSCALE_BORDER,
  },
  optionTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_WHITE,
  },
  optionTextStrong: {
    fontFamily: "OpenSans-Bold",
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_WHITE,
  },
});
