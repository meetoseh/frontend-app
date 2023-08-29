import { Platform, StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 100,
    flex: undefined,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 47.5,

    ...Platform.select({
      ios: {
        shadowColor: Colors.BLACK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 20,
        shadowColor: Colors.BLACK,
      },
    }),
  },

  containerWithSpinner: {
    position: "relative",
  },

  spinnerContainer: {
    position: "absolute",
    top: 16,
    left: 13,
  },

  disabled: {
    backgroundColor: Colors.GRAYSCALE_MID_GRAY,
  },

  disabledText: {
    color: Colors.GRAYSCALE_DARK_GRAY,
  },

  pressed: {
    backgroundColor: Colors.GRAYSCALE_LIGHT_GRAY,
  },

  pressedText: {
    color: Colors.PRIMARY_DEFAULT,
  },

  text: {
    color: Colors.GRAYSCALE_BLACK,
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 24,
  },
});
