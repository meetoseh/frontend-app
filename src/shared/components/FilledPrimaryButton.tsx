import { PropsWithChildren, ReactElement } from "react";
import { CustomButtonProps } from "../models/CustomButtonProps";
import { FilledButton } from "./FilledButton";
import { styles } from "./FilledPrimaryButtonStyles";

/**
 * A button filled with a primary background color and white text.
 */
export const FilledPrimaryButton = (
  props: PropsWithChildren<CustomButtonProps>
): ReactElement => {
  return <FilledButton styles={styles} {...props} />;
};
