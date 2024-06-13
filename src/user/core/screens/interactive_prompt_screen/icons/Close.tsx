import { ReactElement } from 'react';
import { Svg, Path } from 'react-native-svg';

export const Close = (): ReactElement => (
  <Svg width="56" height="56" viewBox="-16 -16 56 56" fill="none">
    <Path
      d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
      fill="white"
    />
  </Svg>
);