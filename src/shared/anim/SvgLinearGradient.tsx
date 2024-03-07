import { ReactElement } from 'react';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import {
  colorByteRGBFractionalAlphaToCSS,
  makeSVGNumber as svgn,
  simpleColorToCss,
} from './svgUtils';
import { View } from 'react-native';

export type SvgColorStop = {
  /** The stop color as a 0-255, 0-255, 0-255, 0-1 rgba value */
  color: [number, number, number, number];
  /** 0-1 */
  offset: number;
};

export type SvgLinearGradientState =
  | {
      stop1: SvgColorStop;
      stop2: SvgColorStop;
      stops?: undefined;

      /**
       * 0-1 value representing the % from the left of the first reference point.
       * Sets the direction of the gradient
       */
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
  | {
      stop1?: undefined;
      stop2?: undefined;
      stops: SvgColorStop[];

      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };

const areColorsEqual = (
  a: [number, number, number, number],
  b: [number, number, number, number]
) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

export const SvgLinearGradient = ({
  state,
}: {
  state: SvgLinearGradientState;
}): ReactElement => {
  if (
    state.stop1 !== undefined &&
    areColorsEqual(state.stop1.color, state.stop2.color)
  ) {
    return <SolidColorView color={state.stop1.color} />;
  }

  if (state.stops !== undefined && state.stops.length === 0) {
    return <SolidColorView color={[0, 0, 0, 0]} />;
  }

  if (
    state.stops !== undefined &&
    state.stops.every((stop) =>
      areColorsEqual(stop.color, state.stops[0].color)
    )
  ) {
    return <SolidColorView color={state.stops[0].color} />;
  }

  const stops: SvgColorStop[] =
    state.stops !== undefined ? state.stops : [state.stop1, state.stop2];
  const stopElements: ReactElement[] = stops.map((stop, i) => (
    <Stop
      key={i}
      offset={svgn(stop.offset)}
      stopColor={simpleColorToCss(stop.color)}
      stopOpacity={stop.color[3]}
    />
  ));

  return (
    <Svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient
          id="grad"
          gradientUnits="objectBoundingBox"
          x1={svgn(state.x1)}
          y1={svgn(state.y1)}
          x2={svgn(state.x2)}
          y2={svgn(state.y2)}
        >
          {stopElements}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="1" height="1" fill="url(#grad)" />
    </Svg>
  );
};

const SolidColorView = ({
  color,
}: {
  color: [number, number, number, number];
}) => (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colorByteRGBFractionalAlphaToCSS(color),
    }}
  />
);
