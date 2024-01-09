import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useStateCompat as useState } from '../../../../shared/hooks/useStateCompat';
import { FeatureComponentProps } from '../../models/Feature';
import { PickEmotionJourneyResources } from './PickEmotionJourneyResources';
import { PickEmotionJourneyState } from './PickEmotionJourneyState';
import { PickEmotion } from './PickEmotion';
import { JourneyRouterScreenId } from '../../../journey/JourneyRouter';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useUnwrappedValueWithCallbacks } from '../../../../shared/hooks/useUnwrappedValueWithCallbacks';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { createLoadingJourneyShared } from '../../../journey/hooks/useJourneyShared';
import { SplashScreen } from '../../../splash/SplashScreen';
import { JourneyLobbyScreen } from '../../../journey/screens/JourneyLobbyScreen';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { JourneyStartScreen } from '../../../journey/screens/JourneyStartScreen';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { Journey } from '../../../journey/screens/Journey';
import { JourneyFeedbackScreen } from '../../../journey/screens/JourneyFeedbackScreen';
import { JourneyPostScreen } from '../../../journey/screens/JourneyPostScreen';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { onReviewRequested } from '../../../journey/lib/JourneyFeedbackRequestReviewStore';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

/**
 * The core screen where the user selects an emotion and the backend
 * uses that to select a journey
 */
export const PickEmotionJourney = ({
  state,
  resources,
}: FeatureComponentProps<
  PickEmotionJourneyState,
  PickEmotionJourneyResources
>): ReactElement => {
  const loginContextRaw = useContext(LoginContext);
  const [step, setStep] = useState<{
    journeyUid: string | null;
    step: 'pick' | JourneyRouterScreenId;
  }>({ journeyUid: null, step: 'pick' });
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const notSet = Symbol();
    let settingStepTo: typeof step | typeof notSet = notSet;
    let active = false;
    resources.callbacks.add(handleSelectedChanged);
    handleSelectedChanged();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      resources.callbacks.remove(handleSelectedChanged);
    };

    function handleSelected(selected: PickEmotionJourneyResources['selected']) {
      if (selected === null && stepRef.current.step !== 'pick') {
        setStepNextTick({ journeyUid: null, step: 'pick' });
        return;
      }

      if (
        selected !== null &&
        stepRef.current.step === 'pick' &&
        selected.skipsStats
      ) {
        setStepNextTick({ journeyUid: selected.journey.uid, step: 'lobby' });
        return;
      }

      if (
        selected !== null &&
        step.step !== 'pick' &&
        step.journeyUid !== selected.journey.uid
      ) {
        setStepNextTick({ journeyUid: null, step: 'pick' });
      }
    }

    function setStepNextTick(newStep: typeof step) {
      if (!active) {
        return;
      }
      stepRef.current = newStep;
      if (settingStepTo !== notSet) {
        settingStepTo = newStep;
        return;
      }

      settingStepTo = newStep;
      requestAnimationFrame(() => {
        if (!active) {
          return;
        }

        if (settingStepTo === notSet) {
          return;
        }
        settingStepTo = notSet;
        setStep(newStep);
      });
    }

    function handleSelectedChanged() {
      if (!active) {
        return;
      }
      handleSelected(resources.get().selected);
    }
  }, [resources, step.journeyUid, step.step]);

  const gotoJourney = useCallback(() => {
    const selected = resources.get().selected;
    if (selected === null) {
      console.warn('gotoJourney without a journey to goto');
      return;
    }
    setStep({ journeyUid: selected.journey.uid, step: 'lobby' });
  }, [resources]);

  const onFinishJourney = useCallback(() => {
    resources.get().onFinishedJourney.call(undefined);
    state.get().onFinishedClass.call(undefined);
    // step will be set next tick because the selection changed
  }, [resources, state]);

  const setScreen = useCallback(
    (
      screen:
        | JourneyRouterScreenId
        | ((screen: JourneyRouterScreenId) => JourneyRouterScreenId)
    ) => {
      if (stepRef.current.step === 'pick') {
        return;
      }

      const loginRaw = loginContextRaw.value.get();
      if (loginRaw.state !== 'logged-in') {
        return;
      }
      const login = loginRaw;

      if (typeof screen === 'function') {
        screen = screen(stepRef.current.step);
      }

      const selected = resources.get().selected;
      if (selected === null) {
        return;
      }

      if (screen === 'journey') {
        const audio = selected.shared.audio;
        if (!audio.loaded) {
          console.warn('Cannot go to journey screen without loaded audio.');
          return;
        }

        if (audio.play === null) {
          console.warn('Cannot go to journey screen without audio play.');
          return;
        }

        apiFetch(
          '/api/1/emotions/started_related_journey',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              emotion_user_uid: selected.emotionUserUid,
            }),
          },
          login
        );

        audio.play();
      }

      const newStep = { journeyUid: selected.journey.uid, step: screen };
      stepRef.current = newStep;
      setStep(newStep);
    },
    [resources, loginContextRaw]
  );

  const forceSplash = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(resources, (r) => r.forceSplash)
  );
  const selectedVWC = useMappedValueWithCallbacks(resources, (r) => r.selected);
  const sharedVWC = useMappedValueWithCallbacks(
    resources,
    (r) =>
      r.selected?.shared ??
      createLoadingJourneyShared(
        { width: 0, height: 0 },
        { width: 0, height: 0 }
      )
  );

  const requestedReview = useRef(false);
  useValueWithCallbacksEffect(
    useMappedValueWithCallbacks(sharedVWC, (s): boolean => s.wantStoreReview),
    useCallback(
      (wantStoreReview) => {
        if (!wantStoreReview || requestedReview.current) {
          return;
        }
        const loginRaw = loginContextRaw.value.get();
        if (loginRaw.state !== 'logged-in') {
          return;
        }
        const login = loginRaw;
        requestedReview.current = true;

        StoreReview.requestReview();
        onReviewRequested();
        apiFetch(
          '/api/1/notifications/inapp/start',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              inapp_notification_uid: 'oseh_ian_P1LDF0FIWtqnU4D0FsOZgg',
              platform: Platform.OS,
            }),
          },
          login
        );
        setTimeout(() => {
          sharedVWC.get().setWantStoreReview(false);
        }, 1);

        return undefined;
      },
      [loginContextRaw, sharedVWC]
    )
  );

  if (forceSplash) {
    return <SplashScreen type="wordmark" />;
  }

  if (step.step === 'pick') {
    return (
      <PickEmotion
        state={state}
        resources={resources}
        gotoJourney={gotoJourney}
      />
    );
  }

  return (
    <RenderGuardedComponent
      props={selectedVWC}
      component={(selected) => {
        if (selected === null) {
          return <></>;
        }
        const props = {
          journey: selected.journey,
          shared: sharedVWC,
          setScreen,
          onJourneyFinished: onFinishJourney,
          isOnboarding: resources.get().isOnboarding,
        };

        if (step.step === 'lobby') {
          return <JourneyLobbyScreen {...props} />;
        }

        if (step.step === 'start') {
          return (
            <JourneyStartScreen
              {...props}
              selectedEmotionAntonym={selected.word.antonym}
            />
          );
        }

        if (step.step === 'journey') {
          return <Journey {...props} />;
        }

        if (step.step === 'feedback') {
          return <JourneyFeedbackScreen {...props} />;
        }

        if (step.step === 'post') {
          return (
            <JourneyPostScreen
              {...props}
              classesTakenToday={state.get().classesTakenThisSession}
            />
          );
        }

        return <></>;
      }}
    />
  );
};
