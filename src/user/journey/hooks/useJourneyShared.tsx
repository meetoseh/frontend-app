import { useContext, useEffect } from 'react';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { JourneyRef } from '../models/JourneyRef';
import { JourneyShared } from '../models/JourneyShared';
import { LoginContext } from '../../../shared/contexts/LoginContext';
import { useOsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import { useOsehAudioContentState } from '../../../shared/content/useOsehAudioContentState';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../../../shared/anim/VariableStrategyProps';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { OsehContentTarget } from '../../../shared/content/OsehContentTarget';
import { getNativeExport } from '../../../shared/content/useOsehContentTarget';
import { apiFetch } from '../../../shared/lib/apiFetch';

/**
 * Creates the initial journey & journey start shared state. Since this is often
 * used right as an animation is starting, we try very hard to reduce the number
 * of react rerenders this triggers. This wasn't done until it became clear that
 * every react rerender was very obvious to the user.
 *
 * @param journey The journey to create the shared state for
 */
export const useJourneyShared = (
  journeyVariableStrategy: VariableStrategyProps<JourneyRef | null>
): ValueWithCallbacks<JourneyShared> => {
  const loginContextRaw = useContext(LoginContext);
  const journeyVWC = useVariableStrategyPropsAsValueWithCallbacks(
    journeyVariableStrategy
  );
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const previewSizeVWC = useMappedValueWithCallbacks(
    windowSizeVWC,
    (windowSize) => {
      if (windowSize.width >= 390 && windowSize.height >= 844) {
        return { width: 270, height: 470 };
      }

      return { width: 208, height: 357 };
    }
  );
  const imageHandler = useOsehImageStateRequestHandler({});
  const result = useWritableValueWithCallbacks<JourneyShared>(() =>
    createLoadingJourneyShared(windowSizeVWC.get(), previewSizeVWC.get())
  );

  const targetVWC = useWritableValueWithCallbacks<OsehContentTarget>(() => ({
    state: 'loading',
    jwt: null,
    error: null,
    nativeExport: null,
    presigned: null,
  }));
  const audioVWC = useOsehAudioContentState({
    type: 'callbacks',
    props: targetVWC.get,
    callbacks: targetVWC.callbacks,
  });

  // holy callback hell
  // this is surprisingly efficient despite looking like a mess
  useEffect(() => {
    let outerActive = true;
    let unmountJourneyHandler: (() => void) | null = null;
    journeyVWC.callbacks.add(handleJourneyChanged);
    loginContextRaw.value.callbacks.add(handleJourneyChanged);
    handleJourneyChanged();
    return () => {
      if (!outerActive) {
        return;
      }
      outerActive = false;
      journeyVWC.callbacks.remove(handleJourneyChanged);
      loginContextRaw.value.callbacks.remove(handleJourneyChanged);
      if (unmountJourneyHandler !== null) {
        unmountJourneyHandler();
        unmountJourneyHandler = null;
      }
    };

    function handleJourneyChanged(): void {
      if (!outerActive) {
        return;
      }
      if (unmountJourneyHandler !== null) {
        unmountJourneyHandler();
        unmountJourneyHandler = null;
      }

      const journeyOuter = journeyVWC.get();
      if (journeyOuter === null) {
        unmountJourneyHandler = handlePerpetualLoading();
        return;
      }

      unmountJourneyHandler = handleJourney(journeyOuter);
    }

    function handleJourney(journey: JourneyRef): () => void {
      let active = true;
      const cleanup = [
        handleOriginalImage(),
        handleDarkenedAndBlurredImages(),
        handleContentTarget(),
        handleAudio(),
        handleFavorited(),
        handleWantsStoreReview(),
      ];
      return () => {
        if (!active) {
          return;
        }
        active = false;
        cleanup.forEach((fn) => fn());
      };

      function handleOriginalImage(): () => void {
        let removeRequest: (() => void) | null = null;
        previewSizeVWC.callbacks.add(update);
        update();

        return () => {
          previewSizeVWC.callbacks.remove(update);
          if (removeRequest !== null) {
            removeRequest();
            removeRequest = null;
          }
        };

        function update() {
          if (!active) {
            return;
          }
          if (removeRequest !== null) {
            removeRequest();
            removeRequest = null;
          }

          const request = imageHandler.request({
            uid: journey.backgroundImage.uid,
            jwt: journey.backgroundImage.jwt,
            displayWidth: previewSizeVWC.get().width,
            displayHeight: previewSizeVWC.get().height,
            alt: '',
          });
          request.stateChanged.add(handleImageStateChanged);
          removeRequest = () => {
            request.stateChanged.remove(handleImageStateChanged);
            request.release();
          };
          handleImageStateChanged();

          function handleImageStateChanged() {
            result.set({
              ...result.get(),
              originalImage: request.state,
            });
            result.callbacks.call(undefined);
          }
        }
      }

      function handleDarkenedAndBlurredImages(): () => void {
        let removeRequest: (() => void) | null = null;
        windowSizeVWC.callbacks.add(update);
        update();

        return () => {
          windowSizeVWC.callbacks.remove(update);
          if (removeRequest !== null) {
            removeRequest();
            removeRequest = null;
          }
        };

        function update() {
          if (!active) {
            return;
          }
          if (removeRequest !== null) {
            removeRequest();
            removeRequest = null;
          }

          const darkenedRequest = imageHandler.request({
            uid: journey.darkenedBackgroundImage.uid,
            jwt: journey.darkenedBackgroundImage.jwt,
            displayWidth: windowSizeVWC.get().width,
            displayHeight: windowSizeVWC.get().height,
            alt: '',
          });
          const blurredRequest = imageHandler.request({
            uid: journey.blurredBackgroundImage.uid,
            jwt: journey.blurredBackgroundImage.jwt,
            displayWidth: windowSizeVWC.get().width,
            displayHeight: windowSizeVWC.get().height,
            alt: '',
          });

          darkenedRequest.stateChanged.add(handleImageStateChanged);
          blurredRequest.stateChanged.add(handleImageStateChanged);
          removeRequest = () => {
            darkenedRequest.stateChanged.remove(handleImageStateChanged);
            blurredRequest.stateChanged.remove(handleImageStateChanged);
            darkenedRequest.release();
            blurredRequest.release();
          };
          handleImageStateChanged();

          function handleImageStateChanged() {
            result.set({
              ...result.get(),
              darkenedImage: darkenedRequest.state,
              blurredImage: blurredRequest.state,
            });
            result.callbacks.call(undefined);
          }
        }
      }

      function handleContentTarget(): () => void {
        fetchContentTarget();
        return () => {};

        async function fetchContentTarget() {
          if (!active) {
            return;
          }
          if (targetVWC.get().state !== 'loading') {
            targetVWC.set({
              state: 'loading',
              jwt: null,
              error: null,
              nativeExport: null,
              presigned: null,
            });
            targetVWC.callbacks.call(undefined);
          }

          if (
            journey.audioContent.uid === null ||
            journey.audioContent.jwt === null
          ) {
            return;
          }

          try {
            const nativeExport = getNativeExport(
              journey.audioContent.uid,
              journey.audioContent.jwt,
              false
            );
            if (!active) {
              return;
            }
            targetVWC.set({
              state: 'loaded',
              jwt: journey.audioContent.jwt,
              error: null,
              nativeExport,
              presigned: false,
            });
            targetVWC.callbacks.call(undefined);
          } catch (e) {
            console.error('error fetching content target', e);
          }
        }
      }

      function handleAudio(): () => void {
        audioVWC.callbacks.add(update);
        update();
        return () => {
          audioVWC.callbacks.remove(update);
        };

        function update() {
          if (!active) {
            return;
          }
          result.set({
            ...result.get(),
            audio: audioVWC.get(),
          });
          result.callbacks.call(undefined);
        }
      }

      function handleFavorited(): () => void {
        loadFavorited();
        return () => {};

        async function loadFavoritedInner() {
          if (!active) {
            return;
          }
          const loginRaw = loginContextRaw.value.get();
          if (loginRaw.state === 'loading') {
            setFavorited(null);
            return;
          }

          if (loginRaw.state === 'logged-out') {
            setFavorited(false);
            return;
          }
          const login = loginRaw;

          const response = await apiFetch(
            '/api/1/users/me/search_history',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              body: JSON.stringify({
                filters: {
                  uid: {
                    operator: 'eq',
                    value: journey.uid,
                  },
                  liked_at: {
                    operator: 'neq',
                    value: null,
                  },
                },
                limit: 1,
              }),
            },
            login
          );
          if (!response.ok) {
            throw response;
          }

          const data = await response.json();
          const isFavorited = data.items.length >= 1;
          if (active) {
            setFavorited(isFavorited);
          }
        }

        async function loadFavorited() {
          try {
            await loadFavoritedInner();
          } catch (e) {
            console.error('error loading favorited, assuming not favorited', e);
            setFavorited(false);
          }
        }

        function setFavorited(v: boolean | null) {
          if (result.get().favorited !== v) {
            result.set({
              ...result.get(),
              favorited: v,
              setFavorited:
                v === null
                  ? () => {
                      throw new Error('cannot set favorited while loading');
                    }
                  : setFavorited,
            });
            result.callbacks.call(undefined);
          }
        }
      }

      function handleWantsStoreReview(): () => void {
        result.set({
          ...result.get(),
          setWantStoreReview: (wantStoreReview: boolean) => {
            if (result.get().wantStoreReview !== wantStoreReview) {
              result.set({
                ...result.get(),
                wantStoreReview,
              });
              result.callbacks.call(undefined);
            }
          },
        });
        result.callbacks.call(undefined);
        return () => {};
      }
    }

    function handlePerpetualLoading(): () => void {
      let active = true;
      windowSizeVWC.callbacks.add(update);
      previewSizeVWC.callbacks.add(update);

      return () => {
        if (!active) {
          return;
        }
        active = false;
        windowSizeVWC.callbacks.remove(update);
        previewSizeVWC.callbacks.remove(update);
      };

      function update() {
        if (!active) {
          return;
        }
        result.set(
          createLoadingJourneyShared(windowSizeVWC.get(), previewSizeVWC.get())
        );
      }
    }
  }, [
    journeyVWC,
    windowSizeVWC,
    previewSizeVWC,
    loginContextRaw,
    audioVWC,
    imageHandler,
    result,
    targetVWC,
  ]);

  return result;
};

/**
 * Creates a loading-state of journey shared, appropriate when you don't have a
 * real journey shared available.
 *
 * @param windowSize The size of the window
 * @param previewSize The size of the preview
 * @returns A loading-state of journey shared
 */
export const createLoadingJourneyShared = (
  windowSize: { width: number; height: number },
  previewSize: { width: number; height: number }
): JourneyShared => ({
  originalImage: {
    localUrl: null,
    displayWidth: previewSize.width,
    displayHeight: previewSize.height,
    alt: '',
    loading: true,
  },
  darkenedImage: {
    localUrl: null,
    displayWidth: windowSize.width,
    displayHeight: windowSize.height,
    alt: '',
    loading: true,
  },
  blurredImage: {
    localUrl: null,
    displayWidth: windowSize.width,
    displayHeight: windowSize.height,
    alt: '',
    loading: true,
  },
  audio: {
    play: null,
    stop: null,
    loaded: false,
    audio: null,
    error: null,
  },
  favorited: null,
  setFavorited: () => {
    throw new Error('cannot setFavorited while favorited is null');
  },
  wantStoreReview: false,
  setWantStoreReview: () => {
    throw new Error('cannot set wantStoreReview while loading');
  },
});
