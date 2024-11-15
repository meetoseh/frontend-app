import { ReactElement } from 'react';
import { View } from 'react-native';
import { debugView } from '../lib/debugView';

/**
 * A basic vertical spacer. Uses padding instead of just height to
 * avoid being compressed in some situations.
 */
export const VerticalSpacer = ({
  height,
  maxHeight,
  flexBasis,
  flexGrow,
  color,
  noPointerEvents,
  debug,
}: {
  height: number;
  maxHeight?: number;
  flexBasis?: number;
  flexGrow?: number;
  color?: string;
  noPointerEvents?: boolean;
  debug?: string;
}): ReactElement =>
  height === 0 && flexGrow === undefined ? (
    <></>
  ) : (
    <View
      style={{
        height: height,
        paddingTop: height,
        ...(maxHeight !== undefined ? { maxHeight } : {}),
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {}),
        ...(color !== undefined ? { backgroundColor: color } : {}),
      }}
      pointerEvents={noPointerEvents ? 'none' : 'auto'}
      onLayout={debug === undefined ? undefined : debugView(debug, false)}
    />
  );
