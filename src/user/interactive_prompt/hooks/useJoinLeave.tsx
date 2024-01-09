import { useContext, useEffect } from 'react';
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import {
  LoginContext,
  LoginContextValue,
  LoginContextValueLoggedIn,
} from '../../../shared/contexts/LoginContext';
import { InteractivePrompt } from '../models/InteractivePrompt';
import { PromptTime } from './usePromptTime';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../../../shared/anim/VariableStrategyProps';
import { useReactManagedValueAsValueWithCallbacks } from '../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { apiFetch } from '../../../shared/lib/apiFetch';
import { AppState } from 'react-native';

/**
 * The information exported from the join/leave hook.
 */
export type JoinLeave = {
  /**
   * If we have successfully reported that the user has joined the room, the
   * prompt time at which they joined, otherwise null.
   */
  joinedAt: number | null;

  /**
   * If we have successfully reported that the user has left the room, the
   * prompt time at which they left, otherwise null.
   */
  leftAt: number | null;

  /**
   * True if we are actively sending a join or leave event, false otherwise.
   */
  working: boolean;

  /**
   * True if something occurred that would have resulted in the leave event
   * being called, false if that hasn't happened yet. This is different from
   * `left` since if the event occurred before we joined, we wouldn't have left.
   * Most of the time this can be treated as an internal value used to implement
   * the hook.
   */
  leaving: boolean;

  /**
   * If an error occurred preventing join/leave events, the
   * error that occurred, otherwise null.
   */
  error: any | null;

  /**
   * Called to exit the room. We cannot use unmounting to decide when
   * we have left, since the component may be remounted superfluously.
   *
   * Note this isn't necessarily the only way a leave event is triggered;
   * we will trigger leave events if the browser is leaving the page and
   * we haven't left.
   *
   * If called before joining, we won't ever join.
   */
  leave: () => void;
};

type JoinLeaveProps = {
  /**
   * The prompt we are generating join/leave events for. Note that if this
   * changes, it should be for the same logical prompt (i.e., the uid should
   * not change but the jwt can)
   */
  prompt: VariableStrategyProps<InteractivePrompt>;

  /**
   * The prompt time that we use to decide when to generate the
   * events.
   */
  promptTime: VariableStrategyProps<PromptTime>;
};

/**
 * A hook-like function which generates a join event when the prompt
 * time passes over 0 and a leave event when unmounted or the prompt
 * time passes over the duration.
 *
 * This returns an object that can be used to check which events have
 * been sent, but it does not trigger state updates to do so. A callbacks
 * list is available if you want to be notified when the events are
 * sent.
 *
 * If the prompt changes, we will continue from where we left off.
 * This means this hook must be remounted if the prompt uid changes.
 * This isn't a serious issue since we would almost always want to
 * remount anyway.
 */
