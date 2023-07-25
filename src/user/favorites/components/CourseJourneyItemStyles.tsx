import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 8,
  },
  separator: {
    fontFamily: "OpenSans-Regular",
    fontSize: 12,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_WHITE,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    paddingTop: 2,
    paddingBottom: 5,
  },
  container: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.TRANSPARENT_WHITE,
    borderRadius: 10,
    position: "relative",
  },
  checkContainer: {
    position: "absolute",
    left: -8,
    top: -8,
    width: 16,
    height: 16,
  },
  titleAndInstructor: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    lineHeight: 27,
    color: Colors.WHITISH_BLUE,
    marginBottom: 10,
  },
  instructor: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  instructorPictureContainer: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    marginRight: 6,
  },
  instructorName: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    letterSpacing: 0.25,
    color: Colors.WHITISH_BLUE,
  },
  favoriteAndDownloadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoritedContainer: {
    padding: 8,
  },
});
