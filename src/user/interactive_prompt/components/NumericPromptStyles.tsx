import { StyleSheet } from "react-native";
import * as Colors from "../../../styling/colors";

export const styles = StyleSheet.create({
  prompt: {
    marginTop: 40,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  carouselContainer: {
    marginTop: 36,
  },
  item: {
    position: "relative",
    width: 75,
    height: 75,
  },
  itemNotFirstChild: {
    marginLeft: 20,
  },
  itemBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  itemForeground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 75,
    height: 75,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  itemForegroundText: {
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "OpenSans-Regular",
    fontSize: 34,
    color: Colors.GRAYSCALE_BLACK,
    paddingBottom: 3,
    paddingRight: 0,
  },
  statsAmount: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    textAlign: "center",
    textAlignVertical: "top",
    verticalAlign: "middle",
    padding: 0,
    marginTop: 24,
    fontFamily: "OpenSans-Light",
    fontSize: 16,
    color: Colors.WHITE,
  },
  continueContainer: {
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 0,
    paddingLeft: 24,
  },
  profilePictures: {
    marginTop: 20,
    alignSelf: "center",
  },
});
