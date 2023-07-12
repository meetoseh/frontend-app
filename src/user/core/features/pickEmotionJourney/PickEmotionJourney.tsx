import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useStateCompat as useState } from "../../../../shared/hooks/useStateCompat";
import { FeatureComponentProps } from "../../models/Feature";
import { PickEmotionJourneyResources } from "./PickEmotionJourneyResources";
import { PickEmotionJourneyState } from "./PickEmotionJourneyState";
import { PickEmotion } from "./PickEmotion";
import { JourneyRouterScreenId } from "../../../journey/JourneyRouter";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { useUnwrappedValueWithCallbacks } from "../../../../shared/hooks/useUnwrappedValueWithCallbacks";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { createLoadingJourneyShared } from "../../../journey/hooks/useJourneyShared";
import { SplashScreen } from "../../../splash/SplashScreen";
import { JourneyLobbyScreen } from "../../../journey/screens/JourneyLobbyScreen";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";

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
  const loginContext = useContext(LoginContext);
  const [step, setStep] = useState<{
    journeyUid: string | null;
    step: "pick" | JourneyRouterScreenId;
  }>({ journeyUid: null, step: "pick" });
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

    function handleSelected(selected: PickEmotionJourneyResources["selected"]) {
      if (selected === null && stepRef.current.step !== "pick") {
        setStepNextTick({ journeyUid: null, step: "pick" });
        return;
      }

      if (
        selected !== null &&
        stepRef.current.step === "pick" &&
        selected.skipsStats
      ) {
        setStepNextTick({ journeyUid: selected.journey.uid, step: "lobby" });
        return;
      }

      if (
        selected !== null &&
        step.step !== "pick" &&
        step.journeyUid !== selected.journey.uid
      ) {
        setStepNextTick({ journeyUid: null, step: "pick" });
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
  }, [resources]);

  const gotoJourney = useCallback(() => {
    const selected = resources.get().selected;
    if (selected === null) {
      console.warn("gotoJourney without a journey to goto");
      return;
    }
    setStep({ journeyUid: selected.journey.uid, step: "lobby" });
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
      if (stepRef.current.step === "pick") {
        return;
      }

      if (typeof screen === "function") {
        screen = screen(stepRef.current.step);
      }

      const selected = resources.get().selected;
      if (selected === null) {
        console.warn("Cannot go to journey screen without a selected emotion.");
        return;
      }

      if (screen !== "lobby") {
        onFinishJourney();
        return;
      }

      const newStep = { journeyUid: selected.journey.uid, step: screen };
      stepRef.current = newStep;
      setStep(newStep);
    },
    [resources, loginContext]
  );

  const forceSplash = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(resources, (r) => r.forceSplash)
  );
  const selectedJourneyVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.selected?.journey,
    {
      outputEqualityFn: (a, b) => a?.uid === b?.uid,
    }
  );
  const sharedVWC = useMappedValueWithCallbacks(
    resources,
    (r) =>
      r.selected?.shared ??
      createLoadingJourneyShared(
        { width: 0, height: 0 },
        { width: 0, height: 0 }
      )
  );

  if (forceSplash) {
    return <SplashScreen type="wordmark" />;
  }

  if (step.step === "pick") {
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
      props={selectedJourneyVWC}
      component={(journey) => {
        if (journey === undefined) {
          console.warn(
            "Not at the pick step, but there's no selected emotion."
          );
          return <></>;
        }
        const props = {
          journey: journey,
          shared: sharedVWC,
          setScreen,
          onJourneyFinished: onFinishJourney,
          isOnboarding: resources.get().isOnboarding,
        };

        return <JourneyLobbyScreen {...props} />;
      }}
    />
  );
};
