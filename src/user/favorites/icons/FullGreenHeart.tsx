import Svg, {
  SvgProps,
  Defs,
  LinearGradient,
  Stop,
  Path,
} from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Defs>
      <LinearGradient
        id="a"
        x1={10.5}
        x2={25.828}
        y1={8.27}
        y2={9.729}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#57B8A2" />
        <Stop offset={1} stopColor="#099" />
      </LinearGradient>
    </Defs>
    <Path
      fill="url(#a)"
      d="m12 21.175-1.45-1.32C5.4 15.185 2 12.105 2 8.325c0-3.08 2.42-5.5 5.5-5.5 1.74 0 3.41.81 4.5 2.09 1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.175Z"
    />
  </Svg>
);
export default SvgComponent;
