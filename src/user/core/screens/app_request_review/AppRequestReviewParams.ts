import {
  ScreenConfigurableTrigger,
  ScreenConfigurableTriggerTransitioningPreferredAPI,
  ScreenConfigurableTriggerTransitioningTemporaryAPI,
} from '../../models/ScreenConfigurableTrigger';

export type AppRequestReviewAPIParams = {
  /** The client flow to trigger after presenting the native popup */
  trigger: ScreenConfigurableTriggerTransitioningPreferredAPI;
  triggerv75: ScreenConfigurableTriggerTransitioningTemporaryAPI;
};

export type AppRequestReviewMappedParams = {
  /** The client flow to trigger after presenting the native popup */
  trigger: ScreenConfigurableTrigger;
  __mapped: true;
};
