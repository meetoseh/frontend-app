import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={20} height={20} fill="none" {...props}>
    <Path
      stroke="#EAEAEB"
      strokeLinecap="round"
      strokeWidth={2}
      d="m4.343 10.886 3.771 3.77 7.542-7.542"
    />
  </Svg>
);
export default SvgComponent;
