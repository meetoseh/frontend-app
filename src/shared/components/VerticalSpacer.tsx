import { ReactElement } from 'react';
import { View } from 'react-native';

/**
 * A basic vertical spacer. Uses padding instead of just height to
 * avoid being compressed in some situations.
 */
export const VerticalSpacer = ({
  height,
  flexBasis,
  flexGrow,
  color,
  noPointerEvents,
}: {
  height: number;
  flexBasis?: number;
  flexGrow?: number;
  color?: string;
  noPointerEvents?: boolean;
}): ReactElement =>
  height === 0 && flexGrow === undefined ? (
    <></>
  ) : (
    <View
      style={{
        height: height,
        paddingTop: height,
        ...(flexGrow !== undefined ? { flexGrow } : {}),
        ...(flexBasis !== undefined ? { flexBasis } : {}),
        ...(color !== undefined ? { backgroundColor: color } : {}),
      }}
      pointerEvents={noPointerEvents ? 'none' : 'auto'}
    />
  );
