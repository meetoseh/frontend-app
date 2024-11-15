import { useCallback } from 'react';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { OsehContentRef } from './OsehContentRef';
import { OsehContentTarget } from './OsehContentTarget';
import { setVWC } from '../lib/setVWC';
import { MakePropsNotNull } from '../lib/MakePropsNotNull';
import { getNativeExport } from './useOsehContentTarget';
import { DisplayableError } from '../lib/errors';

export type UseOsehContentTargetValueWithCallbacksProps = {
  /**
   * The ref that you want to fetch
   */
  ref: ValueWithCallbacks<OsehContentRef | null>;

  /**
   * The logical pixel width and height that the video will be rendered at,
   * or null for audio files
   */
  displaySize: ValueWithCallbacks<{ width: number; height: number } | null>;

  /**
   * True if the result should be presigned, i.e., the URL should
   * include the required access token, false if the the URL does
   * not include access parameters and thus requires that they are
   * set in headers
   */
  presign: boolean;
};

/**
 * Fetches the content target for the given content ref in
 * a value with callbacks.
 */
export const useOsehContentTargetValueWithCallbacks = ({
  ref: refVWC,
  displaySize: displaySizeVWC,
  presign,
}: UseOsehContentTargetValueWithCallbacksProps): ValueWithCallbacks<OsehContentTarget> => {
  const result = useWritableValueWithCallbacks<OsehContentTarget>(() => ({
    state: 'loading',
    error: null,
    nativeExport: null,
    presigned: null,
    jwt: null,
  }));

  useValuesWithCallbacksEffect(
    [refVWC, displaySizeVWC],
    useCallback(() => {
      const refRaw = refVWC.get();
      const displaySize = displaySizeVWC.get();

      if (refRaw === null || refRaw.uid === null || refRaw.jwt === null) {
        setVWC(
          result,
          {
            state: 'loading',
            error: null,
            nativeExport: null,
            presigned: null,
            jwt: null,
          },
          (a, b) => a.state === b.state
        );
        return undefined;
      }
      const ref = refRaw as MakePropsNotNull<typeof refRaw, 'uid' | 'jwt'>;

      let active = true;
      const cancelers = new Callbacks<undefined>();
      getTarget();
      return () => {
        active = false;
        cancelers.call(undefined);
      };

      async function getTargetInner(_signal: AbortSignal | undefined) {
        const response = getNativeExport(
          ref.uid,
          ref.jwt,
          presign,
          displaySize ?? undefined
        );
        if (!active) {
          return;
        }
        setVWC(result, {
          state: 'loaded',
          error: null,
          nativeExport: response,
          presigned: presign,
          jwt: ref.jwt,
        });
      }

      async function getTarget() {
        if (!active) {
          return;
        }

        setVWC(
          result,
          {
            state: 'loading',
            error: null,
            nativeExport: null,
            presigned: null,
            jwt: null,
          },
          (a, b) => a.state === b.state
        );

        const controller = new AbortController();
        const signal = controller.signal;
        signal.throwIfAborted ||= () => {
          if (signal.aborted) {
            throw new Error('aborted');
          }
        };
        const doAbort = () => controller.abort();
        cancelers.add(doAbort);

        try {
          await getTargetInner(signal);
        } catch (e) {
          if (!active) {
            return;
          }
          const err =
            e instanceof DisplayableError
              ? e
              : new DisplayableError('client', 'fetch web export', `${e}`);
          if (!active) {
            return;
          }
          setVWC(result, {
            state: 'failed',
            error: err,
            nativeExport: null,
            presigned: null,
            jwt: null,
          });
        } finally {
          cancelers.remove(doAbort);
        }
      }
    }, [refVWC, displaySizeVWC, presign, result])
  );

  return result;
};
