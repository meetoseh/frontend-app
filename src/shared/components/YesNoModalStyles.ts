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
    paddingTop: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "stretch",
  },
  title: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: Colors.BLACK,
    marginBottom: 2,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  body: {
    fontFamily: "OpenSans-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.BLACK,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  buttons: {
    marginTop: 16,
    flexDirection: "row",
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.SYSTEM_BORDER,
  },
  button: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  secondButton: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.SYSTEM_BORDER,
    flexGrow: 2,
  },
  disabledButton: {},
  pressedButton: {
    backgroundColor: Colors.TRANSPARENT_BLACK,
  },
  buttonText: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 17,
    lineHeight: 22,
    color: Colors.SYSTEM_BLUE,
  },
  emphasizedButtonText: {
    fontFamily: "OpenSans-Bold",
  },
  disabledButtonText: {
    color: Colors.SYSTEM_DISABLED,
  },
  spinnerContainer: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
