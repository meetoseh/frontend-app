import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  LoginContext,
  LoginContextValue,
  LoginContextValueLoggedIn,
} from '../../../../shared/contexts/LoginContext';
import {
  Callbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { adaptActiveVWCToAbortSignal } from '../../../../shared/lib/adaptActiveVWCToAbortSignal';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { setVWC } from '../../../../shared/lib/setVWC';
import { Feature } from '../../models/Feature';
import { PurchasesResources } from './PurchasesResources';
import { PurchasesState } from './PurchasesState';
import { Platform } from 'react-native';
import { describeError } from '../../../../shared/lib/describeError';
import { MutableRefObject, useContext, useRef } from 'react';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useDelayedValueWithCallbacks } from '../../../../shared/hooks/useDelayedValueWithCallbacks';

/**
 * The information we don't expose in the PurchasesState object. Primarily
 * we don't expose this state to make using it easier, not because we need
 * to hide it. For example, if we expose the lock, that would mean that calling
 * e.g. getOfferings will mutate the state, which means one cannot use it as
 * a dependency for deciding whether or not to call getOfferings, which means
 * you cannot wait until purchases is loaded to call getOfferings, which is
 * rather counterintuitive.
 */
type PrivatePurchasesState = {
  locked: boolean;
  loadRequests: Set<object>;
  maybeLoad: () => void;
};

const addLoadRequest = (
  result: WritableValueWithCallbacks<PurchasesState>,
  hidden: PrivatePurchasesState
): (() => void) => {
  const iden = {};
  hidden.loadRequests.add(iden);
  hidden.maybeLoad();
  return () => {
    hidden.loadRequests.delete(iden);
  };
};

const initialize = async (
  result: WritableValueWithCallbacks<PurchasesState>,
  hidden: PrivatePurchasesState,
  ctx: LoginContextValueLoggedIn
): Promise<void> => {
  if (hidden.locked) {
    throw new Error('cannot initialized purchase: it is currently locked');
  }
  hidden.locked = true;

  try {
    const activeVWC = createWritableValueWithCallbacks(true);
    const [havePro, revenueCatEntitlementID] = await Promise.all([
      (async () =>
        adaptActiveVWCToAbortSignal(activeVWC, async (signal) => {
          try {
            const response = await apiFetch(
              '/api/1/users/me/entitlements/pro',
              {
                method: 'GET',
                signal,
              },
              ctx
            );
            if (!response.ok) {
              throw response;
            }
            const data: { is_active: boolean } = await response.json();
            return data.is_active;
          } catch (e) {
            setVWC(activeVWC, false);
            throw e;
          }
        }))(),
      (async () =>
        adaptActiveVWCToAbortSignal(activeVWC, async (signal) => {
          try {
            const response = await apiFetch(
              '/api/1/users/me/revenue_cat_id',
              {
                method: 'GET',
                signal,
              },
              ctx
            );
            if (!response.ok) {
              throw response;
            }
            const data: { revenue_cat_id: string } = await response.json();
            return data.revenue_cat_id;
          } catch (e) {
            setVWC(activeVWC, false);
            throw e;
          }
        }))(),
    ]);

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
      appUserID: revenueCatEntitlementID,
      // Not necessary to enforce entitlements client-side as we don't unlock any
      // client-side behavior
      entitlementVerificationMode:
        Purchases.ENTITLEMENT_VERIFICATION_MODE.DISABLED,
    });
    setVWC(result, {
      ...result.get(),
      error: null,
      loaded: {
        userSub: ctx.userAttributes.sub,
        havePro,
        restorePurchases: (ctx) => restorePurchases(result, hidden, ctx),
        purchasePackage: (ctx, pkg) =>
          purchasePackage(result, hidden, ctx, pkg),
        getOfferings: (ctx) => getOfferings(result, hidden, ctx),
      },
    });
  } catch (e) {
    console.warn('failed to initialize purchases:', e);
    setVWC(result, { ...result.get(), error: await describeError(e) });
  } finally {
    hidden.locked = false;
  }
};

