import { ReactElement, useContext } from 'react';
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import {
  RevenueCatOfferings,
  revenueCatOfferingsKeyMap,
} from '../models/RevenueCatOfferings';
import { RevenueCatOffering } from '../models/RevenueCatOffering';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { RevenueCatPlatform } from '../lib/RevenueCatPlatform';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../../../../../shared/anim/VariableStrategyProps';
import { useValuesWithCallbacksEffect } from '../../../../../shared/hooks/useValuesWithCallbacksEffect';
import { apiFetch } from '../../../../../shared/lib/apiFetch';
import { convertUsingMapper } from '../../../../../shared/lib/CrudFetcher';
import { describeError } from '../../../../../shared/lib/describeError';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../../shared/components/ErrorBanner';

export type UseRevenueCatOfferingsResultLoading = {
  /** Discriminatory key; indicates we are still loading the offerings */
  type: 'loading';
  error: null;
  offerings: null;
  offering: null;
};

export type UseRevenueCatOfferingsResultError = {
  /** Discriminatory key; indicates an error prevented us from loading offerings */
  type: 'error';
  error: ReactElement;
  offerings: null;
  offering: null;
};

export type UseRevenueCatOfferingsResultSuccess = {
  /** Discriminatory key; indicates we loaded the offerings successfully */
  type: 'success';
  error: null;
  /** The raw available offerings */
  offerings: RevenueCatOfferings;
  /** The offering to show plucked from offerings */
  offering: RevenueCatOffering;
};

export type UseRevenueCatOfferingsResult =
  | UseRevenueCatOfferingsResultLoading
  | UseRevenueCatOfferingsResultError
  | UseRevenueCatOfferingsResultSuccess;

export type UseRevenueCatOfferingsProps = {
  /**
   * Whether or not to actually load the offerings, to avoid conditional hooks.
   * If false, the result will be in a perpetual loading state.
   */
  load: VariableStrategyProps<boolean>;
};

/**
 * Loads the revenue cat offerings that should be presented
 */
export const useRevenueCatOfferings = ({
  load: loadVSP,
}: UseRevenueCatOfferingsProps): ValueWithCallbacks<UseRevenueCatOfferingsResult> => {
  const loadVWC = useVariableStrategyPropsAsValueWithCallbacks(loadVSP);
  const loginContextRaw = useContext(LoginContext);
  const result = useWritableValueWithCallbacks<UseRevenueCatOfferingsResult>(
    () => createLoading()
  );

  useValuesWithCallbacksEffect([loginContextRaw.value, loadVWC], () => {
    const load = loadVWC.get();
    if (!load) {
      setVWC(result, createLoading(), (a, b) => a.type === b.type);
      return undefined;
    }

    const loginContextUnch = loginContextRaw.value.get();
    if (loginContextUnch.state !== 'logged-in') {
      return undefined;
    }
    const loginContext = loginContextUnch;
    let active = true;
    const cancelers = new Callbacks<undefined>();
    refreshResult();
    return () => {
      active = false;
      cancelers.call(undefined);
    };

    async function refreshResultInner(signal: AbortSignal | undefined) {
      if (RevenueCatPlatform === undefined) {
        setVWC(
          result,
          createError(
            <ErrorBanner>
              <ErrorBannerText>
                Unsupported platform for purchases
              </ErrorBannerText>
            </ErrorBanner>
          )
        );
        return;
      }

      signal?.throwIfAborted();
      const response = await apiFetch(
        `/api/1/users/me/offerings?platform=${RevenueCatPlatform}`,
        {
          method: 'GET',
          signal,
        },
        loginContext
      );
      if (!response.ok) {
        throw response;
      }
      signal?.throwIfAborted();
      const data = await response.json();
      signal?.throwIfAborted();
      const offerings = convertUsingMapper(data, revenueCatOfferingsKeyMap);
      const current = offerings.offerings.find(
        (o) => o.identifier === offerings.currentOfferingId
      );
      if (current === undefined) {
        throw new Error('No current offering');
      }
      setVWC(result, createSuccess(offerings, current));
    }

    async function refreshResult() {
      if (!active) {
        return;
      }

      if (result.get().type === 'error') {
        setVWC(result, createLoading());
      }

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

      try {
        await refreshResultInner(signal);
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
  });

  return result;
};

const createLoading = (): UseRevenueCatOfferingsResultLoading => ({
  type: 'loading',
  error: null,
  offerings: null,
  offering: null,
});

const createError = (
  error: ReactElement
): UseRevenueCatOfferingsResultError => ({
  type: 'error',
  error,
  offerings: null,
  offering: null,
});

const createSuccess = (
  offerings: RevenueCatOfferings,
  offering: RevenueCatOffering
): UseRevenueCatOfferingsResultSuccess => ({
  type: 'success',
  error: null,
  offerings,
  offering: {
    ...offering,
    packages: offering.packages,
  },
});