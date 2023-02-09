import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { HTTP_API_URL } from '../lib/apiFetch';

export type OsehContentRef = {
  /**
   * The UID of the content file to show. If null, we will show nothing.
   */
  uid: string | null;

  /**
   * The JWT to use to access the content file. If null, we will show nothing.
   */
  jwt: string | null;
};

/**
 * The state that is loaded to prepare an audio content file to be played.
 */
type OsehAudioContentState = {
  /**
   * The string 'audio' to identify this is to be played as an audio file
   */
  type: 'audio';

  /**
   * The sound file to play, if it's been loaded successfully, otherwise null
   */
  sound: Audio.Sound | null;
};

/**
 * The state that is loaded to prepare a content file (audio or video) to
 * be played.
 *
 * TODO: video not implemented yet
 */
export type OsehContentState = OsehAudioContentState;

type UseOsehContentProps = {
  /**
   * The type of content we expect to retrieve. Currently only 'audio' is
   * supported, but 'video' will be supported in the future.
   */
  type: 'audio';

  /**
   * The uid of the oseh content file. If null, no content is loaded until
   * the uid is set.
   */
  uid: string | null;

  /**
   * The JWT which provides access to the content file. If null, no content
   * is loaded until the JWT is set.
   */
  jwt: string | null;

  /**
   * If provided, this will be called whenever we start or finish loading
   * the content. This can be used to display a splash screen while the content
   * is loading. Note that the device may decide that not all of the content
   * needs to be downloaded for it to play to completion, and in that case this
   * will be called when it's ready to play to completion rather than when it's
   * fully downloaded.
   *
   * @param loading True if we're loading, false otherwise
   * @param uid The uid of the content we're loading, or null if we don't know yet
   */
  setLoading?: ((this: void, loading: boolean, uid: string | null) => void) | null;

  /**
   * If specified, provided a function that can force us to recreate the
   * content state. This is useful for if the JWT expired and the device
   * chose not to download the entire content file during loadAsync, e.g.,
   * to save on data usage when on a metered connection. Typically this
   * would be called if an error playback status occurs.
   */
  doForceReload?: ((forceReload: (this: void) => void) => void) | null;
};

type _SoundRef = {
  uid: string;
  sound: Audio.Sound | null;
  cancel: AbortController | null;
  forceReloadCounter: number;
};

/**
 * Loads the oseh content provided at the given ref so that it can be easily played
 * later. This will not reload the content just because the jwt changes. An
 *
 * The sound is initialized _not_ to play automatically. The sound will not be
 * automatically cleaned up if the component is unmounted, so the caller should
 * call unloadAsync if a sound is available and no longer needed.
 */
export const useOsehContentState = ({
  type,
  uid,
  jwt,
  setLoading,
  doForceReload,
}: UseOsehContentProps): OsehContentState => {
  const soundRef = useRef<_SoundRef | null>(null);
  // soundCounter is incremented to indicate soundRef changed
  const [soundCounter, setSoundCounter] = useState(0);
  const [loadingInternal, setLoadingInternal] = useState(false);
  const [forceReloadCounter, setForceReloadCounter] = useState(0);

  useEffect(() => {
    setLoading?.apply(undefined, [loadingInternal, uid]);
  }, [loadingInternal, uid, setLoading]);

  useEffect(() => {
    doForceReload?.apply(undefined, [
      () => {
        setForceReloadCounter((c) => c + 1);
      },
    ]);
  }, [doForceReload]);

  useEffect(() => {
    if (soundRef.current !== null) {
      if (
        soundRef.current.uid === uid &&
        soundRef.current.forceReloadCounter === forceReloadCounter
      ) {
        // continue to let previous effect handler handle this
        return;
      }

      if (soundRef.current.cancel) {
        soundRef.current.cancel.abort();
      } else if (soundRef.current.sound) {
        soundRef.current.sound.unloadAsync();
      }
      soundRef.current = null;
      setSoundCounter((c) => c + 1);
    }

    setLoadingInternal(true);

    if (uid === null || jwt === null) {
      return;
    }

    const cancel = new AbortController();
    const me: _SoundRef = { uid, sound: null, cancel, forceReloadCounter };
    soundRef.current = me;
    setSoundCounter((c) => c + 1);

    fetchAndLoadSound();
    return;

    async function fetchAndLoadSound() {
      const path = Platform.select({
        ios: `/api/1/content_files/${uid}/ios.m3u8`,
        android: `/api/1/content_files/${uid}/android.m3u8`,
      });

      if (path === undefined) {
        throw new Error('Unsupported platform for audio content');
      }

      try {
        const soundObject = await Audio.Sound.createAsync(
          {
            uri: HTTP_API_URL + path,
            headers: {
              Authorization: `bearer ${jwt}`,
            },
          },
          { shouldPlay: false }
        );

        if (cancel.signal.aborted) {
          await soundObject.sound.unloadAsync();
          return;
        }

        me.sound = soundObject.sound;
        setSoundCounter((c) => c + 1);
        setLoadingInternal(false);
      } finally {
        me.cancel = null;
      }
    }
  }, [uid, jwt, forceReloadCounter]);

  return useMemo(
    () =>
      soundCounter > 0 // ternary is just to make eslint happy
        ? {
            type,
            sound: soundRef.current?.sound ?? null,
          }
        : { type, sound: null },
    [type, soundCounter]
  );
};
