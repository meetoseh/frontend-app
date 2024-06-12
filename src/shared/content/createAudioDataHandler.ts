import { ValueWithCallbacks } from '../lib/Callbacks';
import { CancelablePromise } from '../lib/CancelablePromise';
import { constructCancelablePromise } from '../lib/CancelablePromiseConstructor';
import { createCancelablePromiseFromCallbacks } from '../lib/createCancelablePromiseFromCallbacks';
import { createUID } from '../lib/createUID';
import { getJwtExpiration } from '../lib/getJwtExpiration';
import { waitForValueWithCallbacksConditionCancelable } from '../lib/waitForValueWithCallbacksCondition';
import { RequestHandler, Result } from '../requests/RequestHandler';
import { ContentFileNativeExport } from './OsehContentTarget';
import {
  OsehAudioContentState,
  createOsehAudioContentState,
} from './createOsehAudioContentState';

export type AudioFileData = {
  state: ValueWithCallbacks<OsehAudioContentState>;
  dispose: () => void;
};

/**
 * Manages downloading the audio associated with the corresponding ref
 */
export const createAudioDataRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<
  ContentFileNativeExport,
  ContentFileNativeExport,
  AudioFileData
> => {
  return new RequestHandler({
    getRefUid,
    getDataFromRef,
    compareRefs,
    cleanupData,
    logConfig: { logging },
    cacheConfig: { maxStale, keepActiveRequestsIntoStale: true },
    retryConfig: { maxRetries },
  });
};

const getRefUid = (ref: ContentFileNativeExport): string =>
  ref.url + (ref.presigned ? '' : `?jwt=${ref.jwt}`);
const getDataFromRef: (
  ref: ContentFileNativeExport
) => CancelablePromise<Result<AudioFileData>> = (ref) =>
  constructCancelablePromise({
    body: async (state, resolve, reject) => {
      const canceled = createCancelablePromiseFromCallbacks(state.cancelers);
      canceled.promise.catch(() => {});
      if (state.finishing) {
        canceled.cancel();
        state.done = true;
        reject(new Error('canceled'));
        return;
      }

      const uid = createUID();
      console.log(
        `Fetching audio data for ${ref.url} - assigned uid ${uid} for detecting cleanup`
      );

      const [audio, disposeAudioInner] = createOsehAudioContentState(ref);
      const disposeAudio = () => {
        console.log(
          `Disposing audio data for ${ref.url} - creation was tagged with ${uid}`
        );
        disposeAudioInner();
      };

      const ready = waitForValueWithCallbacksConditionCancelable(
        audio,
        (v) => v.type !== 'loading'
      );
      await Promise.race([canceled.promise, ready.promise]);
      canceled.cancel();
      ready.cancel();
      if (state.finishing) {
        disposeAudio();
        state.finishing = true;
        state.done = true;
        reject(new Error('canceled'));
        return;
      }
      const result = audio.get();
      if (result.type === 'error') {
        disposeAudio();
        state.finishing = true;
        state.done = true;
        resolve({
          type: 'error',
          data: undefined,
          error: result.error,
          retryAt: undefined,
        });
        return;
      }

      state.finishing = true;
      state.done = true;
      resolve({
        type: 'success',
        data: {
          state: audio,
          dispose: disposeAudio,
        },
        error: undefined,
        retryAt: undefined,
      });
    },
  });
const compareRefs = (
  a: ContentFileNativeExport,
  b: ContentFileNativeExport
): number => getJwtExpiration(b.jwt) - getJwtExpiration(a.jwt);
const cleanupData = (data: AudioFileData): void => data.dispose();
