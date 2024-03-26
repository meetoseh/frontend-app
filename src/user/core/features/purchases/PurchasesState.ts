import {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import { LoginContextValueLoggedIn } from '../../../../shared/contexts/LoginContext';
import { ReactElement } from 'react';

/**
 * Unlike normal features, the purchases feature is never shown. It's just a convenient
 * container for working with react-native-purchases
 */
export type PurchasesState = {
  /**
   * Purchases will be initialized as there is some active load request. To
   * avoid mutating purchases state based on changes in purchases state, which
   * leads to cycles, instead you should have a hook that always adds a load
   * request if purchases is needed and removes it when no longer needed using
   * the returned callback.
   */
  addLoadRequest: () => () => void;

  /**
   * If an error prevented us from initializing purchases, a description of
   * the error will be stored here.
   */
  error: ReactElement | null;

  /**
   * If the purchases state has been initialized, then who it's loaded for. The
   * purchases feature will handle unloading it if the user logs out.
   */
  loaded?: {
    /**
     * The user sub that this has been initialized for. Attempts to use it for
     * a different user will result in an immediate error.
     */
    userSub: string;

    /**
     * True if the user has the pro entitlement, false otherwise.
     */
    havePro: boolean;

    /**
     * Determines what offerings are available to the current user
     */
    getOfferings: (
      loginContext: LoginContextValueLoggedIn
    ) => Promise<PurchasesOfferings>;

    /**
     * Restores purchases for the current user
     */
    restorePurchases: (
      loginContext: LoginContextValueLoggedIn
    ) => Promise<void>;

    /**
     * Purchases the given package within the currently configured environment. This tries not
     * to return until the purchase has been fully confirmed, such that fetching if this user
     * has the just-purchased entitlement without busting the cache will return the correct
     * value and `havePro` will be updated.
     */
    purchasePackage: (
      loginContext: LoginContextValueLoggedIn,
      pkg: PurchasesPackage
    ) => Promise<void>;
  };
};
