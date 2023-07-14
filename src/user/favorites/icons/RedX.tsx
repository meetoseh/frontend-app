import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const SvgComponent = (props: SvgProps) => (
  <Svg width={14} height={14} fill="none" {...props}>
    <Path stroke="#C40000" strokeWidth={2} d="m0 0 14 14m0-14L0 14" />
  </Svg>
);
export default SvgComponent;
