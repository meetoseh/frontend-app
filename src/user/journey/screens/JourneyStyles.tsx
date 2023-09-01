import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    backgroundColor: Colors.WHITE,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  controlButtonContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 2,
  },

  audioControlsContainer: {
    position: "absolute",
    left: 24,
    bottom: 64,
    zIndex: 2,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  audioControlsInnerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  audioProgressContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    alignItems: "center",
    height: 5,
    backgroundColor: Colors.PRIMARY_DEFAULT_BACKGROUND,
    zIndex: 3,
  },
  audioProgress: {
    height: 5,
    backgroundColor: Colors.PRIMARY_DEFAULT,
  },
  audioProgressCircle: {
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.PRIMARY_DEFAULT,
  },
  contentContainer: {
    position: "absolute",
    left: 0,
    bottom: 106,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  content: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  titleAndInstructor: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 22,
    lineHeight: 30,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: Colors.WHITISH_BLUE,
    marginBottom: 5,
  },
  instructor: {
    fontFamily: "OpenSans-Light",
    fontSize: 12,
    lineHeight: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: Colors.TRANSPARENT_LIGHT_GRAY,
  },
});
