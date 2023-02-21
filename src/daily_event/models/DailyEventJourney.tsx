import { OsehImageRef } from '../../shared/hooks/useOsehImage';
import { CrudFetcherKeyMap } from '../../shared/lib/CrudFetcher';

export type DailyEventJourneyCategory = { externalName: string };
export type DailyEventJourneyInstructor = { name: string };
export type DailyEventJourneyDescription = { text: string };
export type DailyEventJourneyAccess = {
  /**
   * True if the user can start this journey via the start_specific endpoint,
   * false if they cannot
   */
  start: boolean;
};

/**
 * Describes abridged information about a journey that is received when
 * we receive a daily event, but before we've selected a journey.
 */
export type DailyEventJourney = {
  /**
   * The primary stable external identifier for the journey
   */
  uid: string;

  /**
   * The category the journey belongs to
   */
  category: DailyEventJourneyCategory;

  /**
   * The title of the journey
   */
  title: string;

  /**
   * The person who voiced the journey
   */
  instructor: DailyEventJourneyInstructor;

  /**
   * The medium-length (2-3 lines) description of the journey
   */
  description: DailyEventJourneyDescription;

  /**
   * The darkened background image for the journey
   */
  backgroundImage: OsehImageRef;

  /**
   * What privileges the user has for this journey
   */
  access: DailyEventJourneyAccess;
};

/**
 * Describes how to convert an api response containing a daily event journey
 * to our internal representation.
 */
export const dailyEventJourneyKeyMap: CrudFetcherKeyMap<DailyEventJourney> = {
  category: (_, v) => ({ key: 'category', value: { externalName: v.external_name } }),
  background_image: 'backgroundImage',
};
