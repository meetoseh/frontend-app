import Svg, { SvgProps, Path } from "react-native-svg";
import { WHITE } from "../../styling/colors";

const SvgComponent = (props: SvgProps) => (
  <Svg fill={WHITE} viewBox="5 5 14 14" {...props}>
    <Path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
  </Svg>
);

export default SvgComponent;
