import { ReactElement, useContext, useEffect, useState } from 'react';
import { LoginContext } from '../shared/contexts/LoginContext';
import { apiFetch } from '../shared/lib/apiFetch';
import { convertUsingKeymap } from '../shared/lib/CrudFetcher';
import { describeError } from '../shared/lib/describeError';
import { SplashScreen } from '../splash/SplashScreen';
import { JourneyRouter } from './JourneyRouter';
import { JourneyRef, journeyRefKeyMap } from './models/JourneyRef';

type IntroductoryJourneyScreenProps = {
  /**
   * The function to call when the user is done with the journey,
   * or they are no longer logged in. May be provided an error,
   * which is as if by describeError.
   */
  onFinished: (error?: ReactElement | null) => void;
};

/**
 * A simple component which loads an introductory journey and shows it to
 * the user via the JourneyRouter. Requires a logged-in user.
 */
export const IntroductoryJourneyScreen = ({
  onFinished,
}: IntroductoryJourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const [journey, setJourney] = useState<JourneyRef | null>(null);

  useEffect(() => {
    if (loginContext.state === 'loading') {
      return;
    }

    if (loginContext.state === 'logged-out') {
      onFinished();
      return;
    }

    if (journey !== null) {
      return;
    }

    let active = true;
    loadJourney();
    return () => {
      active = false;
    };

    async function loadJourney() {
      try {
        const response = await apiFetch(
          '/api/1/users/me/start_introductory_journey',
          {
            method: 'POST',
          },
          loginContext
        );

        if (!active) {
          return;
        }

        if (!response.ok) {
          throw response;
        }

        const data = await response.json();
        if (!active) {
          return;
        }

        const journey = convertUsingKeymap(data, journeyRefKeyMap);
        setJourney(journey);
      } catch (e) {
        if (!active) {
          return;
        }

        const described = await describeError(e);
        if (!active) {
          return;
        }

        onFinished(described);
      }
    }
  }, [loginContext, journey, onFinished]);

  if (journey === null) {
    return <SplashScreen />;
  }

  return (
    <JourneyRouter
      journey={journey}
      onFinished={onFinished}
      isOnboarding={true}
      initialError={null}
    />
  );
};
