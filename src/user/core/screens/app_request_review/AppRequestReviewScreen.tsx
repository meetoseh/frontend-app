import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OsehScreen } from '../../models/Screen';
import { AppRequestReview } from './AppRequestReview';
import {
  AppRequestReviewAPIParams,
  AppRequestReviewMappedParams,
} from './AppRequestReviewParams';
import { AppRequestReviewResources } from './AppRequestReviewResources';

/**
 * An extremely basic screen which shows the native app review request
 * popup to the user.
 */
export const AppRequestReviewScreen: OsehScreen<
  'app_review_request',
  AppRequestReviewResources,
  AppRequestReviewAPIParams,
  AppRequestReviewMappedParams
> = {
  slug: 'app_review_request',
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
  component: (props) => <AppRequestReview {...props} />,
};
