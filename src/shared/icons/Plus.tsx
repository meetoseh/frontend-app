import Svg, { SvgProps, Path } from 'react-native-svg';

const SvgComponent = (props: SvgProps) => (
  <Svg fill="none" viewBox="4 4.87 16 16" {...props}>
    <Path d="M20 13.867h-7v7h-2v-7H4v-2h7v-7h2v7h7v2Z" fill={props.color ?? '#fff'} />
  </Svg>
);

export default SvgComponent;
