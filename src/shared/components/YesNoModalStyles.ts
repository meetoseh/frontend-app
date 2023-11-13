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
  content: {
    position: "relative",
    backgroundColor: Colors.SYSTEM_WHITE,
    paddingTop: 24,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "stretch",
  },
  title: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: Colors.GRAYSCALE_OFF_BLACK,
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  body: {
    fontFamily: "OpenSans-Regular",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.GRAYSCALE_BODY,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  buttons: {
    marginTop: 24,
    alignItems: "stretch",
    justifyContent: "center",
  },
  button: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAYSCALE_LINE,
  },
  disabledButton: {},
  pressedButton: {
    backgroundColor: Colors.TRANSPARENT_BLACK,
  },
  buttonText: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 12,
    lineHeight: 22,
    color: Colors.GRAYSCALE_BLACK,
  },
  emphasizedButtonText: {
    fontFamily: "OpenSans-Bold",
  },
  disabledButtonText: {},
  spinnerContainer: {
    position: "absolute",
    left: 24,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
