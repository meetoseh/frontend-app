import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.GRAYSCALE_BLACK,
  },
  background: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    paddingTop: 0,
  },
  header: {
    marginBottom: 12,
  },
  headerLine: {
    fontFamily: "OpenSans-Regular",
    fontSize: 22,
    lineHeight: 32,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
  },
  body: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    marginBottom: 60,
  },
  providers: {
    gap: 16,
  },
});
