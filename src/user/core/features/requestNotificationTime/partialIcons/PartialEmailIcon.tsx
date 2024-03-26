import { ReactElement } from 'react';
import { PartialIconProps } from './PartialIconProps';
import { colorToCSS } from '../../../../../shared/anim/svgUtils';
import * as SVG from 'react-native-svg';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';

/**
 * Renders an animatable icon representing an email app, when placed within an
 * SVG element.  The icon is centered at (50, 50) and is sized to fit a 100x100
 * viewBox.
 */
export const PartialEmailIcon = ({ color }: PartialIconProps): ReactElement => {
  return (
    <>
      <RenderGuardedComponent
        props={color}
        component={(stroke) => {
          const strokeCSS = colorToCSS(stroke);
          return (
            <>
              <SVG.Path
                stroke={strokeCSS}
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M 30.5 35 L 69.5 35 C 70.605 35 71.5 35.895 71.5 37 L 71.5 63 C 71.5 64.105 70.605 65 69.5 65 L 30.5 65 C 29.395 65 28.5 64.105 28.5 63 L 28.5 37 C 28.5 35.895 29.395 35 30.5 35 Z M 29.189 35.565 L 50 53 L 70.81 35.69"
                fill="none"
              />
            </>
          );
        }}
      />
    </>
  );
};
