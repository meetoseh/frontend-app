import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OsehAudioContentState, WrappedAudioSound } from './OsehAudioContentState';
import { OsehContentTarget } from './OsehContentTarget';
import { Audio } from 'expo-av';
import { Callbacks, ValueWithCallbacks } from '../lib/Callbacks';

/**
 * Loads the specified audio target and returns a state object which can be used
 * to play or stop the audio. A loading or failed target will result in a perpetual
 * loading state.
 */
export const useOsehAudioContentState = (target: OsehContentTarget): OsehAudioContentState => {
  const audioRef = useRef<ValueWithCallbacks<WrappedAudioSound> | null>(null);
  const audioCallbacksRef = useRef<Callbacks<undefined>>() as MutableRefObject<
    Callbacks<undefined>
  >;

  if (audioCallbacksRef.current === undefined) {
    audioCallbacksRef.current = new Callbacks();
  }

  const [play, setPlayRaw] = useState<((this: void) => Promise<void>) | null>(null);
  const [stop, setStopRaw] = useState<((this: void) => Promise<void>) | null>(null);

  // convenience function for using setPlay; setPlay(() => {}) doesn't work
  // as expected since it will actually be treated as the functional variant
  // of setPlay, which is not what we want
  const setPlaySafe = useCallback((play: ((this: void) => Promise<void>) | null) => {
    setPlayRaw(() => play);
  }, []);

  const setStopSafe = useCallback((stop: ((this: void) => Promise<void>) | null) => {
    setStopRaw(() => stop);
  }, []);

  const outerTarget = target;
  useEffect(() => {
    if (outerTarget.state !== 'loaded') {
      if (audioRef.current !== null) {
        audioRef.current.get().cancel();
        audioRef.current = null;
        audioCallbacksRef.current.call(undefined);
        setPlaySafe(null);
        setStopSafe(null);
      }
      return;
    }
    const target = outerTarget;
    
    const oldAudio = audioRef.current?.get();
    if (oldAudio !== undefined && (
      oldAudio.target.state !== 'loaded'
      || oldAudio.target.jwt !== target.jwt
      || oldAudio.target.nativeExport.url !== target.nativeExport.url
    )) {
      oldAudio.cancel();
      audioRef.current = null;
      // we don't need to worry about callbacks as we're about to
      // call handleAudioChanged
    }

    const vwcAudio = audioRef.current ?? loadNewAudio(target);
    audioRef.current = vwcAudio;
    vwcAudio.callbacks.add(handleAudioChanged);
    handleAudioChanged();
    return () => {
      vwcAudio.callbacks.remove(handleAudioChanged);
    }

    function handleAudioChanged() {
      const audio = vwcAudio.get();
      if (audio.canceled) {
        audioRef.current = null;
        audioCallbacksRef.current.call(undefined);
        vwcAudio.callbacks.remove(handleAudioChanged);
        setPlaySafe(null);
        setStopSafe(null);
        return;
      }
      if (audio.sound === null) {
        setPlaySafe(null);
        setStopSafe(null);
        audioCallbacksRef.current.call(undefined);
        return;
      }
      setPlaySafe(async () => {
        if (audio.sound === null) {
          return;
        }

        await audio.sound.playAsync();
      });
      setStopSafe(async () => {
        if (audio.sound === null) {
          return;
        }

        await audio.sound.stopAsync();
      });
      audioCallbacksRef.current.call(undefined);
    }
  }, [setPlaySafe, setStopSafe, outerTarget]);

  const audio = useMemo<ValueWithCallbacks<WrappedAudioSound | null>>(
    () => ({
      get: () => audioRef.current === null ? null : audioRef.current.get(),
      callbacks: audioCallbacksRef.current,
    }),
    []
  );

  return useMemo<OsehAudioContentState>(
    () => ({
      play,
      stop,
      loaded: play !== null,
      error: null,
      audio,
    }),
    [play, stop, audio]
  );
};


const loadNewAudio = (target: OsehContentTarget): ValueWithCallbacks<WrappedAudioSound> => {
  if (target.state !== 'loaded') {
    const val: WrappedAudioSound ={
      target,
      sound: null,
      cancel: () => {},
      canceled: true
    };
    return {
      get: () => val,
      callbacks: new Callbacks<undefined>()
    };
  }

  const loadedTarget = target;

  let active = true;
  const cancelers = new Callbacks<undefined>();
  const changed = new Callbacks<undefined>();
  const cancel = () => {
    if (!active) {
      return;
    }
    active = false;
    cancelers.call(undefined);
  }

  let result: WrappedAudioSound = {
    target,
    sound: null,
    cancel,
    canceled: false
  };
  cancelers.add(() => {
    result = {
      target,
      sound: null,
      cancel,
      canceled: true
    };
    changed.call(undefined);
  });

  fetchAudio();

  return {
    get: () => result,
    callbacks: changed
  };

  async function fetchAudio() {
    const soundObject = await Audio.Sound.createAsync(
      {
        uri: loadedTarget.nativeExport.url,
        headers: loadedTarget.presigned ? {} : {
          Authorization: `bearer ${loadedTarget.jwt}`,
        },
      },
      { shouldPlay: false }
    );

    if (!active) {
      soundObject.sound.unloadAsync();
      return;
    }

    cancelers.add(() => {
      soundObject.sound.unloadAsync();
    });
    result = {
      target,
      sound: soundObject.sound,
      cancel,
      canceled: false
    };
    changed.call(undefined);
  }
}