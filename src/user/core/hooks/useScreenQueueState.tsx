import { useCallback, useContext, useMemo } from 'react';
import { CustomPop, PeekedScreen } from '../models/Screen';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { CancelablePromise } from '../../../shared/lib/CancelablePromise';
import { Result } from '../../../shared/requests/RequestHandler';
import {
  LoginContext,
  LoginContextValueLoggedIn,
} from '../../../shared/contexts/LoginContext';
import { InterestsContext } from '../../../shared/contexts/InterestsContext';
import { constructCancelablePromise } from '../../../shared/lib/CancelablePromiseConstructor';
import { createCancelablePromiseFromCallbacks } from '../../../shared/lib/createCancelablePromiseFromCallbacks';
import { VisitorValue } from '../../../shared/hooks/useVisitorValueWithCallbacks';
import { waitForValueWithCallbacksConditionCancelable } from '../../../shared/lib/waitForValueWithCallbacksCondition';
import { delayCancelableUntilResolved } from '../../../shared/lib/delayCancelableUntilResolved';
import { VISITOR_SOURCE } from '../../../shared/lib/visitorSource';
import { setVWC } from '../../../shared/lib/setVWC';
import { apiFetch } from '../../../shared/lib/apiFetch';
import { useValueWithCallbacksEffect } from '../../../shared/hooks/useValueWithCallbacksEffect';
import { SCREEN_VERSION } from '../../../shared/lib/screenVersion';
import { getCurrentServerTimeMS } from '../../../shared/lib/getCurrentServerTimeMS';
import { getJwtExpiration } from '../../../shared/lib/getJwtExpiration';
import { createStandardRoundTripTimeTracker } from '../lib/RoundTripTimeTracker';
import { createUnencryptedStorageAdapter } from '../lib/SimpleAsyncStorage';
import {
  chooseErrorFromStatus,
  DisplayableError,
} from '../../../shared/lib/errors';

export type UseScreenQueueStateResult = {
  /** The screen that the user should see */
  active: PeekedScreen<string, any>;
  /** The JWT to use for peeking or popping the active screen */
  activeJwt: string;
  /** Screens that are likely to be shown very soon and should have their resources fetched */
  prefetch: PeekedScreen<string, any>[];
};

export type UseScreenQueueStateState =
  | {
      /**
       * - `loading`: waiting on the response of a peek or pop
       */
      type: 'loading';
      error?: undefined;
      result?: undefined;
    }
  | {
      /**
       * - `error`: something went wrong
       */
      type: 'error';
      /** A description of what went wrong */
      error: DisplayableError;
      result?: undefined;
    }
  | {
      /**
       * - `success`: the active screen and the screens to prefetch
       */
      type: 'success';
      error?: undefined;
      /** The active screen and the screens to prefetch */
      result: UseScreenQueueStateResult;
    };

export type ScreenQueueState = {
  /** The current state */
  value: ValueWithCallbacks<UseScreenQueueStateState>;
  /**
   * Refreshes the current state by peeking it again. This will update
   * the value before the promise resolves. Other peek or pop operations
   * should be canceled before calling this.
   */
  peek: () => CancelablePromise<Result<UseScreenQueueStateState>>;

  /**
   * Stores trace information for the current screen.
   */
  trace: (
    from: UseScreenQueueStateState & { type: 'success' },
    event: object
  ) => void;

  /**
   * Pops the current screen from the queue, optionally triggers a client
   * flow with the given slug and parameters, and returns the new state.
   * Other peek or pop operations should be canceled before calling this.
   *
   * @param from The current state
   * @param trigger The trigger to execute. If the slug is CUSTOM, the parameters are provided directly
   * @param endpoint usually /api/1/users/me/screens/pop
   * @param onError If specified, instead of transitioning to the error state if the pop
   *   fails, we call this function with the error and keep the current state.
   */
  pop: (
    from: UseScreenQueueStateState & { type: 'success' },
    trigger:
      | { slug: string; parameters: any }
      | { slug: typeof CustomPop; parameters: any }
      | null,
    endpoint: string,
    onError?: (error: unknown) => void
  ) => CancelablePromise<Result<UseScreenQueueStateState>>;
};

