import { ReactElement, useCallback, useContext } from 'react';
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
import { describeError } from '../../../../../shared/lib/describeError';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../../shared/components/ErrorBanner';
import { MergeProvider } from '../lib/MergeProvider';
import { PromptMergeResult } from '../lib/MergeMessagePipe';
import { usePromptMergeUsingModal } from './usePromptMergeUsingModal';
import { getMergeProviderUrl } from '../lib/mergeUtils';

export const useManageConnectWithProvider = ({
  mergeError,
  modals,
  onSecureLoginCompleted,
  links,
}: {
  mergeError: WritableValueWithCallbacks<ReactElement | null>;
  modals: WritableValueWithCallbacks<Modals>;
  onSecureLoginCompleted: (token: string | null) => void;
  links?: { [provider in MergeProvider]?: () => string | undefined };
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
            <ErrorBanner>
              <ErrorBannerText>Merge canceled by user.</ErrorBannerText>
            </ErrorBanner>
          );
        } else if (result.type === 'dismiss') {
          setVWC(
            mergeError,
            <ErrorBanner>
              <ErrorBannerText>Merge dismissed by user.</ErrorBannerText>
            </ErrorBanner>
          );
        } else if (result.type === 'error') {
          setVWC(
            mergeError,
            <ErrorBanner>
              <ErrorBannerText>ERR: {result.error}</ErrorBannerText>
            </ErrorBanner>
          );
        } else {
          setVWC(
            mergeError,
            <ErrorBanner>
              <ErrorBannerText>
                Unknown result: {result.rawType}
              </ErrorBannerText>
            </ErrorBanner>
          );
        }
      }
    },
    [mergeError]
  );

  const promptMergeUsingModal = usePromptMergeUsingModal(
    modals,
    onPromptMergeResult
  );

  const manageConnectWithProvider = useCallback(
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
        setVWC(mergeError, await describeError(e));
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
    [loginContextRaw, mergeError, modals, promptMergeUsingModal]
  );

  return manageConnectWithProvider;
};
