import { ReactElement } from 'react';
import { Svg, Defs, Rect, LinearGradient, Stop } from 'react-native-svg';

export const SystemProfile = (): ReactElement => (
  <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <Rect
      width="30"
      height="30"
      rx="15"
      fill="url(#paint0_linear_9275_27030)"
    />
    <Defs>
      <LinearGradient
        id="paint0_linear_9275_27030"
        x1="23.1837"
        y1="0.085227"
        x2="13.1352"
        y2="29.3584"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#3B6EE0" />
        <Stop offset="0.405" stopColor="#9577E4" />
        <Stop offset="0.825" stopColor="#DEAC4E" />
      </LinearGradient>
    </Defs>
  </Svg>
);
