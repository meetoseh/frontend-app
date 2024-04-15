import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="-2 0 20 20" fill="none" {...props}>
    <Path
      fill="#EAEAEB"
      d="M2.229 20c-.405 0-.777-.1-1.115-.267A2.221 2.221 0 0 1 0 17.8V2.233C0 1.467.44.667 1.115.3c.675-.4 1.587-.4 2.262 0l13.509 7.767A2.22 2.22 0 0 1 18 10c0 .833-.44 1.5-1.114 1.933L3.377 19.7c-.371.2-.743.3-1.148.3Z"
    />
  </Svg>
);
export default SvgComponent;
