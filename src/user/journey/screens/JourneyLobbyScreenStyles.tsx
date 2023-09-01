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
    maxHeight: 704,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    flexGrow: 1,
    paddingTop: 20,
  },
});
