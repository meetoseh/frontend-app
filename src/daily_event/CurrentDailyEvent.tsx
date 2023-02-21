import { StatusBar } from 'expo-status-bar';
import { ReactElement } from 'react';
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
};

/**
 * Loads the current daily event and then displays it.
 */
export const CurrentDailyEvent = ({
  onGotoSettings,
  onGotoJourney,
}: CurrentDailyEventProps): ReactElement => {
  const [event, error] = useCurrentDailyEvent();

  if (event === null && error === null) {
    return <SplashScreen type="brandmark" />;
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
    <DailyEventRouter event={event} onGotoSettings={onGotoSettings} onGotoJourney={onGotoJourney} />
  );
};
