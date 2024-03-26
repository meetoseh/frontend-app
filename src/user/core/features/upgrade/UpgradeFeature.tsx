import { useCallback } from 'react';
import { useInappNotificationSessionValueWithCallbacks } from '../../../../shared/hooks/useInappNotificationSession';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useOsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { setVWC } from '../../../../shared/lib/setVWC';
import { Feature } from '../../models/Feature';
import { Upgrade } from './Upgrade';
import { UpgradeContext } from './UpgradeContext';
import { UpgradeResources } from './UpgradeResources';
import { UpgradeState } from './UpgradeState';
import { useOfferingPrice } from './hooks/useOfferingPrice';
import { useRevenueCatOfferings } from './hooks/useRevenueCatOfferings';
import { useInappNotificationValueWithCallbacks } from '../../../../shared/hooks/useInappNotification';

export const UpgradeFeature: Feature<UpgradeState, UpgradeResources> = {
  identifier: 'upgrade',
  useWorldState: () => {
    const contextVWC = useWritableValueWithCallbacks<
      UpgradeContext | null | undefined
    >(() => null);
    const ianVWC = useInappNotificationValueWithCallbacks({
      type: 'react-rerender',
      props: { uid: 'oseh_ian_UWqxuftHMXtUnzn9kxnTOA', suppress: false },
    });

    useValueWithCallbacksEffect(ianVWC, (ian) => {
      if (ian?.showNow && contextVWC.get() === null) {
        setVWC(contextVWC, { type: 'onboarding' });
      }
      return undefined;
    });

    return useMappedValuesWithCallbacks(
      [contextVWC, ianVWC],
      (): UpgradeState => {
        const context = contextVWC.get();

        return {
          context,
          ian: ianVWC.get(),
          setContext: (ctx, updateWindowHistory: boolean) => {
            if (contextVWC.get() === undefined) {
              throw new Error('Cannot set context when it is undefined');
            }
            setVWC(contextVWC, ctx);
          },
        };
      }
    );
  },
  isRequired: (state) => {
    if (state.context === undefined) {
      return undefined;
    }
    if (state.ian === null) {
      return undefined;
    }
    return state.context !== null;
  },
  useResources: (state, required, allStates) => {
    const sessionVWC = useInappNotificationSessionValueWithCallbacks({
      type: 'callbacks',
      props: () => ({
        uid: required.get() ? 'oseh_ian_UWqxuftHMXtUnzn9kxnTOA' : null,
      }),
      callbacks: required.callbacks,
    });

    const offerVWC = useRevenueCatOfferings({
      load: adaptValueWithCallbacksAsVariableStrategyProps(required),
    });
    const purchasesVWC = useMappedValueWithCallbacks(
      allStates,
      (s) => s.purchases
    );
    const priceVWC = useOfferingPrice({
      offering: offerVWC,
      purchases: purchasesVWC,
    });
    const imageHandler = useOsehImageStateRequestHandler({});

    useValuesWithCallbacksEffect([offerVWC, priceVWC, required], () => {
      const offer = offerVWC.get();
      const price = priceVWC.get();
      const req = required.get();

      if (!req || (offer.type !== 'error' && price.type !== 'error')) {
        return undefined;
      }

      setTimeout(() => state.get().setContext(null, false), 5);
    });

    useValueWithCallbacksEffect(
      required,
      useCallback(
        (req) => {
          if (req) {
            return purchasesVWC.get().addLoadRequest();
          }
          return undefined;
        },
        [purchasesVWC]
      )
    );

    return useMappedValuesWithCallbacks(
      [sessionVWC, offerVWC, priceVWC, purchasesVWC],
      (): UpgradeResources => {
        const session = sessionVWC.get();
        const offer = offerVWC.get();
        const price = priceVWC.get();
        const purchases = purchasesVWC.get();
        return {
          loading:
            session === null ||
            offer.type === 'loading' ||
            price.type === 'loading',
          session,
          offer,
          purchases,
          offerPrice: price,
          imageHandler,
        };
      }
    );
  },
  component: (state, resources) => (
    <Upgrade state={state} resources={resources} />
  ),
};
