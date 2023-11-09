import { ReactElement } from "react";
import { PartialIconProps } from "./PartialIconProps";
import { colorToCSS, makeSVGNumber } from "../../../../../shared/anim/svgUtils";
import * as SVG from "react-native-svg";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";

/**
 * Renders an animatable icon representing our app, when placed within an
 * SVG element. The icon is centered at (50, 50) and is sized to fit a 100x100
 * viewBox.
 */
export const PartialPushIcon = ({ color }: PartialIconProps): ReactElement => {
  const svgn = makeSVGNumber;

  // This is an attempt to avoid recomputing the path when updating the
  // stroke color (which does not cause this component to rerender, hence
  // no need to useMemo). I'm unsure if it works.
  const gContents = (
    <>
      <SVG.Circle cx="66.7" cy="106.97" r="64.2" />
      <SVG.Path
        d="M131.84,184.65a66.24,66.24,0,0,1-11-63.33C128.41,100,147.24,84,169.33,79.47a65.09,65.09,0,0,1,32.54,125.86,66,66,0,0,1-8,2"
        transform="translate(-66.14 -75.67)"
      />
    </>
  );

  return (
    <SVG.G
      transform={`translate(25, 25), scale(${svgn(50 / 183.65)}, ${svgn(
        50 / 183.65
      )})`}
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth={svgn(183.65 * 0.04)}
      fill="none"
    >
      <RenderGuardedComponent
        props={color}
        component={(stroke) => (
          <SVG.G stroke={colorToCSS(stroke)}>{gContents}</SVG.G>
        )}
      />
    </SVG.G>
  );
};
