import {
  Svg,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  G,
  Path,
  Stop,
} from 'react-native-svg';

const IOSMessages = ({
  width,
  height,
}: {
  width?: number;
  height?: number;
}) => (
  <Svg
    width={width ?? 250}
    height={height ?? 250}
    viewBox="0 -10.335 76.481 76.481"
  >
    <Defs>
      <LinearGradient
        id="b"
        x1={-25.273}
        x2={-25.273}
        y1={207.521}
        y2={152.998}
        gradientTransform="matrix(.9821 0 0 .9821 -1.065 3.796)"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset={0} stopColor="#0cbd2a" stopOpacity={1} />
        <Stop offset={1} stopColor="#5bf675" stopOpacity={1} />
      </LinearGradient>
    </Defs>
    <G transform="translate(59.483 -145.846)">
      <Rect
        width={66.146}
        height={66.146}
        x={-59.483}
        y={145.846}
        rx={14.568}
        ry={14.568}
        opacity={1}
        fill="url(#b)"
        fillOpacity={1}
        stroke="none"
        strokeWidth={1.33634758}
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeMiterlimit={4}
        strokeDasharray="none"
        strokeDashoffset={0}
        strokeOpacity={1}
      />
      <Path
        d="M-26.41 157.296a24.278 20.222 0 0 0-24.278 20.222 24.278 20.222 0 0 0 11.794 17.316 27.365 20.222 0 0 1-4.245 5.942 23.857 20.222 0 0 0 9.86-3.874 24.278 20.222 0 0 0 6.869.838 24.278 20.222 0 0 0 24.278-20.222 24.278 20.222 0 0 0-24.278-20.222z"
        opacity={1}
        fill="#fff"
        fillOpacity={1}
        stroke="none"
        strokeWidth={1.56409621}
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeMiterlimit={4}
        strokeDasharray="none"
        strokeDashoffset={0}
        strokeOpacity={1}
      />
    </G>
    <Circle cx={63.39} cy={2.756} r={13.091} fill="#ff3b30" />
  </Svg>
);
export default IOSMessages;
