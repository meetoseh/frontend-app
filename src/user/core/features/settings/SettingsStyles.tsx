import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.GRAYSCALE_BLACK,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  background: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 24,
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    paddingTop: 0,
  },
  sections: {},
  sectionSeparator: {
    height: 24,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  version: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 19,
    color: Colors.GRAYSCALE_MID_GRAY,
    marginTop: 16,
  },
});
