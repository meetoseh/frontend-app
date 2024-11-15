import { Svg, Path } from 'react-native-svg';
import { memo } from 'react';
import {
  areResizableSvgPropsEqual,
  computeResizableSvgProps,
  ResizableSvgProps,
} from '../../models/ResizableSvgProps';

/** Back icon / left caret */
export const Back = memo((props: ResizableSvgProps) => {
  const c = computeResizableSvgProps({
    ...props,
    natural: { width: 20, height: 20 },
  });
  return (
    <Svg width={c.width} height={c.height} viewBox={c.viewBox} fill="none">
      <Path
        d="M13.25 3.5L6.75 10L13.25 16.5"
        stroke={c.color}
        strokeWidth="2"
      />
    </Svg>
  );
}, areResizableSvgPropsEqual);
