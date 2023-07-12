import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  outer: {
    position: "relative",
    overflow: "hidden",
  },
  inner: {
    position: "absolute",
    top: 0,
    left: 0,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flexShrink: 0,
    flexGrow: 0,
  },
});
