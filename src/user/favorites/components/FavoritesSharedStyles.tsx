import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  emptyContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.TRANSPARENT_WHITE,
    borderRadius: 10,
    paddingVertical: 17,
    paddingHorizontal: 34,
  },
  emptyText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
  },
});
