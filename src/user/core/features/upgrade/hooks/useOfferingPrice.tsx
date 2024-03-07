import { ReactElement, useCallback, useContext } from 'react';
import { UseRevenueCatOfferingsResult } from './useRevenueCatOfferings';
import { PurchasesStoreProduct } from '../models/PurchasesStoreProduct';
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { useValuesWithCallbacksEffect } from '../../../../../shared/hooks/useValuesWithCallbacksEffect';
import { describeError } from '../../../../../shared/lib/describeError';

export type UseOfferingPriceProps = {
  /** The offerings whose price should be fetched */
  offering: ValueWithCallbacks<UseRevenueCatOfferingsResult>;
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
  pricesByPlatformProductId: Record<string, PurchasesStoreProduct>;
};

export type UseOfferingPriceResult =
  | UseOfferingPriceResultLoading
  | UseOfferingPriceResultError
  | UseOfferingPriceResultSuccess;

// For testing purposes right now
const fixedPrices: Record<string, PurchasesStoreProduct> = {
  'pro:p1m': {
    price: 13,
    currencyCode: 'usd',
    priceString: '$13',
    productCategory: 'SUBSCRIPTION',
    defaultOption: {
      pricingPhases: [
        {
          billingPeriod: { iso8601: 'P1M' },
          recurrenceMode: 1,
          billingCycleCount: null,
          price: {
            formatted: '$13',
            amountMicros: 13000000,
            currencyCode: 'usd',
          },
          offerPaymentMode: null,
        },
      ],
    },
  },
  'pro:p1y': {
    price: 100,
    currencyCode: 'usd',
    priceString: '$99',
    productCategory: 'SUBSCRIPTION',
    defaultOption: {
      pricingPhases: [
        {
          billingPeriod: { iso8601: 'P1Y' },
          recurrenceMode: 1,
          billingCycleCount: null,
          price: {
            formatted: '$99',
            amountMicros: 99000000,
            currencyCode: 'usd',
          },
          offerPaymentMode: null,
        },
      ],
    },
  },
  'pro:lifetime': {
    price: 297,
    currencyCode: 'usd',
    priceString: '$297',
    productCategory: 'NON_SUBSCRIPTION',
    defaultOption: null,
  },
  oseh_99_1y_0d0: {
    price: 99,
    currencyCode: 'usd',
    priceString: '$99',
    productCategory: 'SUBSCRIPTION',
    defaultOption: {
      pricingPhases: [
        {
          billingPeriod: { iso8601: 'P1Y' },
          recurrenceMode: 1,
          billingCycleCount: null,
          price: {
            formatted: '$99',
            amountMicros: 99000000,
            currencyCode: 'usd',
          },
          offerPaymentMode: null,
        },
      ],
    },
  },
  oseh_13_1m_0d0: {
    price: 13,
    currencyCode: 'usd',
    priceString: '$13',
    productCategory: 'SUBSCRIPTION',
    defaultOption: {
      pricingPhases: [
        {
          billingPeriod: { iso8601: 'P1M' },
          recurrenceMode: 1,
          billingCycleCount: null,
          price: {
            formatted: '$13',
            amountMicros: 13000000,
            currencyCode: 'usd',
          },
          offerPaymentMode: null,
        },
      ],
    },
  },
};

export const useOfferingPrice = ({
  offering: offeringVWC,
}: UseOfferingPriceProps): ValueWithCallbacks<UseOfferingPriceResult> => {
  const loginContextRaw = useContext(LoginContext);
  const result = useWritableValueWithCallbacks<UseOfferingPriceResult>(() =>
    createLoading()
  );

  useValuesWithCallbacksEffect(
    [offeringVWC, loginContextRaw.value],
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

      let active = true;
      const cancelers = new Callbacks<undefined>();
      fetchPrices();
      return () => {
        active = false;
        cancelers.call(undefined);
      };

      async function fetchPricesInner(signal: AbortSignal | undefined) {
        signal?.throwIfAborted();
        const pricesByPlatformProductId: Record<string, PurchasesStoreProduct> =
          {};
        for (const pkg of offering.offering.packages) {
          const pkgId =
            pkg.platformProductIdentifier +
            (pkg.platformProductPlanIdentifier === null
              ? ''
              : ':' + pkg.platformProductPlanIdentifier);

          if (!(pkgId in fixedPrices)) {
            throw new Error(
              `bad package: ${JSON.stringify(pkg)} with pkgId ${pkgId}`
            );
          }

          pricesByPlatformProductId[pkgId] = fixedPrices[pkgId];
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
          setVWC(result, createError(err));
        } finally {
          cancelers.remove(doAbort);
        }
      }
    }, [offeringVWC, loginContextRaw.value, result])
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
  pricesByPlatformProductId: Record<string, PurchasesStoreProduct>
): UseOfferingPriceResultSuccess => ({
  type: 'success',
  pricesByPlatformProductId,
});
