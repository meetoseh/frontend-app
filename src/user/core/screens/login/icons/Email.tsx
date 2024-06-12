import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={20} height={18} viewBox="0 0 20 18" fill="none" {...props}>
    <Path
      d="M1 5C1 3.89543 1.89543 3 3 3H17C18.1046 3 19 3.89543 19 5V13.75C19 14.8546 18.1046 15.75 17 15.75H3C1.89543 15.75 1 14.8546 1 13.75V5Z"
      stroke="#191C1D"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M2.42131 4.30287C1.91709 3.84067 2.24409 3 2.9281 3H17.0719C17.7559 3 18.0829 3.84067 17.5787 4.30287L12.0272 9.39176C10.8802 10.4431 9.11979 10.4431 7.97283 9.39176L2.42131 4.30287Z"
      stroke="#191C1D"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SvgComponent;