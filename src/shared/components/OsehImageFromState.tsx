import { ReactElement } from 'react';
import { Image, View } from 'react-native';
import { OsehImageState } from '../hooks/useOsehImage';

/**
 * Uses the standard rendering for the given oseh image state, using a placeholder
 * before the image is available.
 *
 * @param state The state to render
 */
export const OsehImageFromState = (state: OsehImageState): ReactElement => {
  return state.localUrl ? (
    <Image
      style={{ width: state.displayWidth, height: state.displayHeight }}
      source={{ uri: state.localUrl }}
    />
  ) : (
    <View style={{ width: state.displayWidth, height: state.displayHeight }} />
  );
};
