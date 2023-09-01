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
    paddingHorizontal: 32,
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    flexGrow: 1,
    paddingTop: 0,
  },

  bigLinks: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  bigLinkContainer: {
    marginBottom: 32,
  },
  bigLinkText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 32,
    lineHeight: 48,
    color: Colors.GRAYSCALE_WHITE,
  },

  smallLinks: {
    marginTop: 32,
  },
  smallLinkContainer: {
    marginTop: 16,
  },
  smallLinkText: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0.15,
    color: Colors.GRAYSCALE_WHITE,
  },

  deleteConfirmButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: Colors.GRAYSCALE_LINE,
  },
  deleteConfirmButtonPressingIn: {
    backgroundColor: Colors.TRANSPARENT_BLACK,
  },
  deleteConfirmDeleteButton: {},
  deleteSpinnerContainer: {},
  deleteConfirmButtonText: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 12,
    lineHeight: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    color: Colors.GRAYSCALE_BLACK,
    textAlign: "center",
  },
  deleteConfirmDeleteButtonText: {
    fontFamily: "OpenSans-Bold",
  },
  deleteConfirm: {
    paddingTop: 24,
    backgroundColor: Colors.WHITISH_BLUE,
    borderRadius: 10,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
  deleteConfirmTitle: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: Colors.GRAYSCALE_OFF_BLACK,
    marginBottom: 12,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  deleteConfirmBody: {
    fontFamily: "OpenSans-Regular",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.GRAYSCALE_BODY,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  deleteConfirmButtons: {
    marginTop: 24,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
  },
});
