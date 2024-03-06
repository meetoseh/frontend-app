import { PropsWithChildren, ReactElement } from 'react';
import { CustomButtonProps } from '../models/CustomButtonProps';
import { FilledButton } from './FilledButton';
import { styles } from './FilledPremiumButtonStyles';

/**
 * A button filled with a premium background color and white text.
 */
export const FilledPremiumButton = (
  props: PropsWithChildren<CustomButtonProps>
): ReactElement => {
  return <FilledButton styles={styles} spinnerVariant="white" {...props} />;
};
