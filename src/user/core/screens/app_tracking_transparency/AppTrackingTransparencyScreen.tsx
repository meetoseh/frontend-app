import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OsehScreen } from '../../models/Screen';
import { convertScreenConfigurableTriggerWithOldVersion } from '../../models/ScreenConfigurableTrigger';
import { AppTrackingTransparency } from './AppTrackingTransparency';
import {
  AppTrackingTransparencyAPIParams,
  AppTrackingTransparencyMappedParams,
} from './AppTrackingTransparencyParams';
import { AppTrackingTransparencyResources } from './AppTrackingTransparencyResources';

/**
 * Shows the native app tracking transparency popup
 */
export const AppTrackingTransparencyScreen: OsehScreen<
  'app_tracking_transparency',
  AppTrackingTransparencyResources,
  AppTrackingTransparencyAPIParams,
  AppTrackingTransparencyMappedParams
> = {
  slug: 'app_tracking_transparency',
  paramMapper: (params) => ({
    success: convertScreenConfigurableTriggerWithOldVersion(
      params.success,
      params.successv75
    ),
    failure: convertScreenConfigurableTriggerWithOldVersion(
      params.failure,
      params.failurev75
    ),
    __mapped: true,
  }),
  initInstanceResources: () => {
    return {
      ready: createWritableValueWithCallbacks(true),
      dispose: () => {},
    };
  },
  component: (props) => <AppTrackingTransparency {...props} />,
};
