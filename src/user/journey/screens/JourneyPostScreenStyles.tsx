import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    maxWidth: 454,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    paddingTop: 0,
  },
  titleText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    maxWidth: 286,
  },
  goalTextText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_WHITE,
    textAlign: "center",
  },
  topSpacer: { flexBasis: 100, flexShrink: 1, flexGrow: 0 },
  title: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  streakNumber: {
    fontFamily: "OpenSans-Light",
    fontSize: 100,
    lineHeight: 105,
    color: Colors.GRAYSCALE_WHITE,
  },
  streakUnit: {
    position: "relative",
    top: -20,
    fontFamily: "OpenSans-Light",
    fontSize: 22,
    lineHeight: 51,
    color: Colors.GRAYSCALE_WHITE,
  },
  weekdays: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  weekday: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayNotLastChild: {
    marginRight: 20,
  },
  weekdayLabel: {
    fontFamily: "OpenSans-Light",
    fontSize: 12,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    opacity: 0.7,
    marginTop: 10,
  },
  goal: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  favoriteButtonIcon: {
    marginRight: 12,
  },
});
