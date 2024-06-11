import { apiFetch } from '../../../../../shared/lib/apiFetch';
import { LoginContextValueLoggedIn } from '../../../../../shared/contexts/LoginContext';
import { createGetDataFromRefUsingSignal } from '../../../../../shared/images/createGetDataFromRefUsingSignal';
import { CancelablePromise } from '../../../../../shared/lib/CancelablePromise';
import { getJwtExpiration } from '../../../../../shared/lib/getJwtExpiration';
import {
  RequestHandler,
  Result,
} from '../../../../../shared/requests/RequestHandler';
import Purchases, { PurchasesOfferings } from 'react-native-purchases';
import { Platform } from 'react-native';

/**
 * Creates a request handler capable of fetching the revenue cat offerings
 * for the current user. This is only in native, where we use revenue cat
 * directly.
 */
export const createPurchasesOfferingsRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<
  LoginContextValueLoggedIn,
  LoginContextValueLoggedIn,
  PurchasesOfferings
> => {
  return new RequestHandler({
    getRefUid,
    getDataFromRef,
    compareRefs,
    logConfig: { logging },
    cacheConfig: { maxStale, keepActiveRequestsIntoStale: true },
    retryConfig: { maxRetries },
  });
};

const getRefUid = (ref: LoginContextValueLoggedIn): string =>
  ref.userAttributes.sub;
const getDataFromRef: (
  ref: LoginContextValueLoggedIn
) => CancelablePromise<Result<PurchasesOfferings>> =
  createGetDataFromRefUsingSignal({
    inner: async (ref, signal) => {
      const response = await apiFetch(
        '/api/1/users/me/revenue_cat_id',
        {
          method: 'GET',
          signal,
        },
        ref
      );
      if (!response.ok) {
        throw response;
      }
      if (signal.aborted) {
        throw new Error('canceled');
      }
      const data: { revenue_cat_id: string } = await response.json();
      const revenueCatID = data.revenue_cat_id;
      const apiKey = Platform.select({
        ios: 'appl_iUUQsQeQYmaFsfylOIVhryaoUNa',
        android: 'goog_ykJYeTeXNtUcUZkeqfTOxGTBicI',
        default: undefined,
      });
      if (apiKey === undefined) {
        throw new Error('not implemented');
      }
      Purchases.configure({
        apiKey,
        appUserID: revenueCatID,
        // Not necessary to enforce entitlements client-side as we don't unlock any
        // client-side behavior
        entitlementVerificationMode:
          Purchases.ENTITLEMENT_VERIFICATION_MODE.DISABLED,
      });
      if (signal.aborted) {
        throw new Error('canceled');
      }
      return await Purchases.getOfferings();
    },
    isExpired: (ref, nowServer) =>
      getJwtExpiration(ref.authTokens.idToken) < nowServer,
  });
const compareRefs = (
  a: LoginContextValueLoggedIn,
  b: LoginContextValueLoggedIn
): number =>
  getJwtExpiration(b.authTokens.idToken) -
  getJwtExpiration(a.authTokens.idToken);
