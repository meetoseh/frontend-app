import * as React from "react";
import Svg, {
  SvgProps,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
const SvgComponent = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Path
      stroke="url(#a)"
      strokeLinecap="round"
      strokeWidth={2}
      d="m4 12.314 5.657 5.657L20.97 6.657"
    />
    <Defs>
      <LinearGradient
        id="a"
        x1={5.725}
        x2={19.043}
        y1={14.039}
        y2={4.74}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#57B8A2" />
        <Stop offset={1} stopColor="#099" />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default SvgComponent;
