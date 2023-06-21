import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: Colors.WHITE,
    fontFamily: "OpenSans-Regular",
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 60,
  },
  inputSpacing: {
    height: 40,
  },
  inputSubmitSpacing: {
    height: 60,
  },
});
