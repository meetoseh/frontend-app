import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { Platform, Share } from 'react-native';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../../../shared/anim/VariableStrategyProps';
import {
  Callbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { LoginContext } from '../../../shared/contexts/LoginContext';
import { ModalContext } from '../../../shared/contexts/ModalContext';
import { setVWC } from '../../../shared/lib/setVWC';
import { apiFetch } from '../../../shared/lib/apiFetch';
import { describeError } from '../../../shared/lib/describeError';
import { useValuesWithCallbacksEffect } from '../../../shared/hooks/useValuesWithCallbacksEffect';

export type UseShareClassProps = {
  /**
   * The journey to share
   */
  journey: VariableStrategyProps<{ uid: string }>;
};

export type UseShareClassResult = {
  /**
   * The function to call to trigger sharing the class. Returns a function
   * which can be used to request the current share be canceled, if we're
   * still working on it.
   *
   * This will attempt to share the class even if we know it's not shareable
   */
  shareClass: () => () => void;

  /**
   * True if the class is shareable, false if the class is not shareable,
   * undefined if we're unsure
   */
  shareable: WritableValueWithCallbacks<boolean | undefined>;

  /**
   * The last error that occurred, as can be presented to the user
   */
  error: WritableValueWithCallbacks<ReactElement | null>;

  /**
   * True if we are working on sharing the class, false otherwise
   */
  working: ValueWithCallbacks<boolean>;
};

/**
 * Creates a function which can share a specific class. This requires a login
 * context and modal context.
 */
export const useShareClass = ({
  journey,
}: UseShareClassProps): UseShareClassResult => {
  const loginContextRaw = useContext(LoginContext);
  const modalContext = useContext(ModalContext);
  const journeyVWC = useVariableStrategyPropsAsValueWithCallbacks(journey);
  const error = useWritableValueWithCallbacks<ReactElement | null>(() => null);
  const shareable = useWritableValueWithCallbacks<boolean | undefined>(
    () => undefined
  );
  const lastLink = useWritableValueWithCallbacks<{
    uid: string;
    link: string;
  } | null>(() => null);

  const working = useWritableValueWithCallbacks(() => false);

  useValuesWithCallbacksEffect([journeyVWC, loginContextRaw.value], () => {
    const journey = journeyVWC.get();
    const loginContextUnch = loginContextRaw.value.get();
    if (loginContextUnch.state !== 'logged-in') {
      return undefined;
    }
    const loginContext = loginContextUnch;

    let running = true;
    const cancelers = new Callbacks<undefined>();
    checkShareable();
    return () => {
      running = false;
      cancelers.call(undefined);
    };

    async function checkShareableInner() {
      const controller = new AbortController();
      const signal = controller.signal;
      const doAbort = () => controller.abort();

      cancelers.add(doAbort);
      if (!running) {
        cancelers.remove(doAbort);
        return;
      }

      const response = await apiFetch(
        '/api/1/journeys/check_if_shareable',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            uid: journey.uid,
          }),
          signal,
        },
        loginContext
      );

      if (!response.ok) {
        if (response.status === 404) {
          setVWC(shareable, false);
        }
        throw response;
      }

      if (!running) {
        return;
      }

      const data: { shareable: boolean } = await response.json();
      setVWC(shareable, data.shareable);
    }

    async function checkShareable() {
      if (!running) {
        return;
      }

      setVWC(shareable, undefined);
      try {
        await checkShareableInner();
      } catch (e) {
        if (running) {
          console.log('failed to determine if shareable:', e);
        }
      }
    }
  });

  const shareClass = useCallback(() => {
    if (working.get()) {
      return () => {};
    }

    const loginContextUnch = loginContextRaw.value.get();
    if (loginContextUnch.state !== 'logged-in') {
      return () => {};
    }

    const loginContext = loginContextUnch;

    setVWC(working, true);
    const running = createWritableValueWithCallbacks(true);
    handleShare(journeyVWC.get().uid);

    return () => {
      setVWC(running, false);
    };

    async function openShareModal(link: string): Promise<void> {
      await Share.share(
        Platform.select({
          ios: { url: link },
          default: { message: link },
        })
      );
    }

    async function getShareLink(journeyUid: string): Promise<string> {
      const lastLinkValue = lastLink.get();
      if (lastLinkValue !== null && lastLinkValue.uid === journeyUid) {
        return lastLinkValue.link;
      }

      const controller = new AbortController();
      const signal = controller.signal;
      const doAbort = () => controller.abort();
      running.callbacks.add(doAbort);
      if (!running.get()) {
        running.callbacks.remove(doAbort);
        throw new Error('canceled');
      }

      let response: Response;
      try {
        response = await apiFetch(
          '/api/1/journeys/create_share_link',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ uid: journeyUid }),
            signal,
          },
          loginContext
        );
      } finally {
        running.callbacks.remove(doAbort);
      }

      if (!response.ok) {
        if (
          (response.status === 404 || response.status === 409) &&
          running.get() &&
          journeyVWC.get().uid === journeyUid
        ) {
          setVWC(shareable, false);
        }

        throw response;
      }

      const body = await response.json();
      return body.url;
    }

    async function handleShareInner(journeyUid: string) {
      const link = await getShareLink(journeyUid);
      if (!running.get()) {
        return;
      }

      setVWC(lastLink, { uid: journeyUid, link });
      await openShareModal(link);
    }

    async function handleShare(journeyUid: string) {
      try {
        await handleShareInner(journeyUid);
      } catch (e) {
        const err = await describeError(e);
        if (running.get()) {
          setVWC(error, err);
        }
      } finally {
        setVWC(working, false);
      }
    }
  }, []);

  return useMemo(
    () => ({ working, shareClass, error, shareable }),
    [working, error, shareClass, shareable]
  );
};
