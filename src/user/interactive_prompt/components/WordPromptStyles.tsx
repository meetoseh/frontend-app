import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  prompt: {
    marginTop: 40,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  options: {
    marginTop: 36,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  option: {
    position: "relative",
  },
  optionNotFirstChild: {
    marginTop: 18,
  },
  optionBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: -1,
  },
  optionForeground: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingLeft: 15,
    paddingRight: 15,
  },
  optionText: {
    marginLeft: 22,
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.25,
    color: Colors.WHITE,
  },
  continueContainer: {
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 0,
    paddingLeft: 24,
  },
  profilePictures: {
    marginTop: 20,
    alignSelf: "center",
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: Colors.WHITE,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkContainerChecked: {
    backgroundColor: Colors.WHITE,
  },
});
