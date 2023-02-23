import { ReactElement } from 'react';
import { OsehImageProps, useOsehImageState } from '../hooks/useOsehImage';
import { OsehImageFromState } from './OsehImageFromState';

/**
 * A convenience component which fetches the image using the given properties
 * and then renders it with the standard rendering.
 */
export const OsehImage = (props: OsehImageProps): ReactElement => {
  const state = useOsehImageState(props);
  return <OsehImageFromState state={state} />;
};
