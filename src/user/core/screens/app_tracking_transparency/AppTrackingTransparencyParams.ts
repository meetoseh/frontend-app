import {
  ScreenConfigurableTrigger,
  ScreenConfigurableTriggerTransitioningPreferredAPI,
  ScreenConfigurableTriggerTransitioningTemporaryAPI,
} from '../../models/ScreenConfigurableTrigger';

export type AppTrackingTransparencyAPIParams = {
  /** The client flow to trigger if they accept the native dialog */
  success: ScreenConfigurableTriggerTransitioningPreferredAPI;
  successv75: ScreenConfigurableTriggerTransitioningTemporaryAPI;

  /** The client flow to trigger if they reject the native dialog */
  failure: ScreenConfigurableTriggerTransitioningPreferredAPI;
  failurev75: ScreenConfigurableTriggerTransitioningTemporaryAPI;
};

export type AppTrackingTransparencyMappedParams = {
  /** The client flow to trigger if they accept the native dialog */
  success: ScreenConfigurableTrigger;
  /** The client flow to trigger if they reject the native dialog */
  failure: ScreenConfigurableTrigger;
  __mapped: true;
};
