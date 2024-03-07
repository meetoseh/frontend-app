import Svg, { SvgProps, Path } from 'react-native-svg';
const SvgComponent = (props: SvgProps) => (
  <Svg width={20} height={20} fill="none" {...props}>
    <Path
      fill="#EAEAEB"
      fillRule="evenodd"
      d="M8.955 12.67v1.45l1.934-1.45h3.986a.234.234 0 0 0 .232-.232V5.125a.234.234 0 0 0-.232-.232h-9.75a.234.234 0 0 0-.232.232v7.313c0 .127.105.232.232.232h3.83Zm-.742 3.75a.404.404 0 0 1-.65-.325v-2.032H5.124A1.627 1.627 0 0 1 3.5 12.438V5.125c0-.896.729-1.625 1.625-1.625h9.75c.896 0 1.625.729 1.625 1.625v7.313c0 .896-.729 1.625-1.625 1.625h-3.522l-3.14 2.356Z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgComponent;
