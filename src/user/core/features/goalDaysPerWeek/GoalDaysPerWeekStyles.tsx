import { StyleSheet } from "react-native";
import * as Colors from "../../../../styling/colors";
import { styles as filledPrimaryButtonStyles } from "../../../../shared/components/FilledPrimaryButtonStyles";
import { LinearGradientState } from "../../../../shared/anim/LinearGradientBackground";

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
  title: {
    fontFamily: "OpenSans-Regular",
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    paddingHorizontal: 32,
    color: Colors.GRAYSCALE_WHITE,
  },
  days: {
    marginTop: 50,
    marginBottom: 50,
    paddingHorzontal: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 12,
  },
  submitContainer: {},
});

export const buttonStyles = StyleSheet.create({
  ...filledPrimaryButtonStyles,
  container: {
    ...filledPrimaryButtonStyles.container,
    padding: undefined,
    paddingVertical: undefined,
    paddingHorizontal: undefined,
    minHeight: undefined,
    paddingLeft: undefined,
    paddingRight: undefined,
    borderRadius: 10,
  },
  text: {
    ...filledPrimaryButtonStyles.text,
    fontSize: 22,
    lineHeight: 32,
    paddingTop: 4,
    paddingBottom: 6.5,
    paddingLeft: 13.5,
    paddingRight: 13.5,
  },
});

export const activeButtonStyles = StyleSheet.create({
  ...buttonStyles,
  container: {
    ...buttonStyles.container,
    backgroundColor: "rgba(0,0,0,0)",
    borderRadius: undefined,
    gradient: {
      stops: [
        {
          color: [87, 184, 162, 1],
          offset: 0.0249,
        },
        {
          color: [0, 153, 153, 1],
          offset: 0.9719,
        },
      ],
      angleDegreesClockwiseFromTop: 95.08,
      borderRadius: 10,
    } as LinearGradientState,
  },
});
