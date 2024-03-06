import { PropsWithChildren, ReactElement } from 'react';
import { CustomButtonProps } from '../models/CustomButtonProps';
import { FilledButton } from './FilledButton';
import { styles, thinStyles } from './OutlineWhiteButtonStyles';

/**
 * A button with no background, a white outline, and white text
 */
export const OutlineWhiteButton = (
  props: PropsWithChildren<CustomButtonProps> & { thin?: boolean }
): ReactElement => {
  return (
    <FilledButton
      styles={props.thin ? thinStyles : styles}
      spinnerVariant="white"
      {...props}
    />
  );
};