const restorePurchases = async (
  result: WritableValueWithCallbacks<PurchasesState>,
  hidden: PrivatePurchasesState,
  ctx: LoginContextValueLoggedIn
): Promise<void> => {
  if (hidden.locked) {
    throw new Error('cannot restore purchases: purchases is currently locked');
  }

  const value = result.get();
  if (value.loaded === undefined) {
    throw new Error('restore purchases called when not initialized');
  }

  if (value.loaded.userSub !== ctx.userAttributes.sub) {
    throw new Error('restore purchases called for wrong user');
  }

  hidden.locked = true;
  try {
    console.log('restoring purchases...');
    const newInfo = await Purchases.restorePurchases();

    const revenueCatThinksIHavePro =
      !!newInfo.entitlements.active.pro?.isActive;
    const backendThinksIHadPro = value.loaded.havePro;
    let effectivelyHavePro = backendThinksIHadPro;

    console.log('backendThinksIHadPro:', backendThinksIHadPro);
    console.log('revenueCatThinksIHavePro:', revenueCatThinksIHavePro);
    console.log('effectivelyHavePro:', effectivelyHavePro);

    if (backendThinksIHadPro !== revenueCatThinksIHavePro) {
      console.log('busting backend cache...');
      let response = await apiFetch(
        '/api/1/users/me/entitlements/pro',
        {
          method: 'GET',
          headers: { pragma: 'no-cache' },
        },
        ctx
      );
      while (response.status === 429) {
        console.log('ratelimited, retrying in 10 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 10000));
        response = await apiFetch(
          '/api/1/users/me/entitlements/pro',
          {
            method: 'GET',
            headers: { pragma: 'no-cache' },
          },
          ctx
        );
      }
      if (!response.ok) {
        throw response;
      }
      const data: { is_active: boolean } = await response.json();
      const newHavePro = data.is_active;
      if (!newHavePro && revenueCatThinksIHavePro) {
        throw new Error(
          'entitlements mismatch; backend doesnt think I have pro but revenuecat does'
        );
      }
      console.log('new backend value:', newHavePro);
      effectivelyHavePro = newHavePro;
    }

    if (effectivelyHavePro !== backendThinksIHadPro) {
      await new Promise((resolve) => setTimeout(resolve, 16)); // ensure we broke loops
      console.log('setting new value to:', effectivelyHavePro);
      setVWC(result, {
        ...value,
        loaded: {
          ...value.loaded,
          havePro: effectivelyHavePro,
        },
      });
    }
  } catch (e) {
    console.log('failed to restore purchases:', e);
    throw e;
  } finally {
    hidden.locked = false;
  }
};

const purchasePackage = async (
  result: WritableValueWithCallbacks<PurchasesState>,
  hidden: PrivatePurchasesState,
  ctx: LoginContextValueLoggedIn,
  pkg: PurchasesPackage
): Promise<void> => {
  const value = result.get();
  if (value.loaded === undefined) {
    throw new Error('purchase package called when not initialized');
  }

  if (value.loaded.userSub !== ctx.userAttributes.sub) {
    throw new Error('purchase package called for wrong user');
  }

  if (hidden.locked) {
    throw new Error('cannot purchase package: purchases is currently locked');
  }

  hidden.locked = true;
  try {
    await Purchases.purchasePackage(pkg);
    const response = await apiFetch(
      '/api/1/users/me/entitlements/pro',
      {
        method: 'GET',
        headers: {
          pragma: 'no-cache',
        },
      },
      ctx
    );
    if (!response.ok) {
      throw response;
    }
    const data: { is_active: boolean } = await response.json();
    const newHavePro = data.is_active;
    if (newHavePro !== value.loaded.havePro) {
      await new Promise((resolve) => setTimeout(resolve, 16)); // ensure we broke loops
      setVWC(result, {
        ...value,
        loaded: {
          ...value.loaded,
          havePro: newHavePro,
        },
      });
    }
  } catch (e) {
    console.log('failed to purchase package:', e);
    throw e;
  } finally {
    hidden.locked = false;
  }
};

const getOfferings = async (
  result: WritableValueWithCallbacks<PurchasesState>,
  hidden: PrivatePurchasesState,
  ctx: LoginContextValueLoggedIn
): Promise<PurchasesOfferings> => {
  const value = result.get();
  if (value.loaded === undefined) {
    throw new Error('get offerings called when not initialized');
  }

  if (value.loaded.userSub !== ctx.userAttributes.sub) {
    throw new Error('get offerings called for wrong user');
  }

  if (hidden.locked) {
    throw new Error('cannot get offerings: purchases is currently locked');
  }

  hidden.locked = true;
  try {
    return await Purchases.getOfferings();
  } catch (e) {
    console.log('failed to get offerings:', e);
    throw e;
  } finally {
    hidden.locked = false;
  }
};

/**
 * The exclusive file for interacting with react-native-purchases; this is intended
 * to avoid repeated unecessary work and reduce mistakes related to the Purchases
 * library being configured for the wrong user.
 *
 * We also structure how we implement this feature to prevent accidentally binding
 * variables past their valid lifetime, which is another common way to misattribute
 * purchases
 */
export const PurchasesFeature: Feature<PurchasesState, PurchasesResources> = {
  identifier: 'purchases',
  useWorldState: () => {
    const maybeLoadCounterVWC = useWritableValueWithCallbacks<number>(() => 0);
    const hiddenRef =
      useRef<PrivatePurchasesState>() as MutableRefObject<PrivatePurchasesState>;
    if (hiddenRef.current === undefined) {
      hiddenRef.current = {
        locked: false,
        loadRequests: new Set(),
        maybeLoad: () =>
          setVWC(maybeLoadCounterVWC, maybeLoadCounterVWC.get() + 1),
      };
    }

    const stateVWC: WritableValueWithCallbacks<PurchasesState> =
      useWritableValueWithCallbacks<PurchasesState>(() => ({
        addLoadRequest: () => addLoadRequest(stateVWC, hiddenRef.current),
        error: null,
      }));

    const loginContextRaw = useContext(LoginContext);
    useValuesWithCallbacksEffect(
      [
        loginContextRaw.value,
        useDelayedValueWithCallbacks(maybeLoadCounterVWC, 16),
      ],
      () => {
        const loginContextUnch = loginContextRaw.value.get();
        if (loginContextUnch.state !== 'logged-in') {
          if (stateVWC.get().loaded !== undefined) {
            setVWC(stateVWC, {
              ...stateVWC.get(),
              loaded: undefined,
              error: null,
            });
          }

          return;
        }
        const loginContext = loginContextUnch;
        const state = stateVWC.get();
        if (
          state.loaded !== undefined &&
          state.loaded.userSub === loginContext.userAttributes.sub
        ) {
          return;
        }

        if (
          state.loaded === undefined &&
          hiddenRef.current.loadRequests.size === 0
        ) {
          return;
        }

        if (hiddenRef.current.locked) {
          let active = true;
          let timeout: NodeJS.Timeout | null = setTimeout(recheckLock, 16);
          return () => {
            active = false;
            if (timeout !== null) {
              clearTimeout(timeout);
              timeout = null;
            }
          };

          function recheckLock() {
            timeout = null;

            if (!active) {
              return;
            }

            if (hiddenRef.current.locked) {
              timeout = setTimeout(recheckLock, 16);
              return;
            }

            hiddenRef.current.maybeLoad();
          }
        }

        initialize(stateVWC, hiddenRef.current, loginContext);
        return undefined;
      }
    );

    return stateVWC;
  },
  isRequired: () => false,
  useResources: () => useWritableValueWithCallbacks(() => ({ loading: true })),
  component: () => <></>,
};
