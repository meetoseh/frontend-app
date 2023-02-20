import { PropsWithChildren, ReactElement } from 'react';
import { CustomButtonProps } from '../models/CustomButtonProps';
import { FilledButton } from './FilledButton';
import { styles } from './LinkButtonStyles';

/**
 * A button with no background and white text
 */
export const LinkButton = (props: PropsWithChildren<CustomButtonProps>): ReactElement => {
  return <FilledButton styles={styles} {...props} />;
};
