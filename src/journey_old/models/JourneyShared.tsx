import { OsehContentState } from '../../shared/hooks/useOsehContent';
import { OsehImageState } from '../../shared/hooks/useOsehImage';

/**
 * Describes some state that is preserved across the different journey
 * screens, e.g., journey start, journey, post journey, etc, to avoid
 * unnecessarily reprocessing the same data.
 */
export type JourneyShared = {
  /** As if from useScreenSize */
  screenSize: { width: number; height: number };
  /** This is actually the darkened image, since we don't need the original */
  image: OsehImageState | null;
  /** If we're still loading the darkened image */
  imageLoading: boolean;
  /** The blurred image so the share screen comes up quick */
  blurredImage: OsehImageState | null;
  /** If we're still loading the blurred image */
  blurredImageLoading: boolean;
  /** The audio for the journey if it's loaded and still needed */
  audio: OsehContentState | null;
  /** If we're still loading the audio for the journey */
  audioLoading: boolean;
};
