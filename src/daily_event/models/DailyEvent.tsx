import { convertUsingKeymap, CrudFetcherKeyMap } from '../../shared/lib/CrudFetcher';
import { DailyEventJourney, dailyEventJourneyKeyMap } from './DailyEventJourney';

export type DailyEventAccess = {
  /**
   * If the user can start a random journey within this daily event
   */
  startRandom: boolean;
};

export type DailyEvent = {
  /**
   * The primary stable external identifier for this daily event
   */
  uid: string;
  /**
   * The JWT which provides access to this daily event. The amount of
   * access depends on the `access` field and the `access` field of
   * each journey.
   */
  jwt: string;
  /**
   * The journeys that are available for this daily event
   */
  journeys: DailyEventJourney[];
  /**
   * The privileges the user has for this daily event unrelated to
   * a particular journey.
   */
  access: DailyEventAccess;
};

/**
 * Describes how to convert an api response containing a daily event
 * to our internal representation.
 */
export const dailyEventKeyMap: CrudFetcherKeyMap<DailyEvent> = {
  journeys: (_, v: any[]) => ({
    key: 'journeys',
    value: v.map((j: any) => convertUsingKeymap(j, dailyEventJourneyKeyMap)),
  }),
  access: (_, v) => ({ key: 'access', value: { startRandom: v.start_random } }),
};
