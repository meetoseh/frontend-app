import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    columnGap: -6,
    minHeight: 38,
  },
  pictureContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.PROFILE_PICTURE_BACKGROUND,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  picture: {},
  hereSettingsFilledContainer: {
    width: 38,
    height: 38,
    backgroundColor: Colors.WHITE,
    borderRadius: 19,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  hereSettingsFilledText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 10,
    lineHeight: 10,
    textAlign: "center",
    color: Colors.GRAYSCALE_OFF_BLACK,
    marginTop: 2,
  },
  hereSettingsFloatingText: {
    paddingLeft: 12,
    fontFamily: "OpenSans-Regular",
    fontSize: 12,
    lineHeight: 12,
    textAlign: "left",
    color: Colors.WHITE,
    /* idk looks more centered this way */
    marginTop: 2,
  },
});
