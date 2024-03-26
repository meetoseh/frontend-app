import { ReactElement, useCallback, useContext, useEffect } from 'react';
import { UseRevenueCatOfferingsResult } from './useRevenueCatOfferings';
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { useValuesWithCallbacksEffect } from '../../../../../shared/hooks/useValuesWithCallbacksEffect';
import { describeError } from '../../../../../shared/lib/describeError';
import {
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesStoreProduct,
} from 'react-native-purchases';
import { PurchasesState } from '../../purchases/PurchasesState';
import { Platform } from 'react-native';

export type UseOfferingPriceProps = {
  /** The offerings whose price should be fetched */
  offering: ValueWithCallbacks<UseRevenueCatOfferingsResult>;
  /** The purchases state, which can be used to interact with react-native-purchases */
  purchases: ValueWithCallbacks<PurchasesState>;
};

export type UseOfferingPriceResultLoading = {
  type: 'loading';
  pricesByPlatformProductId: null;
  error: null;
};

export type UseOfferingPriceResultError = {
  type: 'error';
  pricesByPlatformProductId: null;
  error: ReactElement;
};

export type UseOfferingPriceResultSuccess = {
  type: 'success';
  /**
   * For android, the base plan id is included in the key in
   * the format {platformProductId}:{platformProductPlanId}
   */
  pricesByPlatformProductId: Record<
    string,
    { storeProduct: PurchasesStoreProduct; rcPackage: PurchasesPackage }
  >;
};

export type UseOfferingPriceResult =
  | UseOfferingPriceResultLoading
  | UseOfferingPriceResultError
  | UseOfferingPriceResultSuccess;

export const useOfferingPrice = ({
  offering: offeringVWC,
  purchases: purchasesVWC,
}: UseOfferingPriceProps): ValueWithCallbacks<UseOfferingPriceResult> => {
  const loginContextRaw = useContext(LoginContext);
  const result = useWritableValueWithCallbacks<UseOfferingPriceResult>(() =>
    createLoading()
  );

  useEffect(() => {
    return purchasesVWC.get().addLoadRequest();
  }, [purchasesVWC]);

  useValuesWithCallbacksEffect(
    [offeringVWC, purchasesVWC, loginContextRaw.value],
    useCallback(() => {
      const loginContextUnch = loginContextRaw.value.get();
      if (loginContextUnch.state !== 'logged-in') {
        setVWC(result, createLoading(), (a, b) => a.type === b.type);
        return undefined;
      }
      const loginContext = loginContextUnch;

      const offeringUnch = offeringVWC.get();
      if (offeringUnch.type !== 'success') {
        setVWC(result, createLoading(), (a, b) => a.type === b.type);
        return undefined;
      }

      const offering = offeringUnch;

      const purchasesUnch = purchasesVWC.get();
      if (purchasesUnch.loaded === undefined) {
        if (purchasesUnch.error !== null) {
          setVWC(result, createError(purchasesUnch.error));
        } else {
          setVWC(result, createLoading(), (a, b) => a.type === b.type);
        }
        return;
      }

      const purchases = purchasesUnch as Required<typeof purchasesUnch>;

      let active = true;
      const cancelers = new Callbacks<undefined>();
      fetchPrices();
      return () => {
        active = false;
        cancelers.call(undefined);
      };

      async function fetchPricesInner(signal: AbortSignal | undefined) {
        signal?.throwIfAborted();

        const pricesByPlatformProductId: Record<
          string,
          { storeProduct: PurchasesStoreProduct; rcPackage: PurchasesPackage }
        > = {};
        let startedTryingAt = Date.now();
        let rcOfferings: PurchasesOfferings | null = null;
        while (rcOfferings === null) {
          signal?.throwIfAborted();
          try {
            rcOfferings = await purchases.loaded.getOfferings(loginContext);
          } catch (e) {
            if (
              typeof e === 'object' &&
              e !== null &&
              e instanceof Error &&
              e.message.includes('purchases is currently locked')
            ) {
              if (Date.now() - startedTryingAt > 10000) {
                throw e;
              }
              await new Promise((resolve) => setTimeout(resolve, 16));
              continue;
            }
            throw e;
          }
        }
        if (rcOfferings.current === null) {
          throw new Error('RevenueCat current offering not set');
        }
        for (const pkg of offering.offering.packages) {
          let matchingRCProduct: {
            storeProduct: PurchasesStoreProduct;
            rcPackage: PurchasesPackage;
          } | null = null;
          for (const rcPkg of rcOfferings.current.availablePackages) {
            if (pkg.identifier !== rcPkg.identifier) {
              continue;
            }

            if (pkg.platformProductIdentifier !== rcPkg.product.identifier) {
              continue;
            }

            if (Platform.OS === 'android') {
              if (pkg.platformProductPlanIdentifier === null) {
                throw new Error(
                  'missing platformProductPlanIdentifier on android'
                );
              }
              if (rcPkg.product.subscriptionOptions === null) {
                continue;
              }

              let found = false;
              for (const opt of rcPkg.product.subscriptionOptions) {
                if (opt.id === pkg.platformProductPlanIdentifier) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                continue;
              }
            }

            matchingRCProduct = {
              storeProduct: rcPkg.product,
              rcPackage: rcPkg,
            };
            break;
          }

          const pkgId =
            pkg.platformProductIdentifier +
            (pkg.platformProductPlanIdentifier === null
              ? ''
              : ':' + pkg.platformProductPlanIdentifier);

          if (matchingRCProduct === null) {
            throw new Error('No matching RevenueCat package for ' + pkgId);
          }
          pricesByPlatformProductId[pkgId] = matchingRCProduct;
        }
        setVWC(result, createSuccess(pricesByPlatformProductId));
      }

      async function fetchPrices() {
        const controller = new AbortController();
        const signal = controller.signal;
        signal.throwIfAborted ||= () => {
          if (signal.aborted) {
            throw new Error('aborted');
          }
        };
        const doAbort = () => controller.abort();
        cancelers.add(doAbort);
        if (!active) {
          cancelers.remove(doAbort);
          return;
        }

        setVWC(result, createLoading(), (a, b) => a.type === b.type);
        if (!active) {
          cancelers.remove(doAbort);
          return;
        }

        try {
          await fetchPricesInner(signal);
        } catch (e) {
          if (!active) {
            return;
          }
          const err = await describeError(e);
          if (!active) {
            return;
          }
          console.log('error fetching prices:', e);
          setVWC(result, createError(err));
        } finally {
          cancelers.remove(doAbort);
        }
      }
    }, [offeringVWC, purchasesVWC, loginContextRaw.value, result])
  );

  return result;
};

const createLoading = (): UseOfferingPriceResultLoading => ({
  type: 'loading',
  pricesByPlatformProductId: null,
  error: null,
});

const createError = (error: ReactElement): UseOfferingPriceResultError => ({
  type: 'error',
  pricesByPlatformProductId: null,
  error,
});

const createSuccess = (
  pricesByPlatformProductId: Record<
    string,
    { storeProduct: PurchasesStoreProduct; rcPackage: PurchasesPackage }
  >
): UseOfferingPriceResultSuccess => ({
  type: 'success',
  pricesByPlatformProductId,
});
