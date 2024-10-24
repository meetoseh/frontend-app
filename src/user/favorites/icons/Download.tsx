import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={18} height={24} fill="none" {...props}>
    <Path
      fill="#fff"
      d="M15.75 0c.619 0 1.149.214 1.59.641.44.428.66.942.66 1.54v12c0 .6-.22 1.115-.662 1.542-.44.428-.97.641-1.588.64h-3.375v-2.181h3.375v-12H2.25v12h3.375v2.182H2.25a2.202 2.202 0 0 1-1.59-.642 2.066 2.066 0 0 1-.66-1.54v-12c0-.6.22-1.114.661-1.542C1.103.213 1.632 0 2.25 0h13.5Zm-5.625 7.636v12.191l1.8-1.745 1.575 1.554L9 24l-4.5-4.364 1.575-1.554 1.8 1.745V7.637h2.25Z"
    />
  </Svg>
);
export default SvgComponent;
