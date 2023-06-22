import { ReactElement } from 'react';
import { ValueWithCallbacks } from '../lib/Callbacks';
import { Audio } from 'expo-av';
import { ContentFileNativeExport, OsehContentTarget } from './OsehContentTarget';

/**
 * The default Audio.Sound is a little less powerful than the HTMLAudioElement
 * used on the web. This wraps the Audio.Sound with a few extra properties to
 * make their behavior more similar.
 */
export type WrappedAudioSound = {
  /**
   * The native export where the audio is loaded from. Since we are capable
   * of loading with headers, this is required over just the url in order
   * to indicate presigning status / jwt.
   */
  target: OsehContentTarget;

  /**
   * The sound object, if available, otherwise null. Prefer to use cancel()
   * instead of unloadAudioAsync(): if we are swapping the Audio.Sound object
   * for another one, there is a period of time before the Audio.Sound is set
   * here and the old one cleaned up, and cancel() will make sure it's still
   * canceled during that time.
   */
  sound: Audio.Sound | null;
  /**
   * True if this audio sound has already been canceled, otherwise false.
   * Once canceled the sound will not be loaded again
   */
  canceled: boolean;
  /**
   * A function which, if not canceled, will eventually ensure all the audio
   * and requests are unloaded. This is a no-op if the audio is already canceled.
   */
  cancel: () => void;
}

/**
 * Describes a loading or loaded audio content file. This can be played or stopped.
 * On the web, playing or stopping requires a privileged context.
 */
export type OsehAudioContentState = {
  /**
   * A function that can be used to play the audio, if the audio is ready to
   * be played, otherwise null. Note that play() is privileged, meaning that
   * it must be called _immediately_ after a user interaction, after the audio
   * is loaded, or it will fail.
   */
  play: ((this: void) => Promise<void>) | null;

  /**
   * A function that can be used to stop the audio, if the audio is playing.
   */
  stop: ((this: void) => Promise<void>) | null;

  /**
   * A convenience boolean which is true if the audio is ready to be played.
   * This is equivalent to (play !== null), but more semantically meaningful.
   */
  loaded: boolean;

  /**
   * If an error occurred and this will never finish loading, this will be
   * an element describing the error. Otherwise, this will be null.
   */
  error: ReactElement | null;

  /**
   * A reference to the underlying audio element, if it has been created.
   * This is useful for more advanced use cases.
   */
  audio: ValueWithCallbacks<WrappedAudioSound | null>;
};
