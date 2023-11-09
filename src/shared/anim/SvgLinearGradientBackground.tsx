import { View, ViewStyle } from "react-native";
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from "./VariableStrategyProps";
import * as SVG from "react-native-svg";
import { RenderGuardedComponent } from "../components/RenderGuardedComponent";
import {
  colorByteRGBFractionalAlphaToCSS,
  makeSVGNumber,
  simpleColorToCss,
} from "./svgUtils";

export type SvgColorStop = {
  /** The stop color as a 0-255, 0-255, 0-255, 0-1 rgba value */
  color: [number, number, number, number];
  /** 0-1 */
  offset: number;
};

export type SvgLinearGradientBackgroundState = {
  stop1: SvgColorStop;
  stop2: SvgColorStop;

  /**
   * 0-1 value representing the % from the left of the first reference point.
   * Sets the direction of the gradient
   */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type SvgLinearGradientBackgroundProps = {
  state: VariableStrategyProps<SvgLinearGradientBackgroundState>;
  containerStyle?: ViewStyle;
};

const areColorsEqual = (
  a: [number, number, number, number],
  b: [number, number, number, number]
) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

/**
 * Renders a 2-stop linear gradient behind the children using react-native-svg
 * as the rendering engine. Skips rendering the svg when the stops are the same
 * color, for performance.
 *
 * This seems to be less likely to get a corrupted gradient compared to
 * the webgl version (LinearGradientBackground). Performance wise, it's
 * about the same. Feature wise it's limited to two stops and the border
 * isn't as pretty, but has more control over the direction.
 */
export const SvgLinearGradientBackground = ({
  state: stateRaw,
  containerStyle,
  children,
}: React.PropsWithChildren<SvgLinearGradientBackgroundProps>) => {
  const stateVWC = useVariableStrategyPropsAsValueWithCallbacks(stateRaw);

  const svgn = makeSVGNumber;

  return (
    <View style={{ position: "relative", ...containerStyle }}>
      <RenderGuardedComponent
        props={stateVWC}
        component={(state) => (
          <>
            {!areColorsEqual(state.stop1.color, state.stop2.color) ? (
              <SVG.Svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
              >
                <SVG.Defs>
                  <SVG.LinearGradient
                    id="grad"
                    gradientUnits="objectBoundingBox"
                    x1={svgn(state.x1)}
                    y1={svgn(state.y1)}
                    x2={svgn(state.x2)}
                    y2={svgn(state.y2)}
                  >
                    <SVG.Stop
                      offset={svgn(state.stop1.offset)}
                      stopColor={simpleColorToCss(state.stop1.color)}
                      stopOpacity={state.stop1.color[3]}
                    />
                    <SVG.Stop
                      offset={svgn(state.stop2.offset)}
                      stopColor={simpleColorToCss(state.stop2.color)}
                      stopOpacity={state.stop2.color[3]}
                    />
                  </SVG.LinearGradient>
                </SVG.Defs>
                <SVG.Rect x="0" y="0" width="1" height="1" fill="url(#grad)" />
              </SVG.Svg>
            ) : (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: colorByteRGBFractionalAlphaToCSS(
                    state.stop1.color
                  ),
                }}
              />
            )}
          </>
        )}
      />
      {children}
    </View>
  );
};
