import { useCallback, useContext, useEffect } from 'react';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { Feature } from '../../models/Feature';
import { MergeAccount } from './MergeAccount';
import { MergeAccountResources } from './MergeAccountResources';
import { MergeAccountState, MergeProvider } from './MergeAccountState';
import {
  MergeAccountStoredState,
  getMergeAccountStoredState,
  setMergeAccountStoredState,
} from './MergeAccountStore';
import { useInappNotificationValueWithCallbacks } from '../../../../shared/hooks/useInappNotification';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useInappNotificationSessionValueWithCallbacks } from '../../../../shared/hooks/useInappNotificationSession';
import { getMergeProviderUrl } from './utils';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';

const recheckMergeSuggestionsIntervalSeconds = 60 * 60 * 12;
const ianUid = 'oseh_ian_ez6eLf92Lbz1Odr6OKIw6A';

export const MergeAccountFeature: Feature<
  MergeAccountState,
  MergeAccountResources
> = {
  identifier: 'mergeAccount',
  useWorldState: () => {
    const mergeAccountStoredStateVWC =
      useWritableValueWithCallbacks<MergeAccountStoredState | null>(() => null);
    const erroredVWC = useWritableValueWithCallbacks<boolean>(() => false);
    const ianPropsVWC = useMappedValuesWithCallbacks(
      [mergeAccountStoredStateVWC, erroredVWC],
      useCallback(() => {
        const stored = mergeAccountStoredStateVWC.get();
        if (stored === null || stored === undefined) {
          return { uid: ianUid, suppress: true };
        }

        const errored = erroredVWC.get();
        if (errored) {
          return { uid: ianUid, suppress: true };
        }

        return { uid: ianUid, suppress: false };
      }, [mergeAccountStoredStateVWC, erroredVWC])
    );
    const ianVWC = useInappNotificationValueWithCallbacks({
      type: 'callbacks',
      props: ianPropsVWC.get,
      callbacks: ianPropsVWC.callbacks,
    });
    const loginContextRaw = useContext(LoginContext);

    useValueWithCallbacksEffect(loginContextRaw.value, (loginRaw) => {
      if (loginRaw.state !== 'logged-in') {
        setVWC(mergeAccountStoredStateVWC, null);
        return;
      }
      const login = loginRaw;

      if (erroredVWC.get()) {
        return;
      }

      let running = true;
      readStateAndMaybeFetchFromServer();
      return () => {
        running = false;
      };

      async function readStateFromServer(): Promise<MergeAccountStoredState> {
        const response = await apiFetch(
          '/api/1/users/me/merge_account_suggestions',
          { method: 'GET' },
          login
        );

        if (!response.ok) {
          throw response;
        }

        if (response.status === 204) {
          return {
            mergeSuggestions: null,
            checkedAt: new Date(),
            userSub: login.userAttributes.sub,
          };
        }

        const body: { channels: MergeProvider[] } = await response.json();
        return {
          mergeSuggestions: body.channels.map((provider) => ({ provider })),
          checkedAt: new Date(),
          userSub: login.userAttributes.sub,
        };
      }

      async function readStateAndMaybeFetchFromServer() {
        const stored = await getMergeAccountStoredState();
        if (!running) {
          return;
        }

        if (
          stored !== null &&
          stored.checkedAt.getTime() >
            Date.now() - recheckMergeSuggestionsIntervalSeconds * 1000 &&
          stored.userSub === login.userAttributes.sub
        ) {
          setVWC(mergeAccountStoredStateVWC, stored);
          return;
        }

        let fromServer;
        try {
          fromServer = await readStateFromServer();
        } catch (e) {
          if (!running) {
            return;
          }

          setVWC(erroredVWC, true);
          return;
        }

        if (!running) {
          return;
        }

        await setMergeAccountStoredState(fromServer);
        setVWC(mergeAccountStoredStateVWC, fromServer);
        setVWC(erroredVWC, false);
      }
    });

    return useMappedValuesWithCallbacks(
      [mergeAccountStoredStateVWC, erroredVWC, ianVWC, loginContextRaw.value],
      useCallback((): MergeAccountState => {
        const loginRaw = loginContextRaw.value.get();
        if (loginRaw.state !== 'logged-in') {
          return {
            mergeSuggestions: null,
            ian: null,
            onSuggestionsDismissed: () => Promise.resolve(),
          };
        }
        const login = loginRaw;
        const stored = mergeAccountStoredStateVWC.get();
        const errored = erroredVWC.get();
        const ian = ianVWC.get();
        return {
          mergeSuggestions: errored ? null : stored?.mergeSuggestions,
          ian,
          onSuggestionsDismissed: async () => {
            const loginContext = loginContextRaw.value.get();
            if (
              loginContext.state !== 'logged-in' ||
              loginContext.userAttributes === null
            ) {
              await setMergeAccountStoredState(null);
              setVWC(mergeAccountStoredStateVWC, null);
              return;
            }

            const newStored: MergeAccountStoredState = {
              mergeSuggestions: null,
              checkedAt: new Date(),
              userSub: loginContext.userAttributes.sub,
            };
            await setMergeAccountStoredState(newStored);
            setVWC(mergeAccountStoredStateVWC, newStored);
          },
        };
      }, [
        mergeAccountStoredStateVWC,
        erroredVWC,
        ianVWC,
        loginContextRaw.value,
      ])
    );
  },
  isRequired: (state) => {
    if (state.mergeSuggestions === undefined) {
      return undefined;
    }

    if (state.mergeSuggestions === null) {
      return false;
    }

    if (state.ian === null) {
      return undefined;
    }

    return state.ian.showNow;
  },
  useResources: (stateVWC, requiredVWC, allStatesVWC) => {
    const sessionPropsVWC = useMappedValuesWithCallbacks(
      [stateVWC, requiredVWC],
      useCallback(() => {
        const ian = stateVWC.get().ian;
        if (!requiredVWC.get() || ian === null) {
          return { uid: null };
        }
        return { uid: ian.uid };
      }, [stateVWC, requiredVWC])
    );
    const sessionVWC = useInappNotificationSessionValueWithCallbacks({
      type: 'callbacks',
      props: sessionPropsVWC.get,
      callbacks: sessionPropsVWC.callbacks,
    });

    const loginContextRaw = useContext(LoginContext);
    const providerUrlsVWC = useWritableValueWithCallbacks<{
      Google: string | null;
      SignInWithApple: string | null;
      Direct: string | null;
      Dev: string | null;
    } | null>(() => null);

    useMappedValuesWithCallbacks(
      [stateVWC, requiredVWC, loginContextRaw.value],
      useCallback(() => {
        const loginRaw = loginContextRaw.value.get();
        if (loginRaw.state !== 'logged-in') {
          setVWC(providerUrlsVWC, null);
          return;
        }

        const login = loginRaw;
        let running = true;
        inner();
        return () => {
          running = false;
        };

        async function inner() {
          if (!requiredVWC.get()) {
            setVWC(providerUrlsVWC, null);
            return;
          }

          const state = stateVWC.get();
          if (
            state.mergeSuggestions === null ||
            state.mergeSuggestions === undefined ||
            state.mergeSuggestions.length === 0
          ) {
            setVWC(providerUrlsVWC, null);
            return;
          }

          const urls: MergeAccountResources['providerUrls'] = {
            Google: null,
            SignInWithApple: null,
            Direct: null,
            Dev: null,
          };
          let gotAtLeastOne = false;
          const promises = state.mergeSuggestions.map(async (suggestion) => {
            const url = await getMergeProviderUrl(login, suggestion.provider);
            urls[suggestion.provider] = url;
            gotAtLeastOne = true;
          });
          await Promise.allSettled(promises);
          if (!running) {
            return;
          }

          if (!gotAtLeastOne) {
            state.onSuggestionsDismissed();
            return;
          }

          setVWC(providerUrlsVWC, urls);
        }
      }, [stateVWC, requiredVWC, loginContextRaw, providerUrlsVWC])
    );

    const confirmMergePassthroughsVWC = useMappedValueWithCallbacks(
      allStatesVWC,
      (allStates) => {
        const onShowingSecureLogin =
          allStates.confirmMergeAccount.onShowingSecureLogin;
        const onSecureLoginCompleted =
          allStates.confirmMergeAccount.onSecureLoginCompleted;

        return {
          onShowingSecureLogin,
          onSecureLoginCompleted,
        };
      },
      {
        inputEqualityFn: (a, b) => {
          return (
            Object.is(
              a.confirmMergeAccount.onShowingSecureLogin,
              b.confirmMergeAccount.onShowingSecureLogin
            ) &&
            Object.is(
              a.confirmMergeAccount.onSecureLoginCompleted,
              b.confirmMergeAccount.onSecureLoginCompleted
            )
          );
        },
      }
    );

    return useMappedValuesWithCallbacks(
      [
        sessionVWC,
        providerUrlsVWC,
        confirmMergePassthroughsVWC,
        requiredVWC,
        loginContextRaw.value,
      ],
      useCallback((): MergeAccountResources => {
        const confirmMergePassthroughs = confirmMergePassthroughsVWC.get();

        if (!requiredVWC.get()) {
          return {
            session: null,
            givenName: null,
            providerUrls: null,
            loading: true,
            ...confirmMergePassthroughs,
          };
        }

        const session = sessionVWC.get();
        const providerUrls = providerUrlsVWC.get();
        const login = loginContextRaw.value.get();

        return {
          session,
          givenName:
            login.state === 'logged-in' ? login.userAttributes.givenName : null,
          providerUrls,
          loading: session === null || providerUrls === null,
          ...confirmMergePassthroughs,
        };
      }, [
        requiredVWC,
        sessionVWC,
        providerUrlsVWC,
        confirmMergePassthroughsVWC,
        loginContextRaw,
      ])
    );
  },
  component: (state, resources) => (
    <MergeAccount state={state} resources={resources} />
  ),
};