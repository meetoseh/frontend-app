import { PropsWithChildren, ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { OsehImageProps, useOsehImageState } from '../hooks/useOsehImage';
import { OsehImageBackgroundFromState } from './OsehImageBackgroundFromState';

/**
 * A convenience component which fetches the image using the given properties
 * and then renders it with the standard rendering as an ImageBackground,
 * meaning it accepts children.
 */
export const OsehImageBackground = ({
  children,
  style = undefined,
  ...props
}: PropsWithChildren<
  OsehImageProps & { style?: StyleProp<ViewStyle> | undefined }
>): ReactElement => {
  const state = useOsehImageState(props);
  return (
    <OsehImageBackgroundFromState state={state} style={style}>
      {children}
    </OsehImageBackgroundFromState>
  );
};
