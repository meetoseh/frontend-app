import Svg, { SvgProps, Path } from 'react-native-svg';

const SvgComponent = (props: SvgProps) => (
  <Svg width={24} height={25} viewBox="0 0 24 25" fill="none" {...props}>
    <Path
      d="m4 12.548 5.657 5.657L20.97 6.892"
      stroke={props.color ?? '#fff'}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default SvgComponent;
