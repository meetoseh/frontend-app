import { ReactElement } from 'react';
import {
  Callbacks,
  ValueWithCallbacks,
  createWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { createCancelablePromiseFromCallbacks } from '../lib/createCancelablePromiseFromCallbacks';
import { setVWC } from '../lib/setVWC';
import { ContentFileNativeExport } from './OsehContentTarget';
import { Audio, AVPlaybackStatus } from 'expo-av';

export type OsehAudioContentStateLoading = {
  /**
   * - `loading`: The audio is still loading
   */
  type: 'loading';
  play: null;
  stop: null;
  error: null;
  audio: null;
};

export type OsehAudioContentStateError = {
  /**
   * - `error`: The audio failed to load
   */
  type: 'error';
  play: null;
  stop: null;
  error: ReactElement;
  audio: null;
};

export type OsehAudioContentStateLoaded = {
  /**
   * - `loaded`: The audio is ready to be played
   */
  type: 'loaded';
  play: () => Promise<void>;
  stop: () => Promise<void>;
  error: null;
  audio: Audio.Sound;
  onStatusUpdate: Callbacks<AVPlaybackStatus>;
};

export type OsehAudioContentStateUnloaded = {
  /**
   * - `unloaded`: The audio has been unloaded
   */
  type: 'unloaded';
  play: null;
  stop: null;
  error: null;
  audio: null;
};

export type OsehAudioContentState =
  | OsehAudioContentStateLoading
  | OsehAudioContentStateError
  | OsehAudioContentStateLoaded
  | OsehAudioContentStateUnloaded;

/**
 * Loads the audio associated with the given content file target. Returns
 * the state of the audio and a function to dispose the instance.
 */
export const createOsehAudioContentState = (
  target: ContentFileNativeExport
): [ValueWithCallbacks<OsehAudioContentState>, () => void] => {
  const result = createWritableValueWithCallbacks<OsehAudioContentState>({
    type: 'loading',
    play: null,
    stop: null,
    error: null,
    audio: null,
  });

  const active = createWritableValueWithCallbacks(true);
  fetchAudio();

  return [
    result,
    () => {
      setVWC(active, false);
    },
  ];

  async function fetchAudio() {
    const soundObject = await Audio.Sound.createAsync(
      {
        uri: target.url,
        headers: target.presigned
          ? {}
          : {
              Authorization: `bearer ${target.jwt}`,
            },
      },
      { shouldPlay: false }
    );

    const canceled = createCancelablePromiseFromCallbacks(active.callbacks);
    canceled.promise.catch(() => {});
    if (!active.get()) {
      canceled.cancel();
      setVWC(result, {
        type: 'unloaded',
        play: null,
        stop: null,
        error: null,
        audio: null,
      });
      await soundObject.sound.unloadAsync();
      return;
    }

    const statusUpdateCallbacks = new Callbacks<AVPlaybackStatus>();
    soundObject.sound.setOnPlaybackStatusUpdate((s) => {
      statusUpdateCallbacks.call(s);
    });

    setVWC(result, {
      type: 'loaded',
      play: async () => {
        if (!active.get()) {
          return;
        }
        await soundObject.sound.playAsync();
      },
      stop: async () => {
        if (!active.get()) {
          return;
        }
        await soundObject.sound.stopAsync();
      },
      error: null,
      audio: soundObject.sound,
      onStatusUpdate: statusUpdateCallbacks,
    });

    await canceled.promise;
    setVWC(result, {
      type: 'unloaded',
      play: null,
      stop: null,
      error: null,
      audio: null,
    });
    await soundObject.sound.unloadAsync();
  }
};
