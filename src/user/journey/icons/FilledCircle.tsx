import Svg, { SvgProps, Circle } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Circle cx={12} cy={12} r={12} fill="#FDFCFC" />
  </Svg>
);
export default SvgComponent;
