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
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 24,
    lineHeight: 32,
    color: Colors.GRAYSCALE_WHITE,
    marginBottom: 24,
    textAlign: "left",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  answers: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  answerOuter: {
    borderRadius: 10,
    overflow: "hidden",
  },
  answer: {
    paddingVertical: 13,
    paddingHorizontal: 26,
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  answerSpacing: {
    width: 1,
    height: 18,
  },
  answerEmojiContainer: {},
  answerEmojiText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 32,
    letterSpacing: 0.25,
  },
  answerText: {
    marginLeft: 18,
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    letterSpacing: 0.25,
    color: Colors.WHITE,
  },
  infoText: {
    marginTop: 18,
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.WHITE,
  },
});
