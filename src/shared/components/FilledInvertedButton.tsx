import { PropsWithChildren, ReactElement } from "react";
import { CustomButtonProps } from "../models/CustomButtonProps";
import { FilledButton } from "./FilledButton";
import { styles } from "./FilledInvertedButtonStyles";

/**
 * A button with white background and black text.
 */
export const FilledInvertedButton = (
  props: PropsWithChildren<CustomButtonProps>
): ReactElement => {
  return <FilledButton styles={styles} spinnerVariant="black" {...props} />;
};
