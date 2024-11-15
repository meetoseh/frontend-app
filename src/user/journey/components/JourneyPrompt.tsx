import { MutableRefObject, ReactElement, useCallback } from 'react';
import { useStateCompat as useState } from '../../../shared/hooks/useStateCompat';
import { LoginContextValue } from '../../../shared/contexts/LoginContext';
import { CountdownTextConfig } from '../../interactive_prompt/components/CountdownText';
import { InteractivePromptRouter } from '../../interactive_prompt/components/InteractivePromptRouter';
import {
  InteractivePrompt,
  interactivePromptKeyMap,
} from '../../interactive_prompt/models/InteractivePrompt';
import { JourneyRef } from '../models/JourneyRef';
import { apiFetch } from '../../../shared/lib/apiFetch';
import { convertUsingKeymap } from '../../../shared/lib/CrudFetcher';
import { useValueWithCallbacksEffect } from '../../../shared/hooks/useValueWithCallbacksEffect';
import { BoxError, DisplayableError } from '../../../shared/lib/errors';

type JourneyPromptProps = {
  /**
   * The journey to fetch the prompt for.
   */
  journey: JourneyRef;

  /**
   * The login context to use to fetch the prompt.
   */
  loginContext: LoginContextValue;

  /**
   * The function to call when the user has finished the prompt.
   */
  onFinished: () => void;

  /**
   * The ref to register a leaving callback which must be called before unmounting
   * the component normally in order to trigger a leave event. Otherwise, a leave
   * event is only triggered when the prompt finishes normally or the page is
   * closed (via onbeforeunload)
   */
  leavingCallback: MutableRefObject<(() => void) | null>;
};

const COUNTDOWN_CONFIG: CountdownTextConfig = {
  titleText: 'Class is almost ready',
};

/**
 * Loads the interactive prompt for a journey and then displays it.
 */
export const JourneyPrompt = ({
  journey,
  loginContext: loginContextRaw,
  onFinished,
  leavingCallback,
}: JourneyPromptProps): ReactElement => {
  const [interactivePrompt, setInteractivePrompt] =
    useState<InteractivePrompt | null>(null);
  const [error, setError] = useState<DisplayableError | null>(null);

  useValueWithCallbacksEffect(
    loginContextRaw.value,
    useCallback(
      (loginRaw) => {
        if (loginRaw.state !== 'logged-in') {
          return undefined;
        }
        const login = loginRaw;

        let active = true;
        setError(null);
        fetchPrompt().catch((e) => {
          if (active) {
            console.log('Error fetching prompt: ', e);
            const error =
              e instanceof DisplayableError
                ? e
                : new DisplayableError('client', 'fetch prompt', `${e}`);
            setError(error);
          }
        });
        return () => {
          active = false;
        };

        async function fetchPrompt() {
          const response = await apiFetch(
            '/api/1/journeys/start_interactive_prompt',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({
                journey_uid: journey.uid,
                journey_jwt: journey.jwt,
              }),
            },
            login
          );

          if (!response.ok) {
            throw response;
          }

          const body = await response.json();
          const prompt = convertUsingKeymap(body, interactivePromptKeyMap);
          if (active) {
            setInteractivePrompt(prompt);
          }
        }
      },
      [journey]
    )
  );

  if (interactivePrompt === null) {
    return error === null ? <></> : <BoxError error={error} />;
  }

  return (
    <InteractivePromptRouter
      prompt={interactivePrompt}
      onFinished={onFinished}
      countdown={COUNTDOWN_CONFIG}
      subtitle="Class Poll"
      leavingCallback={leavingCallback}
    />
  );
};
