import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The information that we store for deciding whether or not to request
 * a store review
 */
export type JourneyFeedbackRequestReviewStoredState = {
  /**
   * The time the user took their first journey on this device
   * since installing the app in milliseconds since the unix epoch,
   * using the device's clock
   */
  firstJourneyAtMS: number | null;

  /**
   * How many journeys the user has taken on this device since
   * installing the app
   */
  journeys: number;

  /**
   * How many ratings (journey feedback) the user has given on this device
   * since installing the app
   */
  ratings: number;

  /**
   * An array, where index 0 is the most recent rating, and index 1 is the
   * second most recent rating, etc., up to the 10 most recent ratings
   */
  recentRatings: {
    /**
     * The UID of the journey that was rated
     */
    journeyUid: string;

    /**
     * The rating given, from 1 to 4, where the options
     * are loved / liked / disliked / hated
     */
    rating: 1 | 2 | 3 | 4;

    /**
     * When the rating was given in milliseconds since the unix epoch
     */
    ratedAt: number;
  }[];

  /**
   * The last time a review was requested, in milliseconds since the unix epoch
   */
  lastRequestedReviewAtMS: number | null;
};

const initializeJourneyFeedbackRequestReviewStoredState =
  (): JourneyFeedbackRequestReviewStoredState => ({
    firstJourneyAtMS: null,
    journeys: 0,
    ratings: 0,
    recentRatings: [],
    lastRequestedReviewAtMS: null,
  });

const JOURNEY_FEEDBACK_REQUEST_REVIEW_STORED_STATE_KEY =
  "journeyFeedbackRequestReviewStoredState";

/**
 * Reads the stored journey feedback request review state from AsyncStorage,
 * initializing it if unset or corrupted
 */
export const readJourneyFeedbackRequestReviewStoredState =
  async (): Promise<JourneyFeedbackRequestReviewStoredState> => {
    let stored: string | null = null;
    try {
      stored = await AsyncStorage.getItem(
        JOURNEY_FEEDBACK_REQUEST_REVIEW_STORED_STATE_KEY
      );
    } catch (e) {
      console.error("error loading feedback from AsyncStorage", e);
    }

    if (stored === null) {
      return initializeJourneyFeedbackRequestReviewStoredState();
    }

    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("stored state is not an object");
      }
      if (
        parsed.firstJourneyAtMS !== null &&
        typeof parsed.firstJourneyAtMS !== "number"
      ) {
        throw new Error("firstJourneyAtMS is not a number");
      }
      if (typeof parsed.journeys !== "number") {
        throw new Error("journeys is not a number");
      }
      if (typeof parsed.ratings !== "number") {
        throw new Error("ratings is not a number");
      }
      if (!Array.isArray(parsed.recentRatings)) {
        throw new Error("recentRatings is not an array");
      }
      if (parsed.recentRatings.length > 10) {
        parsed.recentRatings = parsed.recentRatings.slice(0, 10);
      }
      for (const rating of parsed.recentRatings) {
        if (typeof rating !== "object" || rating === null) {
          throw new Error("rating is not an object");
        }
        if (typeof rating.journeyUid !== "string") {
          throw new Error("journeyUid is not a string");
        }
        if (
          typeof rating.rating !== "number" ||
          ![1, 2, 3, 4].includes(rating.rating)
        ) {
          throw new Error("rating is not a valid rating");
        }
        if (typeof rating.ratedAt !== "number") {
          throw new Error("ratedAt is not a number");
        }
      }
      if (
        parsed.lastRequestedReviewAtMS !== null &&
        typeof parsed.lastRequestedReviewAtMS !== "number"
      ) {
        throw new Error("lastRequestedReviewAtMS is not a number");
      }
      return parsed;
    } catch (e) {
      console.error("error parsing feedback from AsyncStorage", e);
      return initializeJourneyFeedbackRequestReviewStoredState();
    }
  };

/**
 * Writes the stored journey feedback request review state to AsyncStorage
 */
export const writeJourneyFeedbackRequestReviewStoredState = async (
  state: JourneyFeedbackRequestReviewStoredState
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      JOURNEY_FEEDBACK_REQUEST_REVIEW_STORED_STATE_KEY,
      JSON.stringify(state)
    );
  } catch (e) {
    console.error("error writing feedback to AsyncStorage", e);
  }
};

/**
 * Clears the stored journey feedback request review state from AsyncStorage,
 * usually because the user has logged out
 */
export const deleteJourneyFeedbackRequestReviewStoredState =
  async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(
        JOURNEY_FEEDBACK_REQUEST_REVIEW_STORED_STATE_KEY
      );
    } catch (e) {
      console.error("error deleting feedback from AsyncStorage", e);
    }
  };

let __lock: Promise<any> | null = null;

const withLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  let canStartResolve: () => void = () => {};
  const canStart = new Promise<void>((resolve) => {
    canStartResolve = resolve;
  });
  const promise = (async () => {
    await canStart;
    try {
      return await fn();
    } finally {
      __lock = null;
    }
  })();

  while (__lock !== null) {
    const tryingLock = __lock;
    try {
      await tryingLock;
    } catch (e) {
      console.error("error waiting for lock", e);
    }
    if (__lock === tryingLock) {
      throw new Error("lock was released but not set to null");
    }
  }
  __lock = promise;
  canStartResolve();
  return promise;
};

/**
 * Handles the user taking a journey, updating the stored state
 */
export const onJourneyTaken = async () => {
  await withLock(async () => {
    const state = await readJourneyFeedbackRequestReviewStoredState();
    if (state.firstJourneyAtMS === null) {
      state.firstJourneyAtMS = Date.now();
    }
    state.journeys++;
    await writeJourneyFeedbackRequestReviewStoredState(state);
  });
};

/**
 * Handles the user rating a journey, updating the stored state
 * and returning if it may be appropriate to request a store review
 */
export const onJourneyRated = async (
  journeyUid: string,
  rating: 1 | 2 | 3 | 4
): Promise<boolean> => {
  return await withLock(async (): Promise<boolean> => {
    const state = await readJourneyFeedbackRequestReviewStoredState();
    state.ratings++;
    const ogRecentRatings = state.recentRatings.slice();
    state.recentRatings.unshift({
      journeyUid,
      rating,
      ratedAt: Date.now(),
    });
    if (state.recentRatings.length > 10) {
      state.recentRatings.splice(10, state.recentRatings.length - 10);
    }
    await writeJourneyFeedbackRequestReviewStoredState(state);

    return (
      rating === 1 &&
      ogRecentRatings.some((r) => r.rating === 1) &&
      state.lastRequestedReviewAtMS === null
    );
  });
};

/**
 * Handles the user being asked to review the app, updating the stored state
 */
export const onReviewRequested = async () => {
  await withLock(async () => {
    const state = await readJourneyFeedbackRequestReviewStoredState();
    state.lastRequestedReviewAtMS = Date.now();
    await writeJourneyFeedbackRequestReviewStoredState(state);
  });
};
