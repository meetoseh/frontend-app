import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={16} height={16} fill="none" {...props}>
    <Path
      stroke="#446266"
      strokeLinecap="round"
      strokeWidth={2}
      d="m2.667 8.21 3.77 3.77 7.543-7.542"
    />
  </Svg>
);
export default SvgComponent;
