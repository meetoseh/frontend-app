import { Svg, Path } from 'react-native-svg';
import { memo } from 'react';
import {
  areResizableSvgPropsEqual,
  computeResizableSvgProps,
  ResizableSvgProps,
} from '../../models/ResizableSvgProps';

/** Add icon / plus */
export const Plus = memo((props: ResizableSvgProps) => {
  const c = computeResizableSvgProps({
    ...props,
    natural: { width: 20, height: 20 },
  });
  return (
    <Svg width={c.width} height={c.height} viewBox={c.viewBox} fill="none">
      <Path
        d="M14 10.5H10.5V14H9.5V10.5H6V9.5H9.5V6H10.5V9.5H14V10.5Z"
        fill={c.color}
      />
    </Svg>
  );
}, areResizableSvgPropsEqual);
