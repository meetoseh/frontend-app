import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useNetworkResponse } from '../../../../shared/hooks/useNetworkResponse';
import { useOsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { adaptActiveVWCToAbortSignal } from '../../../../shared/lib/adaptActiveVWCToAbortSignal';
import {
  StreakInfo,
  streakInfoKeyMap,
} from '../../../journey/models/StreakInfo';
import { Feature } from '../../models/Feature';
import { HomeScreenResources } from './HomeScreenResources';
import { HomeScreenSessionInfo, HomeScreenState } from './HomeScreenState';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { HomeScreen, HomeScreenTransition } from './HomeScreen';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';
import { useHomeScreenImage } from './hooks/useHomeScreenImage';
import { Emotion } from '../../../../shared/models/Emotion';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { ReactElement, useContext } from 'react';
import { deleteJourneyFeedbackRequestReviewStoredState } from '../../../journey/lib/JourneyFeedbackRequestReviewStore';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useTimezone } from '../../../../shared/hooks/useTimezone';
import { HomeScreenCopy } from './HomeScreenCopy';

export const HomeScreenFeature: Feature<HomeScreenState, HomeScreenResources> =
  {
    identifier: 'homeScreen',
    useWorldState: () => {
      const streakInfoVWC = useNetworkResponse<StreakInfo>(
        (active, loginContext) => {
          return adaptActiveVWCToAbortSignal(active, async (signal) => {
            const response = await apiFetch(
              '/api/1/users/me/streak',
              {
                method: 'GET',
                signal,
              },
              loginContext
            );

            if (!active.get()) {
              return null;
            }

            const raw = await response.json();
            if (!active.get()) {
              return null;
            }

            const parsed = convertUsingMapper(raw, streakInfoKeyMap);
            return parsed;
          });
        },
        {
          minRefreshTimeMS: 0,
        }
      );
      const sessionInfoVWC =
        useWritableValueWithCallbacks<HomeScreenSessionInfo>(() => ({
          classesTaken: 0,
        }));
      const imageHandler = useOsehImageStateRequestHandler({});
      const nextEnterTransitionVWC = useWritableValueWithCallbacks<
        HomeScreenTransition | undefined
      >(() => undefined);

      return useMappedValuesWithCallbacks(
        [streakInfoVWC, sessionInfoVWC, nextEnterTransitionVWC],
        (): HomeScreenState => ({
          streakInfo: streakInfoVWC.get(),
          sessionInfo: sessionInfoVWC.get(),
          nextEnterTransition: nextEnterTransitionVWC.get(),
          imageHandler,
          onClassTaken: () => {
            const info = sessionInfoVWC.get();
            setVWC(sessionInfoVWC, {
              ...info,
              classesTaken: info.classesTaken + 1,
            });
          },
          setNextEnterTransition: (transition) => {
            setVWC(nextEnterTransitionVWC, transition);
          },
        })
      );
    },
    isRequired: () => true,
    useResources: (stateVWC, requiredVWC, allStatesVWC) => {
      const loginContextRaw = useContext(LoginContext);
      const imageHandler = stateVWC.get().imageHandler;
      const loadPrevented = useMappedValueWithCallbacks(requiredVWC, (r) => !r);
      const backgroundImageErrorVWC =
        useWritableValueWithCallbacks<ReactElement | null>(() => null);
      const backgroundImageStateVWC = useHomeScreenImage({
        requiredVWC,
        imageHandler,
        errorVWC: backgroundImageErrorVWC,
      });

      const emotionsNR = useNetworkResponse(
        (active, loginContext) =>
          adaptActiveVWCToAbortSignal(active, async (signal) => {
            const now = new Date();
            const response = await apiFetch(
              '/api/1/emotions/personalized',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({
                  local_time: {
                    hour_24: now.getHours(),
                    minute: now.getMinutes(),
                  },
                  num_emotions: 16,
                }),
                signal,
              },
              loginContext
            );
            if (!response.ok) {
              throw response;
            }
            const data = await response.json();
            if (!active.get()) {
              return null;
            }
            return data.items as Emotion[];
          }),
        { loadPrevented }
      );

      const copyVariantVWC = useMappedValueWithCallbacks(stateVWC, (s) =>
        s.sessionInfo.classesTaken === 0 ? 'session_start' : 'session_end'
      );
      const timezone = useTimezone();
      const copyNR = useNetworkResponse(
        (active, loginContext) =>
          adaptActiveVWCToAbortSignal(active, async (signal) => {
            const now = new Date();
            const response = await apiFetch(
              '/api/1/users/me/home_copy?variant=' +
                encodeURIComponent(copyVariantVWC.get()) +
                '&tz=' +
                encodeURIComponent(timezone.timeZone) +
                '&tzt=' +
                encodeURIComponent(timezone.guessed ? 'app-guessed' : 'app'),
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                signal,
              },
              loginContext
            );
            if (!response.ok) {
              throw response;
            }
            const data = await response.json();
            if (!active.get()) {
              return null;
            }
            return data as HomeScreenCopy;
          }),
        { loadPrevented, dependsOn: [copyVariantVWC] }
      );

      useValueWithCallbacksEffect(backgroundImageErrorVWC, (e) => {
        if (e !== null) {
          deleteJourneyFeedbackRequestReviewStoredState();
          loginContextRaw.setAuthTokens(null);
        }
        return undefined;
      });

      return useMappedValuesWithCallbacks(
        [backgroundImageStateVWC, emotionsNR, copyNR],
        (): HomeScreenResources => {
          const bknd = backgroundImageStateVWC.get();
          const emotions = emotionsNR.get();
          const copy = copyNR.get();
          return {
            loading: bknd.loading,
            backgroundImage: bknd,
            emotions,
            copy,
            startGotoEmotion: (emotion) => {
              allStatesVWC
                .get()
                .gotoEmotion.setShow({ emotion, anticipatory: true }, false);
              return (animationHints) => {
                allStatesVWC
                  .get()
                  .gotoEmotion.setShow(
                    { emotion, anticipatory: false, animationHints },
                    true
                  );
              };
            },
            gotoSeries: () => {
              allStatesVWC.get().seriesList.setForced({ enter: 'fade' }, true);
            },
            gotoAccount: () => {
              allStatesVWC.get().settings.setShow(true, true);
            },
            gotoUpdateGoal: () => {
              allStatesVWC.get().goalDaysPerWeek.setForced({ back: null });
            },
          };
        }
      );
    },
    component: (state, resources) => (
      <HomeScreen state={state} resources={resources} />
    ),
  };
