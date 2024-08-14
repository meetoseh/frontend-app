import { Svg, Path } from 'react-native-svg';
import { memo } from 'react';
import {
  areResizableSvgPropsEqual,
  computeResizableSvgProps,
  ResizableSvgProps,
} from '../../models/ResizableSvgProps';

/** Forward icon / right caret */
export const Forward = memo((props: ResizableSvgProps) => {
  const c = computeResizableSvgProps({
    ...props,
    natural: { width: 20, height: 20 },
  });
  return (
    <Svg width={c.width} height={c.height} viewBox={c.viewBox} fill="none">
      <Path d="M6.75 3.5L13.25 10L6.75 16.5" stroke={c.color} strokeWidth="2" />
    </Svg>
  );
}, areResizableSvgPropsEqual);
