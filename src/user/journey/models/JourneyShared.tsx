import { OldOsehAudioContentState } from '../../../shared/content/OldOsehAudioContentState';
import { OsehImageState } from '../../../shared/images/OsehImageState';

/**
 * Describes some state that is shared between journey and journey start,
 * to reduce unnecessary network requests. This should generally be loaded
 * with useJourneyShared, which returns it as a value with callbacks so that
 * react rerenders can be tighter (i.e., in more nested components).
 */
export type JourneyShared = {
  /** This is actually the darkened image, since we don't need the original */
  darkenedImage: OsehImageState;
  /** The blurred image so the share screen comes up quick */
  blurredImage: OsehImageState;
  /**
   * The audio for the journey; has loaded state inside
   * (audio.loaded).
   */
  audio: OldOsehAudioContentState;
  /**
   * True if the user has favorited this journey, false if they have
   * not, null if we don't know yet. Setting this value only changes
   * our local state.
   */
  favorited: boolean | null;
  /**
   * A setter for favorited which can only be used if favorited is not null
   */
  setFavorited: (favorited: boolean) => void;
  /**
   * True if we want to request a store review, false otherwise
   */
  wantStoreReview: boolean;
  /**
   * Sets whether we want to request a store review
   */
  setWantStoreReview: (wantStoreReview: boolean) => void;
};
