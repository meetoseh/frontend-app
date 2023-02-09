import { ReactElement, useMemo, useState } from 'react';
import { SplashScreen } from '../splash/SplashScreen';
import { useJourneyShared } from './hooks/useJourneyShared';
import { JourneyRef } from './models/JourneyRef';
import { JourneyScreenProps } from './models/JourneyScreenProps';
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
   * If specified, shown as the initial error for this journey.
   */
  initialError: ReactElement | null;
};

export type JourneyRouterScreenId = 'start' | 'journey' | 'post' | 'share';

/**
 * Takes the user through the entire flow for the given journey, starting
 * at the journey start screen (invite friends or skip), ending with the
 * user rating the journey and potentially sharing a sample.
 */
export const JourneyRouter = ({
  journey,
  onFinished,
  initialError,
}: JourneyRouterProps): ReactElement => {
  const [screen, setScreen] = useState<JourneyRouterScreenId>('start');
  const sharedState = useJourneyShared(journey);
  const [error, setError] = useState<ReactElement | null>(initialError);
  const screenProps: JourneyScreenProps = useMemo(() => {
    return {
      journey,
      shared: sharedState,
      setScreen,
      onJourneyFinished: onFinished,
      error,
      setError,
    };
  }, [journey, sharedState, error, onFinished]);

  if (sharedState.imageLoading || sharedState.audioLoading) {
    return <SplashScreen />;
  }

  if (screen === 'post' && sharedState.blurredImageLoading) {
    return <SplashScreen />;
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
