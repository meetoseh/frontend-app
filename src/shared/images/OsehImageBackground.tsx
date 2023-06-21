import { PropsWithChildren, ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { OsehImageBackgroundFromState } from './OsehImageBackgroundFromState';
import { OsehImageProps } from './OsehImageProps';
import { useOsehImageState } from './useOsehImageState';
import { OsehImageStateRequestHandler } from './useOsehImageStateRequestHandler';

/**
 * A convenience component which fetches the image using the given properties
 * and then renders it with the standard rendering as an ImageBackground,
 * meaning it accepts children.
 */
export const OsehImageBackground = ({
  children,
  handler,
  style = undefined,
  ...props
}: PropsWithChildren<
  OsehImageProps & {
    handler: OsehImageStateRequestHandler;
    style?: StyleProp<ViewStyle> | undefined;
  }
>): ReactElement => {
  const state = useOsehImageState(props, handler);
  return (
    <OsehImageBackgroundFromState state={state} style={style}>
      {children}
    </OsehImageBackgroundFromState>
  );
};
