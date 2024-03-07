import Svg, {
  SvgProps,
  Path,
  Defs,
  RadialGradient,
  Stop,
  Circle,
} from 'react-native-svg';
const SvgComponent = ({ active, ...props }: SvgProps & { active: boolean }) => (
  <Svg
    width={48}
    height={50}
    fill="none"
    viewBox="-15 -15 48 50"
    style={{
      marginLeft: -15,
      marginTop: -15,
      marginRight: -15,
      marginBottom: -15,
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
        <Circle cx="9" cy="10" r="21" fill="url(#glow)" />
      </>
    )}
    <Path
      stroke={active ? 'none' : '#C8CDD0'}
      strokeWidth={1.75}
      fill={active ? '#FFFFFF' : 'none'}
      d="M1.5 19.125A.125.125 0 0 1 1.375 19V7.153c0-.038.018-.074.048-.098l-.54-.689.54.689 7.5-5.882a.125.125 0 0 1 .154 0l7.5 5.882c.03.024.048.06.048.098V19a.125.125 0 0 1-.125.125h-4.375A.125.125 0 0 1 12 19v-5.778c0-1.035-.84-1.875-1.875-1.875h-2.25c-1.036 0-1.875.84-1.875 1.875V19a.125.125 0 0 1-.125.125H1.5Z"
    />
  </Svg>
);
export default SvgComponent;
