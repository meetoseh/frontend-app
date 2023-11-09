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
    alignItems: "center",
    flexGrow: 1,
    paddingTop: 0,
  },
  title: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 18,
    lineHeight: 32,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
    marginTop: 24,
  },
  subtitle: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_MID_GRAY,
    marginTop: 6,
  },
  form: {
    marginTop: 40,
    marginBottom: 40,
  },
});
