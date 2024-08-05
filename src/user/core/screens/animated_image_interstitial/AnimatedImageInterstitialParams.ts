import { StandardScreenTransition } from '../../../../shared/hooks/useStandardTransitions';
import {
  ScreenConfigurableTrigger,
  ScreenConfigurableTriggerTransitioningPreferredAPI,
  ScreenConfigurableTriggerTransitioningTemporaryAPI,
} from '../../models/ScreenConfigurableTrigger';
import {
  ScreenImageWithConfigurableSizeAPI,
  ScreenImageWithConfigurableSizeParsed,
} from '../../models/ScreenImage';
import {
  ScreenTextContentAPI,
  ScreenTextContentMapped,
} from '../../models/ScreenTextContentMapped';
import { PIAnimation } from './models/PIAnimation';

export type AnimatedImageInterstitialAPIParams = {
  /** Message at the top, usually to provide context */
  top: string;

  /** first image */
  image1: ScreenImageWithConfigurableSizeAPI;

  /** second image */
  image2: ScreenImageWithConfigurableSizeAPI;

  /** animation for the first image */
  animation1: PIAnimation;

  /** animation for the second image */
  animation2: PIAnimation;

  /** how much height to reserve for the animation, in pixels */
  height: number;

  /** text content below animation */
  content: ScreenTextContentAPI;

  /** docs in mapped params since it's more likely to be hovered */
  assumed_content_height: number;

  /** The call-to-action text on the button. */
  cta: string;

  /** entrance transition */
  entrance: StandardScreenTransition;

  /** exit transition for cta */
  exit: StandardScreenTransition;

  /** The client flow to trigger when they hit the button with no parameters */
  trigger: ScreenConfigurableTriggerTransitioningPreferredAPI;
  triggerv75: ScreenConfigurableTriggerTransitioningTemporaryAPI;
};

export type AnimatedImageInterstitialMappedParams = Omit<
  AnimatedImageInterstitialAPIParams,
  | 'image1'
  | 'image2'
  | 'content'
  | 'assumed_content_height'
  | 'trigger'
  | 'triggerv75'
> & {
  /** first image */
  image1: ScreenImageWithConfigurableSizeParsed;

  /** second image */
  image2: ScreenImageWithConfigurableSizeParsed;

  /** The text content for the screen */
  content: ScreenTextContentMapped;

  /**
   * The assumed height in pixels of the header + text, used in the calculation
   * for determining which image breakpoint to use. Generally, 160px is a good
   * default.
   */
  assumedContentHeight: number;

  /** The client flow to trigger when they hit the button with no parameters */
  trigger: ScreenConfigurableTrigger;

  __mapped: true;
};
