import { ReactElement } from 'react';
import { SvgLinearGradient } from '../anim/SvgLinearGradient';
import { STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG } from '../../styling/colors';

/**
 * An element which fills the background as if using grid-area: 1 / 1 / -1 / -1
 * and has the standard dark gray gradient background.
 */
export const GridDarkGrayBackground = (): ReactElement => {
  return <SvgLinearGradient state={STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG} />;
};
