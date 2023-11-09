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
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    paddingTop: 0,
  },
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    lineHeight: 32,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 24,
  },
  subtitle: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 40,
  },
});
