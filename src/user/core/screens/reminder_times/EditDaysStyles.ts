import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";

export const styles = StyleSheet.create({
  form: {
    paddingLeft: 24,
    paddingRight: 24,
    alignSelf: "stretch",
  },
  submitContainer: {
    marginTop: 24,
  },
  formItems: {
    justifyContent: "center",
    alignItems: "stretch",
    borderRadius: 10,
    backgroundColor: Colors.NEW_GRAYSCALE_DARK_GRAY,
  },
  formItem: {
    paddingTop: 12.5,
    paddingRight: 12,
    paddingBottom: 12.5,
    paddingLeft: 12,
  },
  formItemNotLastChild: {
    borderTopColor: Colors.NEW_GRAYSCALE_BORDER,
    borderTopWidth: 1,
  },
});
