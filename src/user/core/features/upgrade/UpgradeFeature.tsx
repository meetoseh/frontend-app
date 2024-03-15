import { useInappNotificationSessionValueWithCallbacks } from '../../../../shared/hooks/useInappNotificationSession';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
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

export const UpgradeFeature: Feature<UpgradeState, UpgradeResources> = {
  identifier: 'upgrade',
  useWorldState: () => {
    const contextVWC = useWritableValueWithCallbacks<
      UpgradeContext | null | undefined
    >(() => null);

    return useMappedValuesWithCallbacks([contextVWC], (): UpgradeState => {
      const context = contextVWC.get();

      return {
        context,
        setContext: (ctx, updateWindowHistory: boolean) => {
          if (contextVWC.get() === undefined) {
            throw new Error('Cannot set context when it is undefined');
          }
          setVWC(contextVWC, ctx);
        },
      };
    });
  },
  isRequired: (state) => {
    if (state.context === undefined) {
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
    const priceVWC = useOfferingPrice({ offering: offerVWC });
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

    return useMappedValuesWithCallbacks(
      [sessionVWC, offerVWC, priceVWC],
      (): UpgradeResources => {
        const session = sessionVWC.get();
        const offer = offerVWC.get();
        const price = priceVWC.get();
        return {
          loading:
            session === null ||
            offer.type === 'loading' ||
            price.type === 'loading',
          session,
          offer,
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