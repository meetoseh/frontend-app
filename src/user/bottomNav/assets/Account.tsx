import Svg, {
  SvgProps,
  Path,
  RadialGradient,
  Defs,
  Stop,
  Circle,
} from 'react-native-svg';
const SvgComponent = ({ active, ...props }: SvgProps & { active: boolean }) => (
  <Svg
    width={40}
    height={40}
    viewBox="-10 -10 40 40"
    style={{
      marginLeft: -10,
      marginTop: -10,
      marginRight: -10,
      marginBottom: -10,
    }}
    {...props}
  >
    {active && (
      <>
        <Defs>
          <RadialGradient id="glow">
            <Stop offset="0%" stopColor="#C8CDD0" stopOpacity="0" />
            <Stop offset="20%" stopColor="#C8CDD0" stopOpacity="0.1" />
            <Stop offset="90%" stopColor="#C8CDD0" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="10" cy="10" r="16" fill="url(#glow)" />
      </>
    )}
    <Path
      stroke={active ? 'none' : '#C8CDD0'}
      strokeWidth={1.75}
      fill={active ? '#FFFFFF' : 'none'}
      d="M13.875 5.25A3.874 3.874 0 0 1 10 9.125 3.874 3.874 0 0 1 6.125 5.25 3.874 3.874 0 0 1 10 1.375a3.874 3.874 0 0 1 3.875 3.875Zm-12.5 11.875c0-.468.228-.943.757-1.432.535-.494 1.318-.94 2.254-1.315C6.26 13.628 8.524 13.25 10 13.25s3.74.377 5.614 1.128c.935.375 1.719.821 2.254 1.315.53.489.757.964.757 1.432V18.5a.125.125 0 0 1-.125.125h-17a.125.125 0 0 1-.125-.125v-1.375Z"
    />
  </Svg>
);
export default SvgComponent;
