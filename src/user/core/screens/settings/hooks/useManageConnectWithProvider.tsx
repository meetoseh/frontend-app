import { useCallback, useContext } from 'react';
import {
  Callbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../../shared/lib/setVWC';
import {
  Modals,
  addModalWithCallbackToRemove,
} from '../../../../../shared/contexts/ModalContext';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import { YesNoModal } from '../../../../../shared/components/YesNoModal';
import { MergeProvider } from '../lib/MergeProvider';
import { PromptMergeResult } from '../lib/MergeMessagePipe';
import { usePromptMergeUsingModal } from './usePromptMergeUsingModal';
import { getMergeProviderUrl } from '../lib/mergeUtils';
import { apiFetch } from '../../../../../shared/lib/apiFetch';
import { VISITOR_SOURCE } from '../../../../../shared/lib/visitorSource';
import { SCREEN_VERSION } from '../../../../../shared/lib/screenVersion';
import { Passkey } from 'react-native-passkey';
import { showYesNoModal } from '../../../../../shared/lib/showYesNoModal';
import { DisplayableError } from '../../../../../shared/lib/errors';

export const useManageConnectWithProvider = ({
  mergeError,
  modals,
  onSecureLoginCompleted,
  links,
  passkeyHint,
}: {
  mergeError: WritableValueWithCallbacks<DisplayableError | null>;
  modals: WritableValueWithCallbacks<Modals>;
  onSecureLoginCompleted: (token: string | null) => void;
  links?: { [provider in MergeProvider]?: () => string | undefined };
  passkeyHint: 'register' | 'authenticate' | 'ask';
}): ((provider: MergeProvider, name: string) => Promise<void>) => {
  const loginContextRaw = useContext(LoginContext);

  const onPromptMergeResult = useCallback(
    (result: PromptMergeResult) => {
      if (result.type === 'success') {
        onSecureLoginCompleted(result.mergeToken);
      } else {
        onSecureLoginCompleted(null);

        if (result.type === 'cancel') {
          setVWC(
            mergeError,
            new DisplayableError('client', 'merge', 'canceled by user')
          );
        } else if (result.type === 'dismiss') {
          setVWC(
            mergeError,
            new DisplayableError('client', 'merge', 'dismissed by user')
          );
        } else if (result.type === 'error') {
          setVWC(
            mergeError,
            new DisplayableError('client', 'merge', `${result.error}`)
          );
        } else {
          setVWC(
            mergeError,
            new DisplayableError(
              'client',
              'merge',
              `unknown type: ${result.type}`
            )
          );
        }
      }
    },
    [mergeError, onSecureLoginCompleted]
  );

  const promptMergeUsingModal = usePromptMergeUsingModal(
    modals,
    onPromptMergeResult
  );

  const manageConnectWithTypicalProvider = useCallback(
    async (provider: MergeProvider, name: string): Promise<void> => {
      const loginRaw = loginContextRaw.value.get();
      if (loginRaw.state !== 'logged-in') {
        return;
      }
      const login = loginRaw;

      setVWC(mergeError, null);

      console.log(`Determining merge link for ${provider}...`);
      let mergeLink: string | undefined = undefined;
      try {
        if (links !== undefined) {
          console.log(`There are suggested links available...`);
          const suggester = links[provider];
          if (suggester !== undefined) {
            console.log(`Suggester for ${provider} found...`);
            mergeLink = suggester();
            if (mergeLink !== undefined) {
              console.log(`Suggested link found for ${provider}: ${mergeLink}`);
            }
          }
        }
        if (mergeLink === undefined) {
          console.log(`Fetching fresh url for ${provider}..`);
          mergeLink = await getMergeProviderUrl(login, provider);
          console.log(`Link created for ${provider}: ${mergeLink}`);
        }
      } catch (e) {
        const described =
          e instanceof DisplayableError
            ? e
            : new DisplayableError('client', `merge with ${provider}`, `${e}`);
        setVWC(mergeError, described);
        return;
      }

      const requestDismiss = createWritableValueWithCallbacks(() => {});

      const closeModalCallbacks = new Callbacks<undefined>();
      const modal = (
        <YesNoModal
          title={`Connect with ${name}`}
          body={
            `You will be redirected to ${name}. After successfully signing in, your history ` +
            'and purchases on Oseh will be combined. This will enable you ' +
            `to login with either method in the future.`
          }
          cta1="Cancel"
          cta2="Connect"
          onClickOne={async () => requestDismiss.get()()}
          onClickTwo={async () => {
            await promptMergeUsingModal(provider, mergeLink);
            requestDismiss.get()();
          }}
          emphasize={2}
          onDismiss={() => closeModalCallbacks.call(undefined)}
          requestDismiss={requestDismiss}
        />
      );

      const closeModal = addModalWithCallbackToRemove(modals, modal);
      closeModalCallbacks.add(() => closeModal());
    },
    [loginContextRaw, mergeError, modals, promptMergeUsingModal, links]
  );

  const manageConnectWithPasskey = useCallback(
    async (_provider: 'Passkey', _name: string): Promise<void> => {
      const loginRaw = loginContextRaw.value.get();
      if (loginRaw.state !== 'logged-in') {
        return;
      }
      const login = loginRaw;

      setVWC(mergeError, null);

      let technique = passkeyHint;
      if (technique === 'ask') {
        const response = await showYesNoModal(modals, {
          title: 'Passkey',
          body: 'Would you like to register a new passkey or connect an existing one?',
          cta1: 'Register',
          cta2: 'Connect',
          emphasize: 1,
        }).promise;
        if (response === true) {
          technique = 'register';
        } else if (response === false) {
          technique = 'authenticate';
        } else {
          return;
        }
      }

      try {
        if (technique === 'register') {
          await handleRegister();
        } else {
          await handleAuthenticate();
        }
      } catch (e) {
        const described =
          e instanceof DisplayableError
            ? e
            : new DisplayableError('client', `passkey ${technique}`, `${e}`);
        setVWC(mergeError, described);
      }

      async function handleRegister() {
        const response = await apiFetch(
          '/api/1/oauth/passkeys/register_begin?platform=' +
            encodeURIComponent(VISITOR_SOURCE) +
            '&version=' +
            encodeURIComponent(SCREEN_VERSION),
          {
            method: 'POST',
          },
          null
        );
        if (!response.ok) {
          throw response;
        }

        const requestJson = await response.json();
        let result: Awaited<ReturnType<typeof Passkey.create>>;
        try {
          result = await Passkey.create(requestJson);
          if (typeof result === 'string') {
            // android
            result = JSON.parse(result);
          }
        } catch (e) {
          console.log('passkey regstration failed:', e);
          setVWC(
            mergeError,
            new DisplayableError('client', 'passkey registration', `${e}`)
          );
          return;
        }
        const loginResponse = await apiFetch(
          '/api/1/oauth/passkeys/register_merge_complete?platform=' +
            encodeURIComponent(VISITOR_SOURCE) +
            '&version=' +
            encodeURIComponent(SCREEN_VERSION),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              id_b64url: result.id,
              client_data_json_b64url: result.response.clientDataJSON,
              attestation_object_b64url: result.response.attestationObject,
            }),
          },
          login
        );
        if (!loginResponse.ok) {
          throw loginResponse;
        }

        const mergeResponseJson: {
          merge_token: string;
        } = await loginResponse.json();

        onSecureLoginCompleted(mergeResponseJson.merge_token);
      }

      async function handleAuthenticate() {
        const response = await apiFetch(
          '/api/1/oauth/passkeys/authenticate_begin?platform=' +
            encodeURIComponent(VISITOR_SOURCE) +
            '&version=' +
            encodeURIComponent(SCREEN_VERSION),
          {
            method: 'POST',
          },
          null
        );
        if (!response.ok) {
          throw response;
        }

        const requestJson = await response.json();
        let result: Awaited<ReturnType<typeof Passkey.get>>;
        try {
          result = await Passkey.get(requestJson);
          if (typeof result === 'string') {
            // android
            result = JSON.parse(result);
          }
        } catch (e) {
          console.log('passkey authentication failed:', e);
          setVWC(
            mergeError,
            new DisplayableError('client', 'passkey authentication', `${e}`)
          );
          return;
        }
        const loginResponse = await apiFetch(
          '/api/1/oauth/passkeys/authenticate_merge_complete?platform=' +
            encodeURIComponent(VISITOR_SOURCE) +
            '&version=' +
            encodeURIComponent(SCREEN_VERSION),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              id_b64url: result.id,
              authenticator_data_b64url: result.response.authenticatorData,
              client_data_json_b64url: result.response.clientDataJSON,
              signature_b64url: result.response.signature,
            }),
          },
          login
        );
        if (!loginResponse.ok) {
          throw loginResponse;
        }

        const mergeResponseJson: {
          merge_token: string;
        } = await loginResponse.json();

        onSecureLoginCompleted(mergeResponseJson.merge_token);
      }
    },
    [loginContextRaw, mergeError, modals, onSecureLoginCompleted, passkeyHint]
  );

  const manageConnectWithProvider = useCallback(
    (provider: MergeProvider, name: string): Promise<void> => {
      if (provider === 'Passkey') {
        return manageConnectWithPasskey(provider, name);
      } else if (provider === 'Silent') {
        return Promise.reject(
          new Error('Silent is unsupported in this context')
        );
      } else {
        return manageConnectWithTypicalProvider(provider, name);
      }
    },
    [manageConnectWithPasskey, manageConnectWithTypicalProvider]
  );

  return manageConnectWithProvider;
};
