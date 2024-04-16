import { LinearGradientState } from '../shared/anim/LinearGradientBackground';
import { SvgLinearGradientBackgroundState } from '../shared/anim/SvgLinearGradientBackground';

export const WHITE = '#FFFFFF';
/**
 * Used, for example, to indicate that a transparent button is
 * being pressed.
 */
export const TRANSPARENT_WHITE = 'rgba(255, 255, 255, 0.2)';
export const MORE_TRANSPARENT_WHITE = 'rgba(255, 255, 255, 0.15)';
export const TRANSPARENT_BLACK = 'rgba(0, 0, 0, 0.2)';
export const MORE_TRANSPARENT_BLACK = 'rgba(0, 0, 0, 0.15)';
export const PRIMARY_DEFAULT = '#446266';
export const PRIMARY_DEFAULT_BACKGROUND = '#8A9A9D';
export const PRIMARY_LIGHT = '#eaeaeb';
export const PRIMARY_DARK = '#1a383c';
export const BLACK = '#000000';
export const ERROR_DEFAULT = '#BA1A1A';
export const ERROR_LIGHT = '#EED5D3';
export const NEW_ERROR_LIGHT = '#d0382f';
export const TRANSPARENT = 'rgba(0, 0, 0, 0)';
export const HALF_TRANSPARENT_WHITE = 'rgba(255, 255, 255, 0.5)';
export const SLIGHTLY_TRANSPARENT_WHITE = 'rgba(255, 255, 255, 0.9)';
export const BLACK_OVERLAY = 'rgba(0, 0, 0, 0.5)';
export const BLACK_SHADOW = 'rgba(0, 0, 0, 0.25)';
export const PROMPT_BACKGROUND = 'rgba(239, 240, 256, 0.95)';
export const PROFILE_PICTURE_BACKGROUND = '#c9d6d6';

/**
 * Used as the pressed variant for inverted buttons
 */
export const GRAYSCALE_LIGHT_GRAY = '#F2F2F3';
/**
 * Used for disabled buttons as the background color.
 */
export const GRAYSCALE_MID_GRAY = '#C8CDD0';
/**
 * Used for disabled buttons as the text color.
 */
export const GRAYSCALE_DARK_GRAY = '#3F484A';
export const GRAYSCALE_OFF_BLACK = '#160808';
export const GRAYSCALE_BODY = '#666060';
export const GRAYSCALE_LINE = '#DBD7D7';
export const GRAYSCALE_BLACK = '#191c1d';
export const GRAYSCALE_WHITE = '#F9F9F9';

export const GRAYSCALE_BLACK_BACKGROUND = '#191c1d80';

export const NEW_GRAYSCALE_DARK_GRAY = '#232323';
export const NEW_GRAYSCALE_BORDER = '#383838';
export const GRAYSCALE_DISABLED = '#8B8E90';

export const WHITISH_BLUE = '#EAF0FF';
export const HALF_TRANSPARENT_WHITISH_BLUE = 'rgba(234, 240, 255, 0.5)';
export const TRANSPARENT_LIGHT_GRAY = 'rgba(245, 245, 245, 0.7)';
export const TRANSPARENT_PRIMARY_DEFAULT = 'rgba(68, 98, 102, 0.4)';
export const SLIGHTLY_TRANSPARENT_PRIMARY_DEFAULT =
  'background: rgba(68, 98, 102, 0.9)';

export const STANDARD_BLACK_GRAY_GRADIENT_WEBGL: LinearGradientState = {
  stops: [
    {
      color: [0, 0, 0, 1],
      offset: 0,
    },
    {
      color: [25, 28, 29, 1],
      offset: 0.37,
    },
  ],
  angleDegreesClockwiseFromTop: 180,
};

export const STANDARD_BLACK_GRAY_GRADIENT_SVG: SvgLinearGradientBackgroundState =
  {
    stop1: {
      color: [0, 0, 0, 1],
      offset: 0,
    },
    stop2: {
      color: [25, 28, 29, 1],
      offset: 0.37,
    },
    x1: 0.5,
    y1: 1,
    x2: 0.5,
    y2: 0,
  };

export const DARK_BLACK_GRAY_GRADIENT_SVG: SvgLinearGradientBackgroundState = {
  stop1: {
    color: [1, 1, 1, 1],
    offset: 0,
  },
  stop2: {
    color: [20, 25, 28, 1],
    offset: 1,
  },
  x1: 0.5,
  y1: 1,
  x2: 0.5,
  y2: 0,
};

export const STANDARD_ACTIVE_GRADIENT_SVG: SvgLinearGradientBackgroundState = {
  stop1: {
    color: [87, 184, 162, 1],
    offset: 0,
  },
  stop2: {
    color: [18, 127, 125, 1],
    offset: 1,
  },
  x1: 0.4577,
  y1: 0.31122,
  x2: 0.75376,
  y2: 0.95651,
};

export const STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG: SvgLinearGradientBackgroundState =
  {
    stop1: { color: [1, 1, 1, 1], offset: 0 },
    stop2: { color: [20, 25, 28, 1], offset: 1 },
    x1: 0.5,
    y1: 1,
    x2: 0.5,
    y2: 0,
  };

export const STANDARD_DARK_BLACK_GRAY_SOFT_WIPE_DOWN_GRADIENT_SVG: SvgLinearGradientBackgroundState =
  {
    stop1: { color: [20, 25, 28, 0], offset: 0 },
    stop2: { color: [20, 25, 28, 1], offset: 1 },
    x1: 0.5,
    y1: 1,
    x2: 0.5,
    y2: 0,
  };

export const STANDARD_DARK_BLACK_GRAY_SOFT_WIPE_UP_GRADIENT_SVG: SvgLinearGradientBackgroundState =
  {
    stop1: { color: [20, 25, 28, 1], offset: 0 },
    stop2: { color: [20, 25, 28, 0], offset: 1 },
    x1: 0.5,
    y1: 1,
    x2: 0.5,
    y2: 0,
  };
