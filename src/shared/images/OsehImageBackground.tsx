import { PropsWithChildren, ReactElement } from 'react';
import { ViewStyle } from 'react-native';
import { OsehImageProps } from './OsehImageProps';
import { OsehImageStateRequestHandler } from './useOsehImageStateRequestHandler';
import { useOsehImageStateValueWithCallbacks } from './useOsehImageStateValueWithCallbacks';
import { OsehImageBackgroundFromStateValueWithCallbacks } from './OsehImageBackgroundFromStateValueWithCallbacks';
import { useReactManagedValueAsValueWithCallbacks } from '../hooks/useReactManagedValueAsValueWithCallbacks';

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
    style?: ViewStyle | undefined;
  }
>): ReactElement => {
  const state = useOsehImageStateValueWithCallbacks(
    { type: 'react-rerender', props },
    handler
  );
  const styleVWC = useReactManagedValueAsValueWithCallbacks(style ?? {});
  return (
    <OsehImageBackgroundFromStateValueWithCallbacks
      state={state}
      styleVWC={styleVWC}
    >
      {children}
    </OsehImageBackgroundFromStateValueWithCallbacks>
  );
};
