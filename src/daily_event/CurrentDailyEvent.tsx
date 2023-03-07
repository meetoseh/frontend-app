import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { JourneyRef } from '../journey/models/JourneyRef';
import { SplashScreen } from '../splash/SplashScreen';
import { DailyEventRouter } from './DailyEventRouter';
import { useCurrentDailyEvent } from './hooks/useCurrentDailyEvent';

type CurrentDailyEventProps = {
  /**
   * The function to call if the user wants to go to their settings
   */
  onGotoSettings: () => void;

  /**
   * The function to call to display a journey that we've already
   * loaded.
   * @param journey The journey to go to
   */
  onGotoJourney: (journey: JourneyRef) => void;

  /**
   * If specified, called when the first screen is ready to be shown.
   */
  onReady?: () => void;

  /**
   * If an error should be propagated from an earlier screen, it can be
   * specified here. This is useful when the user is trying to do something
   * in a previous screen and an error occurs preventing the earlier screen
   * from being displayed.
   */
  initialError: ReactElement | null;
};

/**
 * Loads the current daily event and then displays it.
 */
export const CurrentDailyEvent = ({
  onGotoSettings,
  onGotoJourney,
  onReady,
  initialError,
}: CurrentDailyEventProps): ReactElement => {
  const [reloadCounter, setReloadCounter] = useState(0);
  const [event, currentDailyEventError] = useCurrentDailyEvent(reloadCounter);
  const [error, setError] = useState<ReactElement | null>(initialError);

  const [reloading, setReloading] = useState(false);
  const reload = useCallback(() => {
    if (reloading) {
      return;
    }

    setReloadCounter((counter) => counter + 1);
    setReloading(true);
    setTimeout(() => {
      setReloading(false);
    }, 1500);
  }, [reloading]);

  useEffect(() => {
    if (currentDailyEventError) {
      setError(currentDailyEventError);
    }
  }, [currentDailyEventError]);

  if (event === null && error === initialError) {
    return <SplashScreen type="brandmark" />;
  }

  // to improve confidence that we're actually reloading, we purposely
  // show a long splash screen
  if (reloading) {
    return <SplashScreen type="wordmark" />;
  }

  if (event === null) {
    return (
      <View>
        {error}
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <DailyEventRouter
      event={event}
      onGotoSettings={onGotoSettings}
      onGotoJourney={onGotoJourney}
      onReload={reload}
      onReady={onReady}
      initialError={error}
    />
  );
};
