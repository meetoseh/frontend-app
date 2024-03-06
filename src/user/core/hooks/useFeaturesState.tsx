import { ReactElement, useCallback, useRef } from 'react';
import { FeatureAllStates } from '../models/FeatureAllStates';
import { RequestNameFeature } from '../features/requestName/RequestNameFeature';
import { LoginFeature } from '../features/login/LoginFeature';
import { PickEmotionJourneyFeature } from '../features/pickEmotionJourney/PickEmotionJourneyFeature';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { ValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { FavoritesFeature } from '../features/favorites/FavoritesFeature';
import { SettingsFeature } from '../features/settings/SettingsFeature';
import { AppNotifsFeature } from '../features/appNotifs/AppNotifsFeature';
import { SignupRewardFeature } from '../features/signupReward/SignupRewardFeature';
import { GoalDaysPerWeekFeature } from '../features/goalDaysPerWeek/GoalDaysPerWeekFeature';
import { RequestPhoneFeature } from '../features/requestPhone/RequestPhoneFeature';
import { RequestNotificationTimeFeature } from '../features/requestNotificationTime/RequestNotificationTimeFeature';
import { ConfirmMergeAccountFeature } from '../features/confirmMergeAccount/ConfirmMergeAccountFeature';
import { MergeAccountFeature } from '../features/mergeAccount/MergeAccountFeature';
import { SeriesListFeature } from '../features/seriesList/SeriesListFeature';

const features = [
  LoginFeature,
  RequestNameFeature,
  ConfirmMergeAccountFeature,
  MergeAccountFeature,
  SignupRewardFeature,
  AppNotifsFeature,
  RequestPhoneFeature,
  RequestNotificationTimeFeature,
  GoalDaysPerWeekFeature,
  FavoritesFeature,
  SeriesListFeature,
  SettingsFeature,
  PickEmotionJourneyFeature,
];

/**
 * Determines the current state of the various features the app supports. Once
 * we've determined what feature the user should see, then the required property
 * will be true and this state should be forwarded to the FeaturesRouter.
 *
 * Under normal circumstances a feature should always be found, however, if all of
 * them indicate they should not be shown then `loading` and `required` may both
 * be false.
 *
 * This never triggers react rerenders, though in practice the the returned component
 * needs to be rendered, which requires a rerender.
 *
 * @param maxSimultaneousLoadedResources The maximum number of resources to load at once.
 *   The target number is the smallest that ensures that there is no inter-screen loading time
 * @returns The component to mount, undefined if we need more time to determine what to show,
 *   null if no feature wants to be shown.
 */
export const useFeaturesState = (
  maxSimultaneousLoadedResources: number = 3
): ValueWithCallbacks<ReactElement | null | undefined> => {
  const states = features.map((s) => s.useWorldState());

  const allStates = useMappedValuesWithCallbacks(states, () => {
    const res: any = {};
    states.forEach((s, idx) => {
      const state = s.get();
      res[features[idx].identifier] = state;
    });
    return res as FeatureAllStates;
  });

  const required = features.map((f, i) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMappedValueWithCallbacks(allStates, (unw) =>
      f.isRequired(states[i].get() as any, unw)
    )
  );

  const requiredRollingSum = useMappedValuesWithCallbacks(
    required,
    () => {
      const res: number[] = [];
      let sum = 0;
      for (let i = 0; i < required.length; i++) {
        sum += required[i].get() ? 1 : 0;
        res.push(sum);
      }
      return res;
    },
    {
      outputEqualityFn: (a, b) =>
        a.length === b.length && a.every((v, i) => v === b[i]),
    }
  );

  const loadingFeatures = features.map((f, featureIdx) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMappedValueWithCallbacks(requiredRollingSum, () => {
      return (
        !!required[featureIdx].get() &&
        requiredRollingSum.get()[featureIdx] <= maxSimultaneousLoadedResources
      );
    })
  );

  const resources = features.map((f, i) =>
    f.useResources(states[i] as any, loadingFeatures[i], allStates)
  );

  const loadingResources = resources.map((res) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMappedValueWithCallbacks(
      res as ValueWithCallbacks<{ loading: boolean }>,
      (r) => r.loading
    )
  );

  const warnLoadingTimeout = useRef<{
    idx: number;
    timeout: NodeJS.Timeout;
  } | null>(null);

  const onWarnLoadingTimeout = useCallback(() => {
    const info = warnLoadingTimeout.current;
    warnLoadingTimeout.current = null;

    if (info === null) {
      return;
    }

    const { idx } = info;
    console.warn(
      `Loading of feature ${features[idx].identifier} is taking a really long time, dumping state`
    );
    console.warn(states[idx].get());
    console.warn(resources[idx].get());
  }, [states, resources]);

  const initWarnLoading = useCallback(
    (idx: number) => {
      if (warnLoadingTimeout.current?.idx === idx) {
        return;
      }

      if (warnLoadingTimeout.current !== null) {
        clearTimeout(warnLoadingTimeout.current.timeout);
      }

      warnLoadingTimeout.current = {
        idx,
        timeout: setTimeout(onWarnLoadingTimeout, 5000),
      };
    },
    [onWarnLoadingTimeout]
  );

  const clearWarnLoading = useCallback(() => {
    if (warnLoadingTimeout.current === null) {
      return;
    }

    clearTimeout(warnLoadingTimeout.current.timeout);
    warnLoadingTimeout.current = null;
  }, []);

  return useMappedValuesWithCallbacks(
    [...required, ...loadingResources],
    () => {
      const req = required.map((r) => r.get());
      for (let i = 0; i < req.length; i++) {
        if (req[i] === undefined) {
          initWarnLoading(i);
          return undefined;
        }

        if (req[i]) {
          if (loadingResources[i].get()) {
            initWarnLoading(i);
            return undefined;
          }
          clearWarnLoading();
          return features[i].component(states[i] as any, resources[i] as any);
        }
      }

      return null;
    }
  );
};
