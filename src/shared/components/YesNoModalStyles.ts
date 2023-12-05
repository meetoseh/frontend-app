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
    backgroundColor: Colors.PRIMARY_LIGHT,
    paddingTop: 20,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "stretch",
  },
  title: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 17,
    lineHeight: 21,
    color: Colors.GRAYSCALE_BLACK,
    paddingHorizontal: 20,
    textAlign: "center",
  },
  body: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 17,
    color: Colors.GRAYSCALE_BLACK,
    paddingHorizontal: 16,
    textAlign: "center",
    marginTop: 11,
  },
  buttons: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "center",
    paddingTop: 0,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    gap: 12,
  },
  button: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.GRAYSCALE_BLACK,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexGrow: 1,
  },
  emphasizedButton: {
    backgroundColor: Colors.GRAYSCALE_BLACK,
  },
  disabledButton: {},
  pressedButton: {
    backgroundColor: Colors.TRANSPARENT_BLACK,
  },
  emphasizedPressedButton: {
    backgroundColor: Colors.GRAYSCALE_DARK_GRAY,
  },
  disabledEmphasizedButton: {
    backgroundColor: Colors.GRAYSCALE_MID_GRAY,
  },
  buttonText: {
    fontFamily: "OpenSans-Bold",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_BLACK,
  },
  emphasizedButtonText: {
    color: Colors.PRIMARY_LIGHT,
  },
  disabledButtonText: {
    color: Colors.GRAYSCALE_MID_GRAY,
  },
  disabledEmphasizedButtonText: {
    color: Colors.GRAYSCALE_OFF_BLACK,
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
