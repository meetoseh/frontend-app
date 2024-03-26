import { ReactElement, useEffect, useMemo } from 'react';
import { useStateCompat as useState } from '../../shared/hooks/useStateCompat';
import { getJwtExpiration } from '../../shared/lib/getJwtExpiration';
import { useJourneyShared } from './hooks/useJourneyShared';
import { JourneyRef } from './models/JourneyRef';
import { JourneyScreenProps } from './models/JourneyScreenProps';
import { JourneyLobbyScreen } from './screens/JourneyLobbyScreen';
import { JourneyStartScreen } from './screens/JourneyStartScreen';
import { Journey } from './screens/Journey';
import { JourneyFeedbackScreen } from './screens/JourneyFeedbackScreen';

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

  /**
   * If take another class support is available, the relevant information.
   */
  takeAnother: {
    /**
     * The emotion or word for the type of class that will be found, e.g.,
     * "grounded". Used in e.g "Take another grounded class"
     */
    emotion: string;

    /**
     * The function to call when the user requests to take another class.
     */
    onTakeAnother: () => void;
  } | null;
};

export type JourneyRouterScreenId = 'lobby' | 'start' | 'journey' | 'feedback';

export const JourneyRouter = ({
  journey,
  onFinished,
  isOnboarding,
  takeAnother,
}: JourneyRouterProps): ReactElement => {
  const [screen, setScreen] = useState<JourneyRouterScreenId>('lobby');
  const sharedState = useJourneyShared({
    type: 'react-rerender',
    props: journey,
  });
  const screenProps: JourneyScreenProps = useMemo(() => {
    return {
      journey,
      shared: sharedState,
      setScreen: (screen) => {
        screen = screen as JourneyRouterScreenId;

        if (screen === 'journey') {
          const audio = sharedState.get().audio;
          if (!audio.loaded || audio.play === null || audio.audio === null) {
            console.warn(
              'setScreen to journey, but audio not loaded. going to start'
            );
            setScreen('start');
            return;
          }

          audio.play();
          setScreen('journey');
          return;
        }

        setScreen(screen);
      },
      onJourneyFinished: onFinished,
      isOnboarding,
      takeAnother,
    };
  }, [journey, sharedState, onFinished, isOnboarding, takeAnother]);

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

  if (screen === 'lobby') {
    return <JourneyLobbyScreen {...screenProps} />;
  }

  if (screen === 'start') {
    return <JourneyStartScreen {...screenProps} />;
  }

  if (screen === 'journey') {
    return <Journey {...screenProps} />;
  }

  if (screen === 'feedback') {
    return <JourneyFeedbackScreen {...screenProps} />;
  }

  return handleUnknownScreen(screen);
};

// used to tell the type system that this should never happen;
// notice how if you remove a case above, you'll get a compile error
const handleUnknownScreen = (screen: never): never => {
  throw new Error(`Unknown journey screen ${screen}`);
};
