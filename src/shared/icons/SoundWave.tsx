import Svg, { SvgProps, Path } from 'react-native-svg';

const SvgComponent = (props: SvgProps) => (
  <Svg width={175} height={84} viewBox="0 71 175 84" fill="none" {...props}>
    <Path
      d="M2 108v10m9-23v36m9-30v24m9-15v6m9-22v38m9-47v56m9-53v50m9-43v36m9-27v18m9-14v10m9-9v8m9-15v22m9-27v32m9-42v52m9-54v56m9-70v84m9-78v72m9-49v26m9-36v46m9-51v56"
      stroke="#fff"
      strokeWidth={4}
    />
  </Svg>
);

export default SvgComponent;
