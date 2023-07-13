import { PropsWithChildren, ReactElement } from "react";
import { CustomButtonProps } from "../models/CustomButtonProps";
import { FilledButton } from "./FilledButton";
import { styles } from "./OutlineWhiteButtonStyles";

/**
 * A button with no background, a white outline, and white text
 */
export const OutlineWhiteButton = (
  props: PropsWithChildren<CustomButtonProps>
): ReactElement => {
  return <FilledButton styles={styles} spinnerVariant="white" {...props} />;
};
