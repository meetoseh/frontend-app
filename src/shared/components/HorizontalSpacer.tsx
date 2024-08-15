import { ReactElement } from 'react';
import { View } from 'react-native';
import { debugView } from '../lib/debugView';

/**
 * A basic horizontal spacer. Uses padding instead of just width to
 * avoid being compressed in some situations.
 */
export const HorizontalSpacer = ({
  width,
  maxWidth,
  flexBasis,
  flexGrow,
  debug,
}: {
  width: number;
  maxWidth?: number;
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
        ...(maxWidth !== undefined ? { maxWidth } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {}),
      }}
      onLayout={debug === undefined ? undefined : debugView(debug, false)}
    />
  );
