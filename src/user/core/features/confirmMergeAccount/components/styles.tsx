import { StyleSheet } from "react-native";
import * as Colors from "../../../../../styling/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.GRAYSCALE_BLACK,
  },
  background: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 64,
    paddingBottom: 24,
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    paddingTop: 0,
  },
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 22,
    lineHeight: 32,
    textAlign: "center",
    color: Colors.WHITE,
    marginBottom: 20,
  },
  description: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    lineHeight: 28,
    letterSpacing: 0.25,
    textAlign: "center",
    color: Colors.GRAYSCALE_WHITE,
  },
  buttonContainer: {
    alignSelf: "stretch",
    marginTop: 60,
    alignItems: "stretch",
    justifyContent: "center",
    gap: 16,
  },
  resolveConflict: {
    marginTop: 16,
  },
  resolveConflictTitle: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.25,
    color: Colors.GRAYSCALE_WHITE,
    marginBottom: 10,
  },
  resolveConflictOptions: {
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
    borderRadius: 10,
  },
  resolveConflictOption: {
    paddingVertical: 12.5,
    paddingHorizontal: 12,
  },
  resolveConflictOptionNotLastChild: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.NEW_GRAYSCALE_BORDER,
  },
  resolveConflictError: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: Colors.NEW_ERROR_LIGHT,
    marginTop: 6,
  },
});
