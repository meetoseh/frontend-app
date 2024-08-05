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

export type AddPushTokenAPIParams = {
  /** entrance transition */
  entrance: StandardScreenTransition;

  // image docs in mapped params as that's more likely to be hovered
  image: {
    ios: ScreenImageWithConfigurableSizeAPI;
    other: ScreenImageWithConfigurableSizeAPI;
  } | null;

  /** The header message */
  header: string;

  /** The subheader message */
  message: string | null;

  /**
   * True to include a section to configure when they receive push reminders,
   * false not to include that section.
   */
  times: boolean;

  /** Handles the call to action after they input a phone number */
  cta: {
    /** The text on the button. */
    text: string;

    /** They click the CTA and agree to the native popup */
    success: ScreenConfigurableTriggerTransitioningPreferredAPI;
    successv75: ScreenConfigurableTriggerTransitioningTemporaryAPI;

    /** The click the CTA but do not agree to the native popup */
    failure: ScreenConfigurableTriggerTransitioningPreferredAPI;
    failurev75: ScreenConfigurableTriggerTransitioningTemporaryAPI;

    /** The exit transition to use */
    exit: StandardScreenTransition;
  };

  /**
   * Configures the skip/back button. The location of this button depends on
   * the type of nav
   */
  back: {
    /** The exit transition to use */
    exit: StandardScreenTransition;

    /** The trigger with no parameters */
    trigger: ScreenConfigurableTriggerTransitioningPreferredAPI;
    triggerv75: ScreenConfigurableTriggerTransitioningTemporaryAPI;
  };

  /**
   * Determines if we should use the standard bottom and top bar vs just
   * a skip button below the primary cta
   */
  nav:
    | {
        /** just a back button as a link button below the cta */
        type: 'link-button';

        /** The text on the skip button which handles "back" */
        back: string;
      }
    | {
        /** an x button in the upper right */
        type: 'x';
      }
    | {
        /** a back arrow in the upper left */
        type: 'arrow';
      }
    | {
        /** standard bottom and top bar */
        type: 'header-and-footer';

        /** The title of the screen in the top bar */
        title: string;

        /** For if the user taps the home button in the bottom bar */
        home: {
          trigger: ScreenConfigurableTriggerTransitioningPreferredAPI;
          triggerv75: ScreenConfigurableTriggerTransitioningTemporaryAPI;
          // uses fade exit to avoid nesting x-enum-discriminator
        };

        /** For if the user taps the series button in the bottom bar */
        series: {
          trigger: ScreenConfigurableTriggerTransitioningPreferredAPI;
          triggerv75: ScreenConfigurableTriggerTransitioningTemporaryAPI;
          // uses fade exit to avoid nesting x-enum-discriminator
        };
      };
};

export type AddPushTokenMappedParams = {
  /** entrance transition */
  entrance: StandardScreenTransition;

  /** The header message */
  header: string;

  /** The subheader message */
  message: string | null;

  /** The image to show at the top, if any */
  image: {
    /** The image on iOS */
    ios: ScreenImageWithConfigurableSizeParsed;

    /** The image on everything else */
    other: ScreenImageWithConfigurableSizeParsed;
  } | null;

  /**
   * True to include a section to configure when they receive push reminders,
   * false not to include that section.
   */
  times: boolean;

  /** Handles the call to action after they input a phone number */
  cta: {
    /** The text on the button. */
    text: string;

    /** They click the CTA and agree to the native popup */
    success: ScreenConfigurableTrigger;

    /** The click the CTA but do not agree to the native popup */
    failure: ScreenConfigurableTrigger;

    /** The exit transition to use */
    exit: StandardScreenTransition;
  };

  /**
   * Configures the skip/back button. The location of this button depends on
   * the type of nav
   */
  back: {
    /** The exit transition to use */
    exit: StandardScreenTransition;

    /** The trigger with no parameters */
    trigger: ScreenConfigurableTrigger;
  };

  /**
   * Determines if we should use the standard bottom and top bar vs just
   * a skip button below the primary cta
   */
  nav:
    | {
        /** just a back button as a link button below the cta */
        type: 'link-button';

        /** The text on the skip button which handles "back" */
        back: string;
      }
    | {
        /** an x button in the upper right */
        type: 'x';
      }
    | {
        /** a back arrow in the upper left */
        type: 'arrow';
      }
    | {
        /** standard bottom and top bar */
        type: 'header-and-footer';

        /** The title of the screen in the top bar */
        title: string;

        /** For if the user taps the home button in the bottom bar */
        home: {
          trigger: ScreenConfigurableTrigger;
          // uses fade exit to avoid nesting x-enum-discriminator
        };

        /** For if the user taps the series button in the bottom bar */
        series: {
          trigger: ScreenConfigurableTrigger;
          // uses fade exit to avoid nesting x-enum-discriminator
        };
      };

  __mapped: true;
};