export const useJoinLeave = ({
  prompt: promptVariableStrategy,
  promptTime: promptTimeVariableStrategy,
}: JoinLeaveProps): ValueWithCallbacks<JoinLeave> => {
  const promptVWC = useVariableStrategyPropsAsValueWithCallbacks(
    promptVariableStrategy
  );
  const promptTimeVWC = useVariableStrategyPropsAsValueWithCallbacks(
    promptTimeVariableStrategy
  );

  const loginContextRaw = useContext(LoginContext);
  const resultVWC = useWritableValueWithCallbacks<JoinLeave>(() => ({
    joinedAt: null,
    leftAt: null,
    leaving: false,
    working: false,
    error: null,
    leave: () => {
      if (!resultVWC.get().leaving) {
        resultVWC.get().leaving = true;
        resultVWC.callbacks.call(undefined);
      }
    },
  }));

  useEffect(() => {
    let outerActive = true;
    let canceler: (() => void) | null = null;
    promptVWC.callbacks.add(handlePromptOrLoginContextChanged);
    loginContextRaw.value.callbacks.add(handlePromptOrLoginContextChanged);
    handlePromptOrLoginContextChanged();
    return () => {
      if (!outerActive) {
        return;
      }
      outerActive = false;
      promptVWC.callbacks.remove(handlePromptOrLoginContextChanged);
      loginContextRaw.value.callbacks.remove(handlePromptOrLoginContextChanged);
      canceler?.();
      canceler = null;
    };

    function handlePromptAndLoginContext(
      prompt: InteractivePrompt
    ): () => void {
      let active = true;
      const cancelers = new Callbacks<undefined>();
      const deactivate = () => {
        if (active) {
          active = false;
          cancelers.call(undefined);
        }
      };
      handle();
      return deactivate;

      async function handle() {
        if (!active || !outerActive) {
          return;
        }
        let leaveReceived = false;
        resultVWC.get().leave = () => {
          if (!leaveReceived) {
            leaveReceived = true;
            handleSomethingChanged();
          }
        };
        resultVWC.callbacks.call(undefined);

        cancelers.add(() => {
          // this callback is circular without this guard; setting leaving to
          // true will cause the JourneyLobbyScreen to be unmounted which will
          // cause this hook to be unmounted which will cause this callback to
          // be called again while we're still in the middle of callbacks for
          // resultVWC
          if (!resultVWC.get().leaving) {
            resultVWC.get().leave = () => {
              if (!resultVWC.get().leaving) {
                resultVWC.get().leaving = true;
                resultVWC.callbacks.call(undefined);
              }
            };
            resultVWC.callbacks.call(undefined);
          }
        });

        promptTimeVWC.callbacks.add(handleSomethingChanged);
        cancelers.add(() => {
          promptTimeVWC.callbacks.remove(handleSomethingChanged);
        });

        if (AppState.isAvailable) {
          const listener = AppState.addEventListener('change', (status) => {
            if (status === 'inactive' || status === 'background') {
              onBeforeUnload();
            }
          });
          cancelers.add(listener.remove.bind(listener));
        }

        handleSomethingChanged();

        // something = prompt time, leave received, working
        function handleSomethingChanged() {
          if (!active) {
            return;
          }

          if (resultVWC.get().working) {
            return;
          }

          if (
            resultVWC.get().leftAt !== null ||
            resultVWC.get().error !== null
          ) {
            deactivate();
            return;
          }

          if (
            !leaveReceived &&
            !resultVWC.get().leaving &&
            promptTimeVWC.get().time >= prompt.durationSeconds * 1000
          ) {
            leaveReceived = true;
          }

          if (leaveReceived && !resultVWC.get().leaving) {
            // this can trigger unmounting
            resultVWC.get().leaving = true;
            resultVWC.get().leave = () => {};
            resultVWC.callbacks.call(undefined);
          }

          if (resultVWC.get().leaving) {
            const joinedAt = resultVWC.get().joinedAt;
            const now = promptTimeVWC.get().time;
            if (joinedAt === null) {
              deactivate();
              return;
            }

            if (now < joinedAt) {
              resultVWC.get().error = new Error(
                'Leave event received before join event (time went backwards)'
              );
              resultVWC.callbacks.call(undefined);
              deactivate();
              return;
            }

            if (now === joinedAt) {
              // need to wait a frame; this makes the backend implementation simpler
              // by keeping events strictly ordered without having to use a counting
              // strategy. Causes some weirdness surrounding pauses but it's a very
              // unlikely occurrence since pauses are mostly for development
              return;
            }

            sendEventWrapper('leave').finally(handleSomethingChanged);
            return;
          }

          if (
            resultVWC.get().joinedAt === null &&
            promptTimeVWC.get().time >= 0
          ) {
            sendEventWrapper('join').finally(handleSomethingChanged);
            return;
          }
        }

        function onBeforeUnload() {
          if (!leaveReceived) {
            leaveReceived = true;
            handleSomethingChanged();
          }
        }
      }

      async function sendEventWrapper(event: 'join' | 'leave') {
        if (resultVWC.get().working) {
          throw new Error('Already working');
        }

        resultVWC.get().working = true;
        resultVWC.callbacks.call(undefined);

        const loginRaw = loginContextRaw.value.get();

        const time = Math.min(
          Math.max(promptTimeVWC.get().time, 0),
          prompt.durationSeconds * 1000
        );

        try {
          if (loginRaw.state === 'logged-in') {
            await sendEvent(event, time, prompt, loginRaw);
          }
          if (event === 'join') {
            resultVWC.get().joinedAt = time;
          } else if (event === 'leave') {
            resultVWC.get().leftAt = time;
          } else {
            ((_: never) => {})(event);
          }
        } catch (e) {
          resultVWC.get().error = e;
        } finally {
          resultVWC.get().working = false;
          resultVWC.callbacks.call(undefined);
        }
      }
    }

    function handlePromptOrLoginContextChanged() {
      if (!outerActive) {
        return;
      }
      canceler?.();
      canceler = handlePromptAndLoginContext(promptVWC.get());
    }
  }, [promptVWC, promptTimeVWC, loginContextRaw, resultVWC]);

  return resultVWC;
};

async function sendEvent(
  name: 'join' | 'leave',
  eventPromptTime: number,
  prompt: InteractivePrompt,
  loginContext: LoginContextValueLoggedIn
) {
  const response = await apiFetch(
    `/api/1/interactive_prompts/events/${name}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        interactive_prompt_uid: prompt.uid,
        interactive_prompt_jwt: prompt.jwt,
        session_uid: prompt.sessionUid,
        prompt_time: eventPromptTime / 1000.0,
        data: {},
      }),
      keepalive: true,
    },
    loginContext
  );

  if (!response.ok) {
    throw response;
  }
}
