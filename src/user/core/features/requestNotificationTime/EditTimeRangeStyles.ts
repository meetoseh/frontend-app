import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {},
  formItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 48,
  },
  formItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  formItemTitle: {
    color: Colors.GRAYSCALE_WHITE,
    fontFamily: "OpenSans-Light",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
    textAlign: "center",
    marginBottom: 13,
  },
  input: {},
  inputText: {
    color: Colors.GRAYSCALE_WHITE,
  },
  submitContainer: {
    marginTop: 24,
  },
});
