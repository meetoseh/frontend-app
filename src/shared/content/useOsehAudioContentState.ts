import { MutableRefObject, useEffect, useRef } from 'react';
import { OsehAudioContentState, WrappedAudioSound } from './OsehAudioContentState';
import { OsehContentTarget } from './OsehContentTarget';
import { Audio } from 'expo-av';
import { Callbacks, ValueWithCallbacks, useWritableValueWithCallbacks } from '../lib/Callbacks';
import { VariableStrategyProps, useVariableStrategyPropsAsValueWithCallbacks } from '../anim/VariableStrategyProps';

/**
 * Loads the specified audio target and returns a state object which can be used
 * to play or stop the audio. A loading or failed target will result in a perpetual
 * loading state.
 */
export const useOsehAudioContentState = (
  targetVariableStrategy: VariableStrategyProps<OsehContentTarget>
): ValueWithCallbacks<OsehAudioContentState> => {
  const state = useWritableValueWithCallbacks<OsehAudioContentState>(() => ({
    play: null,
    stop: null,
    loaded: false,
    error: null,
    audio: null,
  }));
  const audioVWC = useRef<ValueWithCallbacks<WrappedAudioSound> | null>() as MutableRefObject<ValueWithCallbacks<WrappedAudioSound> | null>;
  const targetVWC = useVariableStrategyPropsAsValueWithCallbacks(targetVariableStrategy);

  if (audioVWC.current === undefined) {
    audioVWC.current = null;
  }

  useEffect(() => {
    let targetCanceler: (() => void) | null = null;
    targetVWC.callbacks.add(handleTargetChanged);
    return () => {
      targetVWC.callbacks.remove(handleTargetChanged);
      if (targetCanceler !== null) {
        targetCanceler();
        targetCanceler = null;
      }
    };

    function handleTargetChanged() {
      if (targetCanceler !== null) {
        targetCanceler();
        targetCanceler = null;
      }

      targetCanceler = handleTarget(targetVWC.get()) ?? null;
    }
    
    function handleTarget(outerTarget: OsehContentTarget): (() => void) | undefined {
      if (outerTarget.state !== 'loaded') {
        state.set({
          play: null,
          stop: null,
          loaded: false,
          error: null,
          audio: null,
        });
        state.callbacks.call(undefined);
        return;
      }
      const target = outerTarget;

      if (audioVWC.current !== null && (
        audioVWC.current.get().target.state !== 'loaded'
        || audioVWC.current.get().target.jwt !== target.jwt
        || audioVWC.current.get().target.nativeExport?.url !== target.nativeExport.url
      )) {
        audioVWC.current.get().cancel();
        audioVWC.current = null;
      }

      if (audioVWC.current === null) {
        audioVWC.current = loadNewAudio(target);
      }

      const aud = audioVWC.current;
      aud.callbacks.add(handleAudioChanged);
      handleAudioChanged();
      return () => {
        aud.callbacks.remove(handleAudioChanged);
      }

      function handleAudioChanged() {
        const newAudio = aud.get();
        if (newAudio.canceled) {
          audioVWC.current = null;
          state.set({
            play: null,
            stop: null,
            loaded: false,
            error: null,
            audio: null,
          });
          state.callbacks.call(undefined);
          return;
        }

        if (newAudio.sound === null) {
          state.set({
            play: null,
            stop: null,
            loaded: false,
            error: null,
            audio: newAudio,
          });
          state.callbacks.call(undefined);
          return;
        }

        state.set({
          play: async () => {
            if (newAudio.sound === null) {
              return;
            }
    
            await newAudio.sound.playAsync();
          }, 
          stop:async () => {
              if (newAudio.sound === null) {
                return;
              }
      
              await newAudio.sound.stopAsync();
            },
          loaded: true,
          error: null,
          audio: newAudio,
        });
        state.callbacks.call(undefined);
      }
    }
  }, [targetVWC, state]);

  return state;
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