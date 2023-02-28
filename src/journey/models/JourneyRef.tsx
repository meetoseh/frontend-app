import { OsehContentRef } from '../../shared/hooks/useOsehContent';
import { OsehImageRef } from '../../shared/hooks/useOsehImage';
import { CrudFetcherKeyMap } from '../../shared/lib/CrudFetcher';

/**
 * A prompt where we show a number spinner and the user selects
 * a number from that.
 */
export type NumericPrompt = {
  /**
   * The style of the prompt. This is always 'numeric' for this type.
   */
  style: 'numeric';

  /**
   * The text to show to the user which they use to select a number.
   */
  text: string;

  /**
   * The minimum number that the user can select. Integer value, inclusive.
   */
  min: number;

  /**
   * The maximum number that the user can select. Integer value, inclusive.
   */
  max: number;

  /**
   * The step size between numbers. Integer value, results in about 10 or
   * fewer numbers being shown.
   */
  step: number;
};

/**
 * A prompt where we show the user a button and they can press (and hold)
 * whenever they want.
 */
export type PressPrompt = {
  /**
   * The style of the prompt. This is always 'press' for this type.
   */
  style: 'press';

  /**
   * The text to show to the user which they use to decide when to press
   */
  text: string;
};

/**
 * A prompt where we show the user multiple colors and they select one.
 */
export type ColorPrompt = {
  /**
   * The style of the prompt. This is always 'color' for this type.
   */
  style: 'color';

  /**
   * The text to show to the user which they use to decide which color to select.
   */
  text: string;

  /**
   * The colors the user can choose from; 2-8 colors as rgb strings, e.g., #ff0000
   */
  colors: string[];
};

/**
 * A prompt where we show the user multiple words and they select one.
 */
export type WordPrompt = {
  /**
   * The style of the prompt. This is always 'word' for this type.
   */
  style: 'word';

  /**
   * The text to show to the user which they use to decide which word to select.
   */
  text: string;

  /**
   * The words the user can choose from; 2-8 words as strings
   */
  options: string[];
};

/**
 * A prompt that a journey can have
 */
export type Prompt = NumericPrompt | PressPrompt | ColorPrompt | WordPrompt;

/**
 * A reference to a journey, typically returned from the same endpoint which
 * starts a session in that journey. Contains everything we need to play the
 * journey, except for the parts that are requested while the journey is playing.
 */
export type JourneyRef = {
  /**
   * The UID of the journey to show. When the journey is initialized, this
   * already has a session active, but that session doesn't yet have any events
   * (including the join event)
   */
  uid: string;

  /**
   * The UID of the session within the journey that we will add events to when
   * the user interacts with the journey.
   */
  sessionUid: string;

  /**
   * The JWT which allows us access to the journey and session
   */
  jwt: string;

  /**
   * The duration of the journey in seconds, which should match the audio content
   */
  durationSeconds: number;

  /**
   * The duration of the journey lobby in seconds
   */
  lobbyDurationSeconds: number;

  /**
   * The background image to the journey prior to applying filters; we don't use this,
   * but it's helpful for trying out new features (such as a different darkening/blur
   * algorithm)
   */
  backgroundImage: OsehImageRef;

  /**
   * The image to show as the background of the journey
   */
  darkenedBackgroundImage: OsehImageRef;

  /**
   * The image to show as the blurred version of the background of the journey
   */
  blurredBackgroundImage: OsehImageRef;

  /**
   * The audio file to play during the journey
   */
  audioContent: OsehContentRef;

  /**
   * The category of the journey
   */
  category: {
    /**
     * The name of the category, as we show users
     */
    externalName: string;
  };

  /**
   * The very short title for the journey
   */
  title: string;

  /**
   * Who made the journey
   */
  instructor: {
    /**
     * Their display name
     */
    name: string;
  };

  /**
   * A brief description of what to expect in the journey
   */
  description: {
    /**
     * As raw text
     */
    text: string;
  };

  /**
   * The prompt to show to the user during the journey
   */
  prompt: Prompt;

  /**
   * If a short sample of this journey is available in video form (typically
   * a 1080x1920 15s vertical video), this is the content ref for that video.
   */
  sample: OsehContentRef | null;
};

/**
 * The key map for parsing journey refs
 */
export const journeyRefKeyMap: CrudFetcherKeyMap<JourneyRef> = {
  session_uid: 'sessionUid',
  duration_seconds: 'durationSeconds',
  lobby_duration_seconds: 'lobbyDurationSeconds',
  background_image: 'backgroundImage',
  darkened_background_image: 'darkenedBackgroundImage',
  blurred_background_image: 'blurredBackgroundImage',
  audio_content: 'audioContent',
  category: (_, val) => ({
    key: 'category',
    value: {
      externalName: val.external_name,
    },
  }),
};