/**
 * The tracker that is updated by useScreenQueueState with measurements of
 * how long it is taking to use peekLike functions.
 */
export const PEEK_RTT_TRACKER = createStandardRoundTripTimeTracker({
  storage: createUnencryptedStorageAdapter(
    'peekRoundTripTimeTracker',
    'peekRoundTripTimeLock'
  ),
});

/**
 * A hook for managing the authorized users' client screen queue. Requires a
 * LoginContext and InterestsContext is available, and immediately starts a peek
 * operation.
 */
export const useScreenQueueState = (): ScreenQueueState => {
  const loginContextRaw = useContext(LoginContext);
  const interestsContext = useContext(InterestsContext);

  const valueVWC = useWritableValueWithCallbacks<UseScreenQueueStateState>(
    () => ({
      type: 'loading',
    })
  );

  const prepare = useCallback(
    (): CancelablePromise<{
      loginContext: LoginContextValueLoggedIn;
      visitor: VisitorValue & { loading: false };
    }> =>
      constructCancelablePromise({
        body: async (state, resolve, reject) => {
          const nowServer = await getCurrentServerTimeMS();

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

          const loginContextCancelable =
            waitForValueWithCallbacksConditionCancelable(
              loginContextRaw.value,
              (v) => {
                if (v.state === 'loading') {
                  return false;
                }

                if (v.state !== 'logged-in') {
                  return true;
                }

                // check if it's very close to expiration
                const idTokenExpiresAt = getJwtExpiration(v.authTokens.idToken);
                if (idTokenExpiresAt < nowServer + 60_000) {
                  console.log('waiting for token to be refreshed');
                  // should be refreshed automatically
                  return false;
                }

                return true;
              }
            );

          const visitorCancelable =
            waitForValueWithCallbacksConditionCancelable(
              interestsContext.visitor.value,
              (v) => !v.loading
            );

          const readyPromise = Promise.all([
            loginContextCancelable.promise,
            visitorCancelable.promise,
          ]);

          await Promise.race([readyPromise, canceled.promise]);

          if (state.finishing) {
            canceled.cancel();
            visitorCancelable.cancel();
            loginContextCancelable.cancel();
            state.done = true;
            reject(new Error('canceled'));
            return;
          }

          const [loginContext, visitor] = await readyPromise;
          if (state.finishing) {
            canceled.cancel();
            state.done = true;
            reject(new Error('canceled'));
            return;
          }

          if (loginContext.state !== 'logged-in') {
            canceled.cancel();
            state.finishing = true;
            state.done = true;
            reject(new Error('not logged in'));
            return;
          }

          if (visitor.loading) {
            canceled.cancel();
            state.finishing = true;
            state.done = true;
            reject(new Error('impossible'));
            return;
          }

          state.finishing = true;
          state.done = true;
          resolve({ loginContext, visitor });
        },
      }),
    [loginContextRaw, interestsContext.visitor]
  );

  const peekLike = useCallback(
    ({
      path,
      headers,
      body,
      onError,
    }: {
      path: string;
      headers: Headers | undefined;
      body: BodyInit | undefined;
      onError?: (error: unknown) => void;
    }): CancelablePromise<Result<UseScreenQueueStateState>> =>
      delayCancelableUntilResolved(
        ({ loginContext, visitor }) =>
          constructCancelablePromise({
            body: async (state, resolve, reject) => {
              const controller = new AbortController();
              const signal = controller.signal;
              const doAbort = () => controller.abort();
              state.cancelers.add(doAbort);
              if (state.finishing) {
                state.cancelers.remove(doAbort);
                state.done = true;
                reject(new Error('canceled'));
                return;
              }

              const oldValue = valueVWC.get();
              setVWC(
                valueVWC,
                { type: 'loading' },
                (a, b) => a.type === b.type
              );

              const fullHeaders = new Headers(headers);
              if (visitor.uid !== null) {
                fullHeaders.set('visitor', visitor.uid);
              }

              const endMeasurement = PEEK_RTT_TRACKER.beginMeasurement();
              let response: Response;
              try {
                response = await apiFetch(
                  `${path}?platform=${encodeURIComponent(
                    VISITOR_SOURCE
                  )}&version=${encodeURIComponent(SCREEN_VERSION)}`,
                  {
                    method: 'POST',
                    headers: fullHeaders,
                    body,
                    signal,
                  },
                  loginContext
                );
              } catch (e) {
                endMeasurement.cancel();
                state.cancelers.remove(doAbort);
                if (onError === undefined) {
                  const result: UseScreenQueueStateState = {
                    type: 'error',
                    error: new DisplayableError('connectivity', 'get screen'),
                  };
                  setVWC(valueVWC, result);
                  state.finishing = true;
                  state.done = true;
                  resolve({
                    type: 'error',
                    data: undefined,
                    error: result.error,
                    retryAt: undefined,
                  });
                } else {
                  setVWC(valueVWC, oldValue);
                  onError(e);
                  state.finishing = true;
                  state.done = true;
                  resolve({
                    type: 'error',
                    data: undefined,
                    error: describeHandledError(),
                    retryAt: undefined,
                  });
                }
                return;
              }

              if (state.finishing) {
                endMeasurement.cancel();
                state.cancelers.remove(doAbort);
                state.done = true;
                reject(new Error('canceled'));
                return;
              }

              if (!response.ok) {
                endMeasurement.cancel();
                if (onError !== undefined) {
                  state.cancelers.remove(doAbort);
                  setVWC(valueVWC, oldValue);
                  onError(response);
                  state.finishing = true;
                  state.done = true;
                  resolve({
                    type: 'error',
                    data: undefined,
                    error: describeHandledError(),
                    retryAt: undefined,
                  });
                  return;
                }

                if (response.status === 403) {
                  // token is bad!
                  state.cancelers.remove(doAbort);
                  state.finishing = true;
                  state.done = true;
                  if (Object.is(loginContextRaw.value.get(), loginContext)) {
                    console.warn(
                      'Logging out because of 403 error while peeking screen queue'
                    );
                    loginContextRaw.setAuthTokens(null);
                  }
                  resolve({
                    type: 'error',
                    data: undefined,
                    error: describeHandledError(),
                    retryAt: undefined,
                  });
                  return;
                }

                const described = chooseErrorFromStatus(
                  response.status,
                  'peek screen'
                );
                state.cancelers.remove(doAbort);

                if (state.finishing) {
                  state.done = true;
                  reject(new Error('canceled'));
                  return;
                }

                let retryAfterSeconds: number | undefined = undefined;
                try {
                  const retryAfter = response.headers.get('Retry-After');
                  if (retryAfter !== null && retryAfter !== '') {
                    const parsed = parseInt(retryAfter, 10);
                    if (parsed > 0) {
                      retryAfterSeconds = parsed;
                    }
                  }
                } catch (e) {
                  // ignore
                }

                if (
                  retryAfterSeconds === undefined &&
                  response.status === 503
                ) {
                  retryAfterSeconds = 5;
                }

                state.finishing = true;
                const result: UseScreenQueueStateState = {
                  type: 'error',
                  error: described,
                };
                setVWC(valueVWC, result);
                state.done = true;
                if (retryAfterSeconds !== undefined) {
                  resolve({
                    type: 'errorRetryable',
                    data: undefined,
                    error: described,
                    retryAt: new Date(Date.now() + retryAfterSeconds * 1000),
                  });
                } else {
                  resolve({
                    type: 'error',
                    data: undefined,
                    error: described,
                    retryAt: undefined,
                  });
                }
                return;
              }

              let data: {
                visitor: string;
                screen: {
                  active: {
                    slug: string;
                    parameters: any;
                  };
                  active_jwt: string;
                  prefetch: {
                    slug: string;
                    parameters: any;
                  }[];
                };
              };

              try {
                data = await response.json();
              } catch (e) {
                endMeasurement.cancel();
                state.cancelers.remove(doAbort);

                if (onError !== undefined) {
                  setVWC(valueVWC, oldValue);
                  onError(e);
                  state.finishing = true;
                  state.done = true;
                  resolve({
                    type: 'error',
                    data: undefined,
                    error: describeHandledError(),
                    retryAt: undefined,
                  });
                  return;
                }

                const result: UseScreenQueueStateState = {
                  type: 'error',
                  error: new DisplayableError('connectivity', 'get screen'),
                };
                setVWC(valueVWC, result);
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

              state.cancelers.remove(doAbort);

              if (state.finishing) {
                state.done = true;
                reject(new Error('canceled'));
                return;
              }

              const newVisitorUid = data.visitor;
              if (newVisitorUid !== visitor.uid) {
                interestsContext.visitor.setVisitor(newVisitorUid);
              }

              const active: PeekedScreen<string, any> = {
                slug: data.screen.active.slug,
                parameters: data.screen.active.parameters,
              };

              const prefetch: PeekedScreen<string, any>[] =
                data.screen.prefetch.map((p) => ({
                  slug: p.slug,
                  parameters: p.parameters,
                }));

              endMeasurement.finish();
              state.finishing = true;
              const result: UseScreenQueueStateState = {
                type: 'success',
                result: { active, activeJwt: data.screen.active_jwt, prefetch },
              };
              setVWC(valueVWC, result);
              state.done = true;
              resolve({
                type: 'success',
                data: result,
                error: undefined,
                retryAt: undefined,
              });
            },
          }),
        prepare()
      ),
    [prepare, interestsContext.visitor, valueVWC, loginContextRaw]
  );

  const peek = useCallback(
    () =>
      peekLike({
        path: '/api/1/users/me/screens/peek',
        headers: undefined,
        body: undefined,
      }),
    [peekLike]
  );

  const pop = useCallback(
    (
      from: UseScreenQueueStateState & { type: 'success' },
      trigger:
        | { slug: string; parameters: any }
        | { slug: typeof CustomPop; parameters: any }
        | null,
      endpoint: string,
      onError?: (error: unknown) => void
    ) =>
      peekLike({
        path: endpoint,
        headers: new Headers({
          'Content-Type': 'application/json; charset=utf-8',
        }),
        body: JSON.stringify(
          trigger === null || typeof trigger.slug === 'string'
            ? {
                screen_jwt: from.result.activeJwt,
                ...(trigger === null ? {} : { trigger }),
              }
            : trigger.parameters
        ),
        onError,
      }),
    [peekLike]
  );

  const trace = useCallback(
    (from: UseScreenQueueStateState & { type: 'success' }, event: object) => {
      apiFetch(
        `/api/1/users/me/screens/trace?platform=${encodeURIComponent(
          VISITOR_SOURCE
        )}&version=${encodeURIComponent(SCREEN_VERSION)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `bearer ${from.result.activeJwt}`,
          },
          body: JSON.stringify(event),
          keepalive: true,
        },
        null
      ).catch((e) => {
        console.debug('trace failed', e);
      });
    },
    []
  );

  const loggedInStateSticky = useWritableValueWithCallbacks<boolean>(
    () => false
  );
  useValueWithCallbacksEffect(loginContextRaw.value, (ctx) => {
    if (ctx.state === 'logged-in') {
      setVWC(loggedInStateSticky, true);
    } else if (ctx.state === 'logged-out') {
      setVWC(loggedInStateSticky, false);
    }
    return undefined;
  });

  useValueWithCallbacksEffect(
    loggedInStateSticky,
    useCallback(
      (loggedIn) => {
        if (!loggedIn) {
          setVWC(valueVWC, {
            type: 'loading',
          });
          return undefined;
        }

        const peeker = peek();
        peeker.promise.catch((e) => {
          if (
            e instanceof Error &&
            (e.message.startsWith('canceled') ||
              e.message.includes('not logged in'))
          ) {
            return;
          }
          console.error(e);
        });
        return peeker.cancel;
      },
      [peek, valueVWC]
    )
  );

  return useMemo(
    () => ({ value: valueVWC, peek, trace, pop }),
    [valueVWC, peek, trace, pop]
  );
};

function describeHandledError(): DisplayableError {
  return new DisplayableError('canceled', 'get screen', 'already handled');
}
