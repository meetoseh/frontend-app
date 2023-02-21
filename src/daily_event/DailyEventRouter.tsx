import { View, Text } from 'react-native';
import { JourneyRef } from '../journey/models/JourneyRef';
import { DailyEvent } from './models/DailyEvent';

type DailyEventRouterProps = {
  /**
   * The event to show
   */
  event: DailyEvent;

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

export const DailyEventRouter = ({ event }: DailyEventRouterProps) => {
  return (
    <View>
      <Text>Daily Event Router: {event.uid}</Text>
    </View>
  );
};
