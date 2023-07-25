import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const SvgComponent = (props: SvgProps) => (
  <Svg width={16} height={16} fill="none" {...props}>
    <Path
      stroke="#FFF"
      strokeLinecap="round"
      strokeWidth={2}
      d="m2.667 8.208 3.771 3.772 7.543-7.543"
    />
  </Svg>
);
export default SvgComponent;
