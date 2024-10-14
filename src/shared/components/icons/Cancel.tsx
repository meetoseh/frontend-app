import { memo } from 'react';
import {
  areResizableSvgPropsEqual,
  computeResizableSvgProps,
  ResizableSvgProps,
} from '../../models/ResizableSvgProps';
import Svg, { Circle, Path } from 'react-native-svg';

/** Cancel icon / x inside circle, background is color, foreground is color2 */
export const Cancel = memo((props: ResizableSvgProps & { color2: string }) => {
  const c = computeResizableSvgProps({
    ...props,
    natural: { width: 30, height: 30 },
  });
  return (
    <Svg width={c.width} height={c.height} viewBox={c.viewBox} fill="none">
      <Circle cx="15" cy="15" r="15" fill={props.color} />
      <Path
        d="M21.1289 9.64292L19.8952 8.29167L15.0039 13.6488L10.1127 8.29167L8.87891 9.64292L13.7702 15L8.87891 20.3571L10.1127 21.7083L15.0039 16.3513L19.8952 21.7083L21.1289 20.3571L16.2377 15L21.1289 9.64292Z"
        fill={props.color2}
      />
    </Svg>
  );
}, areResizableSvgPropsEqual);
