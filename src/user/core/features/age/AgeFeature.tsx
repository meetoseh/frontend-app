import { useInappNotificationValueWithCallbacks } from '../../../../shared/hooks/useInappNotification';
import { useInappNotificationSessionValueWithCallbacks } from '../../../../shared/hooks/useInappNotificationSession';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useFeatureFlag } from '../../../../shared/lib/useFeatureFlag';
import { Feature } from '../../models/Feature';
import { Age } from './Age';
import { AgeResources } from './AgeResources';
import { AgeState } from './AgeState';

export const AgeFeature: Feature<AgeState, AgeResources> = {
  identifier: 'age',
  useWorldState: () => {
    const forcedVWC = useWritableValueWithCallbacks(() => false);
    const ian = useInappNotificationValueWithCallbacks({
      type: 'react-rerender',
      props: { uid: 'oseh_ian_xRWoSM6A_F7moeaYSpcaaQ', suppress: false },
    });

    // prevents us from flashing the screen under certain network errors
    useValueWithCallbacksEffect(ian, (ian) => {
      if (ian !== null && ian.showNow) {
        setVWC(forcedVWC, true);
      }
      return undefined;
    });

    return useMappedValuesWithCallbacks([forcedVWC, ian], (): AgeState => {
      return {
        forced: forcedVWC.get(),
        ian: ian.get(),
        setForced: (v) => setVWC(forcedVWC, v),
      };
    });
  },
  isRequired: (state) => {
    return state.forced || state.ian?.showNow;
  },
  useResources: (stateVWC, requiredVWC, allStatesVWC) => {
    const sessionVWC = useInappNotificationSessionValueWithCallbacks({
      type: 'callbacks',
      props: () => ({ uid: stateVWC.get().ian?.uid ?? null }),
      callbacks: stateVWC.callbacks,
    });

    return useMappedValuesWithCallbacks([sessionVWC], () => ({
      loading: sessionVWC.get() === null,
      session: sessionVWC.get(),
      onBack: () => {
        allStatesVWC.get().goalCategories.setForced(true);
        stateVWC.get().setForced(false);
      },
      onContinue: () => {
        stateVWC.get().setForced(false);
      },
    }));
  },
  component: (state, resources) => <Age state={state} resources={resources} />,
};
