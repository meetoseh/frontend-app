import * as React from "react";
import Svg, {
  SvgProps,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Path,
} from "react-native-svg";
const SvgComponent = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Defs>
      <LinearGradient
        id="a"
        x1={0}
        x2={24}
        y1={10}
        y2={24}
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0%" stopColor="#57B8A2" />
        <Stop offset="2%" stopColor="#57B8A2" />
        <Stop offset="97%" stopColor="#099" />
        <Stop offset="100%" stopColor="#099" />
      </LinearGradient>
    </Defs>
    <Circle cx={12} cy={12} r={12} fill="url(#a)" />
    <Path
      stroke="#F9F9F9"
      strokeLinecap="round"
      strokeWidth={2}
      d="m8 12.156 2.828 2.829 5.657-5.657"
    />
  </Svg>
);
export default SvgComponent;
