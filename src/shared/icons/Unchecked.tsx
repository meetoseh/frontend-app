import Svg, { SvgProps, Rect } from 'react-native-svg';
import { WHITE } from '../../styling/colors';

const SvgComponent = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 18 18" {...props}>
    <Rect x="1" y="1" width="16" height="16" rx="5" stroke={WHITE} strokeWidth={1} />
  </Svg>
);

export default SvgComponent;
