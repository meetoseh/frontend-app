import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { DailyEventJourneyCard } from '../components/DailyEventJourneyCard';
import { JourneyRef } from '../../journey/models/JourneyRef';
import { GestureHandler, SwipingDirection } from '../../shared/lib/GestureHandler';
import { shuffle } from '../../shared/lib/shuffle';
import {
  DailyEventJourneyState,
  useDailyEventJourneyStates,
} from '../hooks/useDailyEventJourneyState';
import { DailyEvent } from '../models/DailyEvent';
import { DailyEventJourney } from '../models/DailyEventJourney';
import { styles } from './DailyEventScreenStyles';

type DailyEventScreenProps = {
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

export const DailyEventScreen = ({
  event,
  onGotoSettings,
  onGotoJourney,
}: DailyEventScreenProps) => {
  const loadedJourneys = useDailyEventJourneyStates(event.journeys);

  const carouselShuffle = useMemo<number[]>(() => {
    const result = [];
    for (let i = 0; i < event.journeys.length; i++) {
      result.push(i);
    }
    shuffle(result);
    return result;
  }, [event.journeys.length]);

  const reorderedJourneys = useMemo(() => {
    const result: { journey: DailyEventJourney; state: DailyEventJourneyState }[] = [];
    for (const idx of carouselShuffle) {
      result.push({
        journey: event.journeys[idx],
        state: loadedJourneys[idx],
      });
    }
    return result;
  }, [event.journeys, carouselShuffle, loadedJourneys]);

  const onStart = useCallback((journey: DailyEventJourney) => {
    // todo
  }, []);

  const boundOnStart = useMemo(() => {
    const result: (() => void)[] = [];
    reorderedJourneys.forEach((j) => {
      result.push(onStart.bind(undefined, j.journey));
    });
    return result;
  }, [reorderedJourneys, onStart]);

  const onPan = useCallback((gesture: GestureHandler, dir: SwipingDirection | null) => {
    // todo handle pan
  }, []);

  const onStartRandom = useCallback(() => {
    // todo
  }, []);

  return (
    <View style={styles.container}>
      <DailyEventJourneyCard
        journey={reorderedJourneys[0].journey}
        state={reorderedJourneys[0].state}
        event={event}
        onGotoSettings={onGotoSettings}
        onPan={onPan}
        onStart={boundOnStart[0]}
        onStartRandom={onStartRandom}
      />
      <StatusBar style="light" />
    </View>
  );
};
