import Svg, { SvgProps, Path, Circle } from 'react-native-svg';
import * as Colors from '../../styling/colors';

const SvgComponent = (props: SvgProps) => {
  const { color, ...rest } = props;
  return (
    <Svg width={50} height={50} fill="none" {...rest}>
      <Path d="m19.926 16.458 14.21 8.204-14.21 8.204V16.458Z" stroke={color ?? Colors.WHITE} />
      <Circle cx={25} cy={25} r={24.5} stroke={color ?? Colors.WHITE} />
    </Svg>
  );
};

export default SvgComponent;
