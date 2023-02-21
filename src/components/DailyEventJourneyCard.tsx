import { ReactElement } from 'react';
import { View, Text } from 'react-native';
import { DailyEventJourneyState } from '../daily_event/hooks/useDailyEventJourneyState';
import { DailyEvent } from '../daily_event/models/DailyEvent';
import { DailyEventJourney } from '../daily_event/models/DailyEventJourney';
import { GestureHandler, SwipingDirection } from '../shared/lib/GestureHandler';

type DailyEventJourneyCardProps = {
  /**
   * The daily event this journey is a part of
   */
  event: DailyEvent;

  /**
   * The journey to show
   */
  journey: DailyEventJourney;

  /**
   * The loaded information about the journey card, so it can be
   * reused even when the card is unmounted
   */
  state: DailyEventJourneyState;

  /**
   * The function to call when the user wants to see their settings.
   */
  onGotoSettings: () => void;

  /**
   * Called when the user pans the card.
   *
   * @param gesture The gesture that has been detected
   * @param dir The direction the user is swiping, or null if no gesture
   * @returns
   */
  onPan: (gesture: GestureHandler, dir: SwipingDirection | null) => void;

  /**
   * The function to call when the user wants to play this journey. Only
   * called if the user has access to play this journey.
   */
  onStart: () => void;

  /**
   * The function to call when the user wants to play a random journey
   * within this daily event. Only called if the user has access to
   * play a random journey.
   */
  onStartRandom: () => void;
};

/**
 * Shows a full screen card describing a journey within a daily event, with
 * tools to select that journey.
 */
export const DailyEventJourneyCard = ({
  journey,
  state,
}: DailyEventJourneyCardProps): ReactElement => {
  return (
    <View>
      <Text>
        Journey Card: {journey.title}, {state.loading}
      </Text>
    </View>
  );
};
