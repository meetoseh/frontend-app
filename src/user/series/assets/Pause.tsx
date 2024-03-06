import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={16} height={26} fill="none" {...props}>
    <Path
      fill="#EAEAEB"
      fillRule="evenodd"
      d="M3 .5A2.5 2.5 0 0 1 5.5 3v20a2.5 2.5 0 0 1-5 0V3A2.5 2.5 0 0 1 3 .5Zm10 0A2.5 2.5 0 0 1 15.5 3v20a2.5 2.5 0 0 1-5 0V3A2.5 2.5 0 0 1 13 .5Z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgComponent;
