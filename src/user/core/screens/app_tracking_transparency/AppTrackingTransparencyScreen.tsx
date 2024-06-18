import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OsehScreen } from '../../models/Screen';
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
    ...params,
    __mapped: true,
  }),
  initInstanceResources: (ctx, screen, refreshScreen) => {
    return {
      ready: createWritableValueWithCallbacks(true),
      dispose: () => {},
    };
  },
  component: (props) => <AppTrackingTransparency {...props} />,
};
