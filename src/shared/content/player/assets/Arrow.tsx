import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={7} height={12} fill="#EAEAEB" {...props}>
    <Path d="M6.705 5.29 1.713.294A1.002 1.002 0 1 0 .295 1.713l4.293 4.286-4.293 4.287a1 1 0 0 0 0 1.418.999.999 0 0 0 1.418 0L6.705 6.71a1 1 0 0 0 0-1.42Z" />
  </Svg>
);
export default SvgComponent;
