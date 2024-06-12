import { ReactElement } from 'react';
import { View } from 'react-native';
import { debugView } from '../lib/debugView';

/**
 * A basic horizontal spacer. Uses padding instead of just width to
 * avoid being compressed in some situations.
 */
export const HorizontalSpacer = ({
  width,
  flexBasis,
  flexGrow,
  debug,
}: {
  width: number;
  flexBasis?: number;
  flexGrow?: number;
  debug?: string;
}): ReactElement =>
  width === 0 && flexGrow === undefined ? (
    <></>
  ) : (
    <View
      style={{
        width: width,
        paddingLeft: width,
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {}),
      }}
      onLayout={debug === undefined ? undefined : debugView(debug, false)}
    />
  );
