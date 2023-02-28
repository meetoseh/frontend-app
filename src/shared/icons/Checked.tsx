import Svg, { SvgProps, Rect, Path } from 'react-native-svg';
import { WHITE, PRIMARY_DEFAULT } from '../../styling/colors';

const SvgComponent = (props: SvgProps) => (
  <Svg fill="none" viewBox="0 0 18 18" {...props}>
    <Rect x="1" y="1" width="16" height="16" rx="5" fill={WHITE} />
    <Path
      d="M4 10L6.5 13L13.5 5.5"
      stroke={PRIMARY_DEFAULT}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export default SvgComponent;
