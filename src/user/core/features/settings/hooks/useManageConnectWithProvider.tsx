import { ReactElement, useCallback, useContext } from 'react';
import {
  Callbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { MergeProvider } from '../../mergeAccount/MergeAccountState';
import {
  Modals,
  addModalWithCallbackToRemove,
} from '../../../../../shared/contexts/ModalContext';
import { SettingsResources } from '../SettingsResources';
import { getMergeProviderUrl } from '../../mergeAccount/utils';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import { YesNoModal } from '../../../../../shared/components/YesNoModal';
import { describeError } from '../../../../../shared/lib/describeError';
import { usePromptMergeUsingModal } from '../../mergeAccount/hooks/usePromptMergeUsingModal';
import { PromptMergeResult } from '../../mergeAccount/lib/MergeMessagePipe';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../../shared/components/ErrorBanner';

export const useManageConnectWithProvider = ({
  resources,
  mergeError,
  modals,
}: {
  resources: ValueWithCallbacks<SettingsResources>;
  mergeError: WritableValueWithCallbacks<ReactElement | null>;
  modals: WritableValueWithCallbacks<Modals>;
}): ((provider: MergeProvider, name: string) => Promise<void>) => {
  const loginContextRaw = useContext(LoginContext);

  const onPromptMergeResult = useCallback(
    (result: PromptMergeResult) => {
      if (result.type === 'success') {
        resources.get().onSecureLoginCompleted(result.mergeToken);
      } else {
        resources.get().onSecureLoginCompleted(null);

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
      const identities = resources.get().identities;
      const providerIdentities =
        identities.type === 'success'
          ? identities.identities.filter((f) => f.provider === provider)
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
