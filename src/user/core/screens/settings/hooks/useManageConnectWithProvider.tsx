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
import { SettingsResources } from '../SettingsResources';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import { YesNoModal } from '../../../../../shared/components/YesNoModal';
import { describeError } from '../../../../../shared/lib/describeError';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../../shared/components/ErrorBanner';
import { MergeProvider } from '../../../features/mergeAccount/MergeAccountState';
import { PromptMergeResult } from '../../../features/mergeAccount/lib/MergeMessagePipe';
import { usePromptMergeUsingModal } from '../../../features/mergeAccount/hooks/usePromptMergeUsingModal';
import { getMergeProviderUrl } from '../lib/mergeUtils';

export const useManageConnectWithProvider = ({
  resources,
  mergeError,
  modals,
  onSecureLoginCompleted,
}: {
  resources: SettingsResources;
  mergeError: WritableValueWithCallbacks<ReactElement | null>;
  modals: WritableValueWithCallbacks<Modals>;
  onSecureLoginCompleted: (token: string | null) => void;
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
    [mergeError, resources]
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
      const identities = resources.identities.get();
      const providerIdentities =
        identities !== null
          ? identities.filter((f) => f.provider === provider)
          : [];
      const isFirstForProvider = providerIdentities.length === 0;

      setVWC(mergeError, null);

      let mergeLink: string;
      try {
        mergeLink = await getMergeProviderUrl(login, provider);
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
            `You will be redirected to connect a new login identity. ` +
            (isFirstForProvider
              ? `Doing so will allow you to login using ${name} in the future.`
              : `If you select a different ${name} account than the one${
                  providerIdentities.length === 1 ? '' : 's'
                } you already ` +
                `have connected, you will be able to login with ` +
                (providerIdentities.length === 1 ? 'either' : 'any of them') +
                ` in the future.`)
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
    [loginContextRaw, mergeError, modals, resources, promptMergeUsingModal]
  );

  return manageConnectWithProvider;
};
