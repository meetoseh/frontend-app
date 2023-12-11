import { ReactElement, useEffect, useMemo } from "react";
import { useStateCompat as useState } from "../../shared/hooks/useStateCompat";
import { getJwtExpiration } from "../../shared/lib/getJwtExpiration";
import { useJourneyShared } from "./hooks/useJourneyShared";
import { JourneyRef } from "./models/JourneyRef";
import { JourneyScreenProps } from "./models/JourneyScreenProps";
import { JourneyLobbyScreen } from "./screens/JourneyLobbyScreen";
import { JourneyStartScreen } from "./screens/JourneyStartScreen";
import { Journey } from "./screens/Journey";
import { JourneyFeedbackScreen } from "./screens/JourneyFeedbackScreen";
import { JourneyPostScreen } from "./screens/JourneyPostScreen";

type JourneyRouterProps = {
  /**
   * The journey we are pushing the user through the flow of
   */
  journey: JourneyRef;

  /**
   * The function to call when the user is done with the journey.
   */
  onFinished: () => void;

  /**
   * True if this is an onboarding journey, false otherwise.
   */
  isOnboarding: boolean;
};

export type JourneyRouterScreenId =
  | "lobby"
  | "start"
  | "journey"
  | "feedback"
  | "post";

export const JourneyRouter = ({
  journey,
  onFinished,
  isOnboarding,
}: JourneyRouterProps): ReactElement => {
  const [screen, setScreen] = useState<JourneyRouterScreenId>("lobby");
  const sharedState = useJourneyShared({
    type: "react-rerender",
    props: journey,
  });
  const screenProps: JourneyScreenProps = useMemo(() => {
    return {
      journey,
      shared: sharedState,
      setScreen: (screen) => {
        screen = screen as JourneyRouterScreenId;

        if (screen === "journey") {
          const audio = sharedState.get().audio;
          if (!audio.loaded || audio.play === null || audio.audio === null) {
            console.warn(
              "setScreen to journey, but audio not loaded. going to start"
            );
            setScreen("start");
            return;
          }

          audio.play();
          setScreen("journey");
          return;
        }

        setScreen(screen);
      },
      onJourneyFinished: onFinished,
      isOnboarding,
    };
  }, [journey, sharedState, onFinished, isOnboarding]);

  useEffect(() => {
    const expireTime = getJwtExpiration(journey.jwt);
    if (expireTime <= Date.now()) {
      onFinished();
      return;
    }

    let active = true;
    const timeout = setTimeout(handleExpiration, expireTime - Date.now());
    return () => {
      active = false;
      clearTimeout(timeout);
    };

    function handleExpiration() {
      if (!active) {
        return;
      }
      onFinished();
    }
  }, [journey.jwt, onFinished]);

  if (screen === "lobby") {
    return <JourneyLobbyScreen {...screenProps} />;
  }

  if (screen === "start") {
    return <JourneyStartScreen {...screenProps} />;
  }

  if (screen === "journey") {
    return <Journey {...screenProps} />;
  }

  if (screen === "feedback") {
    return <JourneyFeedbackScreen {...screenProps} />;
  }

  if (screen === "post") {
    return <JourneyPostScreen {...screenProps} />;
  }

  return handleUnknownScreen(screen);
};

// used to tell the type system that this should never happen;
// notice how if you remove a case above, you'll get a compile error
const handleUnknownScreen = (screen: never): never => {
  throw new Error(`Unknown journey screen ${screen}`);
};
