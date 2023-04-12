import { ReactElement, useEffect, useMemo, useState } from 'react';
import { SplashScreen } from '../splash/SplashScreen';
import { useJourneyShared } from './hooks/useJourneyShared';
import { JourneyRef } from './models/JourneyRef';
import { JourneyScreenProps } from './models/JourneyScreenProps';
import { JourneyLobbyScreen } from './screens/JourneyLobbyScreen';
import { JourneyPostScreen } from './screens/JourneyPostScreen';
import { JourneyScreen } from './screens/JourneyScreen';
import { JourneyShareScreen } from './screens/JourneyShareScreen';
import { JourneyStartScreen } from './screens/JourneyStartScreen';

type JourneyRouterProps = {
  /**
   * The journey we are pushing the user through the flow of
   */
  journey: JourneyRef;

  /**
   * The function to call when the user is done with the journey.
   * May be passed an error, which should be shown to the user on
   * the screen they return to.
   */
  onFinished: (error?: ReactElement | null) => void;

  /**
   * True if this is an onboarding journey, false otherwise.
   */
  isOnboarding: boolean;

  /**
   * If specified, shown as the initial error for this journey.
   */
  initialError: ReactElement | null;

  /**
   * If specified, called when the first screen is ready to be shown.
   */
  onReady?: () => void;
};

export type JourneyRouterScreenId = 'lobby' | 'start' | 'journey' | 'post' | 'share';

/**
 * Takes the user through the entire flow for the given journey, starting
 * at the journey start screen (invite friends or skip), ending with the
 * user rating the journey and potentially sharing a sample.
 */
export const JourneyRouter = ({
  journey,
  onFinished,
  isOnboarding,
  initialError,
  onReady,
}: JourneyRouterProps): ReactElement => {
  const [screen, setScreen] = useState<JourneyRouterScreenId>('lobby');
  const sharedState = useJourneyShared(journey);
  const [error, setError] = useState<ReactElement | null>(initialError);
  const [setReady, setSetReady] = useState(false);
  const screenProps: JourneyScreenProps = useMemo(() => {
    return {
      journey,
      shared: sharedState,
      setScreen,
      onJourneyFinished: onFinished,
      isOnboarding,
      error,
      setError,
    };
  }, [journey, sharedState, error, onFinished, isOnboarding]);

  useEffect(() => {
    if (!setReady && !sharedState.imageLoading) {
      setSetReady(true);
    }
  }, [setReady, sharedState.imageLoading]);

  useEffect(() => {
    if (setReady && onReady) {
      onReady();
    }
  }, [setReady, onReady]);

  if (sharedState.imageLoading) {
    return <SplashScreen />;
  }

  if ((screen === 'start' || screen === 'journey') && sharedState.audioLoading) {
    return <SplashScreen />;
  }

  if (screen === 'post' && sharedState.blurredImageLoading) {
    return <SplashScreen />;
  }

  if (screen === 'lobby') {
    return <JourneyLobbyScreen {...screenProps} />;
  }

  if (screen === 'start') {
    return <JourneyStartScreen {...screenProps} />;
  }

  if (screen === 'journey') {
    return <JourneyScreen {...screenProps} />;
  }

  if (screen === 'post') {
    return <JourneyPostScreen {...screenProps} />;
  }

  if (screen === 'share') {
    return <JourneyShareScreen {...screenProps} />;
  }

  throw new Error(`Unknown journey screen in JourneyRouter: ${screen}`);
};
