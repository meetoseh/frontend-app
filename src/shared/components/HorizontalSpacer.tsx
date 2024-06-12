import { ReactElement } from 'react';
import { View } from 'react-native';

/**
 * A basic horizontal spacer. Uses padding instead of just width to
 * avoid being compressed in some situations.
 */
export const HorizontalSpacer = ({
  width,
  flexBasis,
  flexGrow,
}: {
  width: number;
  flexBasis?: number;
  flexGrow?: number;
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
    />
  );
