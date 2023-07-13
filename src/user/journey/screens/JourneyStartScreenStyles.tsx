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
    maxWidth: 390,
    maxHeight: 704,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    flexGrow: 1,
    paddingTop: 20,
  },
  title: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 60,
    textAlign: "center",
    paddingHorizontal: 24,
    fontFamily: "OpenSans-Regular",
    fontSize: 22,
    lineHeight: 32,
    color: Colors.GRAYSCALE_WHITE,
  },
  description: {
    fontFamily: "OpenSans-Light",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    paddingHorizontal: 24,
  },
  journeyTitle: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  journeyDescription: {
    fontFamily: "OpenSans-Light",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  skipForNowContainer: {
    marginBottom: 35,
  },
});
