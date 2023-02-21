import { useMemo } from 'react';
import { OsehImageProps, OsehImageState, useOsehImageState } from '../../shared/hooks/useOsehImage';
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
export const useDailyEventJourneyState = (journey: DailyEventJourney): DailyEventJourneyState => {
  const screenSize = useScreenSize();
  const imageProps: OsehImageProps = useMemo(
    () => ({
      uid: journey.backgroundImage.uid,
      jwt: journey.backgroundImage.jwt,
      displayWidth: screenSize.width,
      displayHeight: screenSize.height,
      alt: '',
    }),
    [journey, screenSize]
  );

  const image = useOsehImageState(imageProps);

  return useMemo(
    () => ({
      image,
      loading: image.loading,
    }),
    [image]
  );
};
