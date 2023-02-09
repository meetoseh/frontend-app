import { PropsWithChildren, ReactElement } from 'react';
import { CustomButtonProps } from '../models/CustomButtonProps';
import { FilledButton } from './FilledButton';
import { styles } from './FilledInvertedButtonStyles';

/**
 * A button filled with a primary background color and white text.
 */
export const FilledInvertedButton = (props: PropsWithChildren<CustomButtonProps>): ReactElement => {
  return <FilledButton styles={styles} {...props} />;
};
