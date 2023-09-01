import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.GRAYSCALE_BLACK,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
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
  titleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "flex-start",
    marginRight: 20,
    marginBottom: 20,
    paddingHorizontal: 32,

    fontFamily: "OpenSans-Regular",
    fontSize: 22,
    lineHeight: 32,
    textAlign: "left",
    color: Colors.WHITE,
  },
  title: {},
  titleEM: {
    fontFamily: "OpenSans-Italic",
  },
  checklist: {
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 32,
    alignSelf: "flex-start",
  },
  checklistItemContainer: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 6,
  },
  checklistItem: {
    marginLeft: 8,
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_WHITE,
  },
  bannerContainer: {
    marginBottom: 32,
  },
  submitContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
