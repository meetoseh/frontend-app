import { ReactElement } from "react";
import { PartialIconProps } from "./PartialIconProps";
import { colorToCSS, makeSVGNumber } from "../../../../../shared/anim/svgUtils";
import * as SVG from "react-native-svg";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";

/**
 * Renders an animatable icon representing an SMS app, when placed within an
 * SVG element.  The icon is centered at (50, 50) and is sized to fit a 100x100
 * viewBox.
 */
export const PartialPhoneIcon = ({ color }: PartialIconProps): ReactElement => {
  const strokeWidth = 2;
  const svgn = makeSVGNumber;
  const pathProps = {
    d: "M 25 45 C 25 32.85 36.193 23 50 23 M 50 23 C 63.807 23 75 32.85 75 45 C 75 57.15 63.807 67 50 67 C 48.864 67 48.494 67.04 47.398 66.911 M 33.342 61.405 C 28.222 57.376 25 51.519 25 45 M 48.227 66.989 C 43.634 65.919 41.62 72.591 30.953 73.258 C 34.953 69.258 37.263 64.086 33.336 61.399",
    fill: "none",
    strokeWidth: svgn(strokeWidth),
    strokeMiterlimit: "10",
    strokeLinejoin: "round",
  } as const;

  return (
    <RenderGuardedComponent
      props={color}
      component={(strokeRaw) => {
        const stroke = colorToCSS(strokeRaw);
        return (
          <>
            <SVG.Path stroke={stroke} {...pathProps} />
          </>
        );
      }}
    />
  );
};
