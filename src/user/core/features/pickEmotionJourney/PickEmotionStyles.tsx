import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "stretch",
    flex: 1,
    justifyContent: "flex-start",
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 32,
    /* On the right, we want the padding on the favorites to be clickable,
       but not shift the text */
    paddingRight: 32 - 26,
    paddingTop: 32,
  },
  profilePic: {
    borderRadius: 30,
    marginRight: 10,
  },
  settingsLink: {
    flexDirection: "row",
  },
  settingsMessages: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  greeting: {
    fontFamily: "OpenSans-Regular",
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.15,
    color: Colors.WHITE,
  },
  greetingAction: {
    fontFamily: "OpenSans-Italic",
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.15,
    color: Colors.WHITE,
  },
  favoritesLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 26,
    paddingRight: 26,
  },
  favoritesLinkText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    color: Colors.WHITE,
  },
  words: {
    position: "relative",
  },
  wordText: {
    color: Colors.WHITE,
    fontFamily: "OpenSans-Regular",
  },
});
