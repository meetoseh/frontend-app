import { createWritableValueWithCallbacks } from '../lib/Callbacks';
import { CancelablePromise } from '../lib/CancelablePromise';
import { constructCancelablePromise } from '../lib/CancelablePromiseConstructor';
import { createCancelablePromiseFromCallbacks } from '../lib/createCancelablePromiseFromCallbacks';
import { DisplayableError } from '../lib/errors';
import { setVWC } from '../lib/setVWC';
import { RequestHandler, RequestResult, Result } from './RequestHandler';

export type ChainedRequestMapperSync<PrevDataT, RefT> = {
  sync: (prevData: PrevDataT) => RefT;
  async: undefined;
  cancelable: undefined;
};

export type ChainedRequestMapperAsync<PrevDataT, RefT> = {
  sync: undefined;
  async: (prevData: PrevDataT) => Promise<RefT>;
  cancelable: undefined;
};

export type ChainedRequestMapperCancelable<PrevDataT, RefT> = {
  sync: undefined;
  async: undefined;
  cancelable: (prevData: PrevDataT) => CancelablePromise<RefT>;
};

export type ChainedRequestMapper<PrevDataT, RefT> =
  | ChainedRequestMapperSync<PrevDataT, RefT>
  | ChainedRequestMapperAsync<PrevDataT, RefT>
  | ChainedRequestMapperCancelable<PrevDataT, RefT>;

/**
 * Produces a new request, where the reference for this request is a mapped
 * version of the data from the previous request.
 *
 * @param createPrevious A function which can be called to initialize a new request
 *   for the previous data. We will release the previous request when its no
 *   longer needed for this request.
 * @param handler The request handler for producing _new_ requests
 * @param mapper A function which maps the previous data to the reference for
 *   the new request.
 */
export const createChainedRequest = <
  PrevDataT extends object,
  RefForUIDT extends object,
  RefT extends RefForUIDT,
  DataT extends object
>(
  createPrevious: () => RequestResult<PrevDataT>,
  handler: RequestHandler<RefForUIDT, RefT, DataT>,
  mapper: ChainedRequestMapper<PrevDataT, RefT | null>,
  opts?: {
    onRefChanged?: (newRef: RefT | null, prevData: PrevDataT | null) => void;
  }
): RequestResult<DataT> => {
  const releasedVWC = createWritableValueWithCallbacks(false);
  let previous: RequestResult<PrevDataT> | null =
    null as RequestResult<PrevDataT> | null;

  const onRefChanged = opts?.onRefChanged ?? (() => {});
  onRefChanged(null, null);

  const rawResult = handler.request({
    ref: null,
    refreshRef: () => {
      return constructCancelablePromise({
        body: async (state, resolve, reject) => {
          const canceled = createCancelablePromiseFromCallbacks(
            state.cancelers
          );
          canceled.promise.catch(() => {});
          if (state.finishing) {
            canceled.cancel();
            state.done = true;
            reject(new Error('canceled'));
            return;
          }

          const released = createCancelablePromiseFromCallbacks(
            releasedVWC.callbacks
          );
          released.promise.catch(() => {});
          if (releasedVWC.get()) {
            canceled.cancel();
            released.cancel();
            state.finishing = true;
            state.done = true;
            resolve({
              type: 'expired',
              data: undefined,
              error: new DisplayableError(
                'canceled',
                'chained request',
                'reference released'
              ),
              retryAt: undefined,
            });
            return;
          }

          let shouldRefresh = true;
          if (previous === null) {
            previous = createPrevious();
            shouldRefresh = false;
          }

          const makeResult = (mapped: RefT | null): Result<RefT> =>
            mapped === null
              ? {
                  type: 'error',
                  data: undefined,
                  error: new DisplayableError(
                    'server-refresh-required',
                    'chained request',
                    'cannot chain'
                  ),
                  retryAt: undefined,
                }
              : {
                  type: 'success',
                  data: mapped,
                  error: undefined,
                  retryAt: undefined,
                };

          while (true) {
            const prev = previous;

            if (releasedVWC.get()) {
              canceled.cancel();
              released.cancel();
              if (previous !== null) {
                previous.release();
                previous = null;
              }
              state.finishing = true;
              state.done = true;
              resolve({
                type: 'expired',
                data: undefined,
                error: new DisplayableError(
                  'canceled',
                  'chained request',
                  'reference released'
                ),
                retryAt: undefined,
              });
              return;
            }

            if (state.finishing) {
              canceled.cancel();
              released.cancel();
              state.done = true;
              reject(new Error('canceled'));
              return;
            }

            if (prev === null) {
              throw new Error('impossible state');
            }

            const changed = createCancelablePromiseFromCallbacks(
              prev.data.callbacks
            );
            changed.promise.catch(() => {});

            const data = prev.data.get();
            if (data.type === 'loading') {
              shouldRefresh = false;
              await Promise.race([
                changed.promise,
                canceled.promise,
                released.promise,
              ]);
              changed.cancel();
              continue;
            } else if (data.type === 'released') {
              if (releasedVWC.get() || state.finishing) {
                changed.cancel();
                continue;
              }
              throw new Error(
                'impossible: previous should not be released from underneath us'
              );
            } else if (data.type === 'error') {
              changed.cancel();

              if (shouldRefresh) {
                shouldRefresh = false;
                if (!Object.is(previous, prev)) {
                  throw new Error('sanity check failed: previous !== prev');
                }
                previous.release();
                previous = createPrevious();
                continue;
              }

              state.finishing = true;
              state.done = true;
              resolve({
                type: 'error',
                data: undefined,
                error: data.error,
                retryAt: undefined,
              });
              return;
            } else if (data.type === 'success') {
              if (shouldRefresh) {
                shouldRefresh = false;
                onRefChanged(null, null);
                data.reportExpired();
                await Promise.race([
                  changed.promise,
                  canceled.promise,
                  released.promise,
                ]);
                changed.cancel();
                continue;
              }

              if (mapper.sync !== undefined) {
                changed.cancel();
                const mapped = mapper.sync(data.data);
                onRefChanged(mapped, data.data);
                state.finishing = true;
                state.done = true;
                resolve(makeResult(mapped));
                return;
              }

              if (mapper.async !== undefined) {
                const mapped = await mapper.async(data.data);
                if (releasedVWC.get() || state.finishing || changed.done()) {
                  continue;
                }

                onRefChanged(mapped, data.data);
                state.finishing = true;
                state.done = true;
                resolve(makeResult(mapped));
                return;
              }

              const mappedCancelable = mapper.cancelable(data.data);
              await Promise.race([
                changed.promise,
                canceled.promise,
                released.promise,
                mappedCancelable.promise,
              ]);
              if (!mappedCancelable.done()) {
                mappedCancelable.cancel();
                changed.cancel();
                continue;
              }
              const mappedData = await mappedCancelable.promise;
              if (releasedVWC.get() || state.finishing || changed.done()) {
                changed.cancel();
                continue;
              }

              changed.cancel();

              onRefChanged(mappedData, data.data);
              state.finishing = true;
              state.done = true;
              resolve(makeResult(mappedData));
            } else {
              ((d: never) => {
                throw new Error(`unknown data: ${d}`);
              })(data);
            }
          }
        },
      });
    },
  });

  return {
    data: rawResult.data,
    release: () => {
      setVWC(releasedVWC, true);

      rawResult.release();

      if (previous !== null) {
        previous.release();
        previous = null;
        onRefChanged(null, null);
      }
    },
  };
};
