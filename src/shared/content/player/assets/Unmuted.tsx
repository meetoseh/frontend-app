import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={33} height={32} fill="none" {...props}>
    <Path
      fill="#EAEAEB"
      d="M16.994 9.438v13.125c0 .18-.046.355-.133.505a.878.878 0 0 1-.357.346.768.768 0 0 1-.469.077.807.807 0 0 1-.432-.215l-3.695-3.525H9.972c-.522 0-1.022-.23-1.39-.64a2.319 2.319 0 0 1-.577-1.548v-3.125c0-1.207.881-2.187 1.967-2.187h1.935l3.696-3.525a.806.806 0 0 1 .432-.217.767.767 0 0 1 .47.077c.146.075.27.195.357.346.087.151.133.327.133.506Zm-4.227 4.463a.796.796 0 0 1-.548.225H9.972a.267.267 0 0 0-.199.091.331.331 0 0 0-.082.221v3.125c0 .173.126.313.28.313h2.248c.201 0 .396.08.548.225l2.542 2.425v-9.05L12.767 13.9Z"
    />
    <Path
      stroke="#EAEAEB"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M19.995 12.5c1.333 1.778 1.333 5.222 0 7m2-10.5c3.988 3.808 4.012 10.217 0 14"
    />
  </Svg>
);
export default SvgComponent;