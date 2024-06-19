import Svg, { SvgProps, Path } from "react-native-svg";

const SvgComponent = (props: SvgProps) => (
  <Svg width={18} height={19} fill="none" {...props}>
    <Path
      fill="#fff"
      d="m12.21 8.79-5-5a1.004 1.004 0 1 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 .325 1.638 1 1 0 0 0 1.095-.219l5-5a.999.999 0 0 0 0-1.42Z"
    />
  </Svg>
);

export default SvgComponent;
