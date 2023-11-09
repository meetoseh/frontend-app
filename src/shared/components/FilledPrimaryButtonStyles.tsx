import { Platform, StyleSheet } from "react-native";
import * as Colors from "../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.PRIMARY_DEFAULT,
    borderRadius: 100,
    flex: undefined,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 56,

    ...Platform.select({
      ios: {
        shadowColor: Colors.BLACK_SHADOW,
        shadowOffset: { width: 0, height: 4 },
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
    backgroundColor: Colors.PRIMARY_LIGHT,
  },

  pressedText: {
    color: Colors.WHITE,
  },

  text: {
    color: Colors.WHITE,
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    letterSpacing: 0.25,
    lineHeight: 24,
  },
});
