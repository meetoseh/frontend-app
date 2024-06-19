import { CrudFetcherMapper } from '../../../../../shared/lib/CrudFetcher';

/** Describes a revenue cat package */
export type RevenueCatPackage = {
  /** The package's identifier */
  identifier: string;

  /** The platform-specific product identifier; for web this is a stripe product id */
  platformProductIdentifier: string;

  /**
   * For android, the product identifier is the subscription and the plan identifier is
   * the base plan id.
   * @platform android
   */
  platformProductPlanIdentifier: string | null;
};

export const revenueCatPackageKeyMap: CrudFetcherMapper<RevenueCatPackage> = {
  platform_product_identifier: 'platformProductIdentifier',
  platform_product_plan_identifier: 'platformProductPlanIdentifier',
};
