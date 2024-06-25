declare const __brand: unique symbol;
type Brand<B> = B & { readonly [__brand]: unique symbol };
export type PriceIdentifier = string & Brand<'PriceIdentifier'>;

/**
 * Creates a PriceIDentifier key by joining the product and product plan identifier.
 * This type is mostly to help errors from cropping on android, which is the only
 * platform where we need two distinct identifiers
 */
export const createPriceIdentifier = (
  platformProductIdentifier: string,
  platformProductPlanIdentifier: string | null
): PriceIdentifier => {
  return `${platformProductIdentifier}${
    platformProductPlanIdentifier === null
      ? ''
      : `:${platformProductPlanIdentifier}`
  }` as PriceIdentifier;
};
