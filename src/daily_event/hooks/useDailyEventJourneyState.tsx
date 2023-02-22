import { useMemo } from 'react';
import {
  OsehImageProps,
  OsehImageState,
  useOsehImageStates,
} from '../../shared/hooks/useOsehImage';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { DailyEventJourney } from '../models/DailyEventJourney';

export type DailyEventJourneyState = {
  /**
   * The background image for the card, at the correct size for the screen
   */
  image: OsehImageState;

  /**
   * If we are still loading at least some required information about the
   * journey for displaying a card, such as the image
   */
  loading: boolean;
};

/**
 * Loads the required state for immediately displaying a card for a journey
 * within a daily event.
 *
 * @param journey The journey to load
 */
export const useDailyEventJourneyState = (journey: DailyEventJourney) => {
  const journeys = useMemo(() => [journey], [journey]);
  return useDailyEventJourneyStates(journeys)[0];
};

/**
 * Loads the required state for immediately displaying multiple cards for
 * multiple journeys within a daily event.
 *
 * @param journeys The journeys to load
 * @returns The loaded journeys, in the same order as the input
 */
export const useDailyEventJourneyStates = (
  journeys: DailyEventJourney[]
): DailyEventJourneyState[] => {
  const screenSize = useScreenSize();
  const imageProps = useMemo<OsehImageProps[]>(
    () =>
      journeys.map((journey) => ({
        uid: journey.backgroundImage.uid,
        jwt: journey.backgroundImage.jwt,
        displayWidth: screenSize.width,
        displayHeight: screenSize.height,
        alt: '',
      })),
    [journeys, screenSize]
  );

  const images = useOsehImageStates(imageProps);

  return useMemo(
    () =>
      images.map((image) => ({
        image,
        loading: image.loading,
      })),
    [images]
  );
};
