import { PurchasesPackage, RECURRENCE_MODE } from 'react-native-purchases';
import { RevenueCatPackage } from '../models/RevenueCatPackage';

export type ISOUnit = 'd' | 'w' | 'm' | 'y';

export type ParsedPeriod = {
  unit: ISOUnit;
  count: number;
  iso8601: string;
};

/**
 * Extracts the length of the trial from the given store product
 * @param price The store product to extract the trial length from
 * @returns The trial length
 */
export const extractTrialLength = (
  pkg: RevenueCatPackage,
  pricePackage: PurchasesPackage
): ParsedPeriod | null => {
  const price = pricePackage.product;
  if (price.defaultOption === null) {
    return null;
  }

  if (
    (price.defaultOption?.pricingPhases.length ?? 0) > 1 &&
    (price.defaultOption.pricingPhases[0].offerPaymentMode === 'FREE_TRIAL' ||
      price.defaultOption.pricingPhases[0].price.amountMicros === 0)
  ) {
    const trialPhase = price.defaultOption.pricingPhases[0];
    const trialPeriodIso8601 = trialPhase.billingPeriod.iso8601;

    if (
      trialPeriodIso8601.length >= 3 &&
      trialPeriodIso8601.length <= 5 &&
      trialPeriodIso8601[0].toLowerCase() === 'p'
    ) {
      const unitUnchecked =
        trialPeriodIso8601[trialPeriodIso8601.length - 1].toLowerCase();
      if (['d', 'w', 'm', 'y'].includes(unitUnchecked)) {
        const unit = unitUnchecked as 'd' | 'w' | 'm' | 'y';
        const count = parseInt(trialPeriodIso8601.slice(1, -1), 10);
        if (!isNaN(count) && count > 0) {
          if (
            trialPhase.billingCycleCount !== null &&
            trialPhase.billingCycleCount > 1
          ) {
            return {
              unit,
              iso8601: `P${
                count * trialPhase.billingCycleCount
              }${unit.toUpperCase()}`,
              count: count * trialPhase.billingCycleCount,
            };
          }

          return { unit, count, iso8601: trialPeriodIso8601 };
        }
      }
    }
  }

  if (price.introPrice !== null && price.introPrice.price === 0) {
    const cycles = price.introPrice.cycles;
    const periodNumberOfUnits = price.introPrice.periodNumberOfUnits;
    const unitAllUpper = price.introPrice.periodUnit.toUpperCase();

    if (unitAllUpper === 'WEEK') {
      return {
        unit: 'd',
        iso8601: `P${periodNumberOfUnits * cycles * 7}D`,
        count: periodNumberOfUnits * cycles * 7,
      };
    } else if (unitAllUpper === 'DAY') {
      return {
        unit: 'd',
        iso8601: `P${periodNumberOfUnits * cycles}D`,
        count: periodNumberOfUnits * cycles,
      };
    } else if (unitAllUpper === 'MONTH') {
      return {
        unit: 'm',
        iso8601: `P${periodNumberOfUnits * cycles}M`,
        count: periodNumberOfUnits * cycles,
      };
    } else if (unitAllUpper === 'YEAR') {
      return {
        unit: 'y',
        iso8601: `P${periodNumberOfUnits * cycles}Y`,
        count: periodNumberOfUnits * cycles,
      };
    } else {
      console.warn(`Unknown trial unit: ${unitAllUpper}`);
    }
  }

  return null;
};

/**
 * Extracts the time between payments in the infinite recurring part of the given store product
 *
 * @param price The store product to extract the paid interval length from
 * @returns The paid interval length
 */
export const extractPaidIntervalLength = (
  pkg: RevenueCatPackage,
  pricePackage: PurchasesPackage
): ParsedPeriod | null => {
  const price = pricePackage.product;
  if (
    price.defaultOption === null ||
    price.defaultOption === undefined ||
    price.defaultOption.pricingPhases.length === 0
  ) {
    if (price.subscriptionPeriod !== null) {
      return parsedPeriodFromIso8601(price.subscriptionPeriod, 1);
    }
    return null;
  }

  const phase =
    price.defaultOption.pricingPhases[
      price.defaultOption.pricingPhases.length - 1
    ];
  if (phase.recurrenceMode !== RECURRENCE_MODE.INFINITE_RECURRING) {
    return null;
  }

  return parsedPeriodFromIso8601(
    phase.billingPeriod.iso8601,
    phase.billingCycleCount
  );
};

const parsedPeriodFromIso8601 = (
  iso8601: string,
  cycles: number | null | undefined
): ParsedPeriod | null => {
  if (iso8601.length < 3) {
    return null;
  }

  if (iso8601[0].toLowerCase() !== 'p') {
    return null;
  }

  const unitUnchecked = iso8601[iso8601.length - 1].toLowerCase();
  if (!['d', 'w', 'm', 'y'].includes(unitUnchecked)) {
    return null;
  }
  const unit = unitUnchecked as 'd' | 'w' | 'm' | 'y';
  const count = parseInt(iso8601.slice(1, -1), 10);
  if (isNaN(count) || count <= 0) {
    return null;
  }
  if (cycles !== null && cycles !== undefined && cycles > 1) {
    return {
      unit,
      iso8601: `P${count * cycles}${unit.toUpperCase()}`,
      count: count * cycles,
    };
  }

  return { unit, count, iso8601 };
};
