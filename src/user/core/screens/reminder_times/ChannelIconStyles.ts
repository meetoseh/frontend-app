import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  channel: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  channelLabel: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_MID_GRAY,
    width: 72.66,
  },
});
