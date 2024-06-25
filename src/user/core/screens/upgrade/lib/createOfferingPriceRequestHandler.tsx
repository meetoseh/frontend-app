import {
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesStoreProduct,
} from 'react-native-purchases';
import { LoginContextValueLoggedIn } from '../../../../../shared/contexts/LoginContext';
import { createGetDataFromRefUsingSignal } from '../../../../../shared/images/createGetDataFromRefUsingSignal';
import { CancelablePromise } from '../../../../../shared/lib/CancelablePromise';
import { getJwtExpiration } from '../../../../../shared/lib/getJwtExpiration';
import {
  RequestHandler,
  Result,
} from '../../../../../shared/requests/RequestHandler';
import { Platform } from 'react-native';
import { RevenueCatPackage } from '../models/RevenueCatPackage';

export type OfferingPriceRef = {
  /** The user to fetch offering information for */
  user: LoginContextValueLoggedIn;
  /** The identifier for which offering to use */
  offeringIdentifier: string;
  /** The available offerings */
  offerings: PurchasesOfferings;
  /** The product to fetch */
  platformProductIdentifier: string;
  /** The plan within the product to fetch; this is for google */
  platformProductPlanIdentifier: string | null;
};

/**
 * Creates a request handler capable of fetching the price corresponding to
 * a particular product.
 */
export const createOfferingPriceRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<OfferingPriceRef, OfferingPriceRef, PurchasesPackage> => {
  return new RequestHandler({
    getRefUid,
    getDataFromRef,
    compareRefs,
    logConfig: { logging },
    cacheConfig: { maxStale, keepActiveRequestsIntoStale: true },
    retryConfig: { maxRetries },
  });
};

const getRefUid = (ref: OfferingPriceRef): string =>
  ref.user.userAttributes.sub +
  '@' +
  ref.platformProductIdentifier +
  ':' +
  (ref.platformProductPlanIdentifier ?? '');
const getDataFromRef: (
  ref: OfferingPriceRef
) => CancelablePromise<Result<PurchasesPackage>> =
  createGetDataFromRefUsingSignal({
    inner: async (ref, signal) => {
      const offering =
        ref.offerings.current?.identifier === ref.offeringIdentifier
          ? ref.offerings.current
          : Object.values(ref.offerings.all).find(
              (o) => o.identifier === ref.offeringIdentifier
            );
      if (offering === undefined) {
        throw new Error(
          `Offering not found: ${ref.offeringIdentifier} (current: ${ref.offerings.current?.identifier})`
        );
      }

      const pkg = offering.availablePackages.find((pkg) =>
        doesPackageMatchRef(pkg, ref)
      );
      if (pkg === undefined) {
        throw new Error(
          `Package not found: ${ref.platformProductIdentifier} (plan: ${ref.platformProductPlanIdentifier})`
        );
      }
      return pkg;
    },
    isExpired: (ref, nowServer) =>
      getJwtExpiration(ref.user.authTokens.idToken) < nowServer,
  });
const compareRefs = (a: OfferingPriceRef, b: OfferingPriceRef): number =>
  getJwtExpiration(b.user.authTokens.idToken) -
  getJwtExpiration(a.user.authTokens.idToken);

const doesPackageMatchRef: (
  pkg: PurchasesPackage,
  ref: OfferingPriceRef
) => boolean = Platform.select({
  android: (pkg, ref) => {
    if (pkg.product.defaultOption === null) {
      throw new Error('missing defaultOption on package on android');
    }
    if (ref.platformProductPlanIdentifier === null) {
      throw new Error('missing platformProductPlanIdentifier on android');
    }
    return (
      pkg.product.defaultOption.id === ref.platformProductPlanIdentifier &&
      pkg.product.defaultOption.productId === ref.platformProductIdentifier
    );
  },
  default: (pkg, ref) => {
    if (ref.platformProductPlanIdentifier !== null) {
      throw new Error('unexpected platformProductPlanIdentifier on ios');
    }
    return pkg.product.identifier === ref.platformProductIdentifier;
  },
});
