import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={20} height={20} fill="none" {...props}>
    <Path stroke="#EAEAEB" strokeWidth={2} d="M13.25 3.5 6.75 10l6.5 6.5" />
  </Svg>
);
export default SvgComponent;
