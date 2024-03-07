import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={20} height={20} fill="none" {...props}>
    <Path
      fill="#EAEAEB"
      d="M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm0-1.4a5.6 5.6 0 1 0 0-11.2 5.6 5.6 0 0 0 0 11.2Zm.7-5.6h2.8v1.4H9.3V6.5h1.4V10Z"
    />
  </Svg>
);
export default SvgComponent;
