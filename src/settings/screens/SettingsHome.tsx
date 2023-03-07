import { ReactElement, useCallback, useContext, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Share, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { styles } from './SettingsHomeStyles';
import { CloseButton } from '../../shared/components/CloseButton';
import { SettingsHomeState } from '../hooks/useSettingsHomeState';
import { SplashScreen } from '../../splash/SplashScreen';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { describeError } from '../../shared/lib/describeError';
import { apiFetch } from '../../shared/lib/apiFetch';
import { SimpleModalContainer } from '../../shared/components/SimpleModalContainer';
import { PromptContainer } from '../../shared/components/PromptContainer';
import { ErrorBanner, ErrorBannerText } from '../../shared/components/ErrorBanner';
import { RSQUO } from '../../shared/lib/HtmlEntities';

type SettingsHomeProps = {
  /**
   * The function to call if the user wants to return to the previous screen.
   */
  onBack: () => void;

  /**
   * The function to call if the user wants to go to the upgrade screen.
   */
  onGotoUpgrade: () => void;

  /**
   * The state to use for this screen, as if from useSettingsHomeState
   */
  state: SettingsHomeState;

  /**
   * If specified, shown as the error initially. This is used to show errors
   * that occurred during earlier screens and which usually can be resolved
   * in the settings screen.
   */
  initialError: ReactElement | null;
};
/**
 * The "homepage" of settings; allows the user to perform some basic activities
 * and navigate to other settings pages.
 */
export const SettingsHome = ({
  onBack,
  onGotoUpgrade,
  state,
  initialError,
}: SettingsHomeProps): ReactElement => {
  const [error, setError] = useState(initialError);
  const [invitingFriends, setInvitingFriends] = useState(false);
  const loginContext = useContext(LoginContext);
  const [modal, setModal] = useState<ReactElement | null>(null);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onInviteFriends = useCallback(async () => {
    if (loginContext.state !== 'logged-in') {
      return;
    }

    if (invitingFriends) {
      return;
    }

    setError(null);
    setInvitingFriends(true);
    try {
      const response = await apiFetch(
        '/api/1/referral/user_daily_event_invites/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: '{}',
        },
        loginContext
      );

      if (!response.ok) {
        throw response;
      }

      const data: { url: string; is_plus_link: boolean } = await response.json();
      const text = "Join Oseh so we can do mindfulness journey's together.";
      const url = data.url;

      await Share.share(
        Platform.select({
          ios: {
            message: text,
            url: url,
          },
          default: {
            message: `${text} ${url}`,
          },
        })
      );
    } catch (e) {
      setError(await describeError(e));
    } finally {
      setInvitingFriends(false);
    }
  }, [loginContext, invitingFriends]);

  const onContactSupport = useCallback(async () => {
    if (loginContext.state !== 'logged-in') {
      return;
    }

    setError(null);
    try {
      await Linking.openURL(
        'mailto:hi@oseh.com?' +
          new URLSearchParams({
            subject: 'Oseh Support',
            body: `My account email is ${loginContext.userAttributes?.email} and my user ID is ${loginContext.userAttributes?.sub}. The issue is `,
          })
      );
    } catch (e) {
      setError(await describeError(e));
    }
  }, [loginContext]);

  const onLogout = useCallback(() => {
    if (loginContext.state !== 'logged-in') {
      return;
    }

    setError(null);
    loginContext.setAuthTokens(null);
  }, [loginContext]);

  const onGotoPrivacyPolicy = useCallback(async () => {
    setError(null);
    try {
      await Linking.openURL('https://oseh.com/privacy');
    } catch (e) {
      setError(await describeError(e));
    }
  }, []);

  const onGotoTerms = useCallback(async () => {
    setError(null);
    try {
      await Linking.openURL('https://oseh.com/terms');
    } catch (e) {
      setError(await describeError(e));
    }
  }, []);

  const handleUnsubscribeSuccess = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="You are no longer subscribed to Oseh+."
          body="You may continue to have access for a short period of time."
          ctas={[
            {
              text: 'Okay',
              onPress: () => setModal(null),
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, []);

  const handleUnsubscribeNoActiveSubscription = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title={`You${RSQUO}ve already cancelled your subscription to Oseh+`}
          body="You do not have a recurring subscription. Access will end after your current billing period."
          ctas={[
            {
              text: 'Okay',
              onPress: () => setModal(null),
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, []);

  const handleUnsubscribeWithApple = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="To unsubscribe from Oseh+"
          body="Visit the App Store > Settings > Subscriptions > Oseh > Cancel subscription."
          ctas={[
            {
              text: 'Okay',
              onPress: () => setModal(null),
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, []);

  const handleUnsubscribeWithPromo = useCallback(async () => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="You do not have an active subscription."
          body="You were gifted free access and are currently not being charged."
          ctas={[
            {
              text: 'Okay',
              onPress: () => setModal(null),
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, []);

  const doUnsubscribe = useCallback(async () => {
    if (loginContext.state !== 'logged-in') {
      return;
    }

    setUnsubscribing(true);
    const minTimePromise = new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      const response = await apiFetch(
        '/api/1/users/me/subscription',
        {
          method: 'DELETE',
        },
        loginContext
      );

      if (!response.ok) {
        throw response;
      }

      await minTimePromise;
      handleUnsubscribeSuccess();
    } catch (e) {
      if (e instanceof TypeError) {
        setError(await describeError(e));
      } else if (e instanceof Response) {
        if (e.status === 409) {
          const body = await e.json();
          if (body.type === 'no_active_subscription') {
            await minTimePromise;
            handleUnsubscribeNoActiveSubscription();
          } else if (body.type === 'has_active_ios_subscription') {
            await minTimePromise;
            handleUnsubscribeWithApple();
          } else if (body.type === 'has_active_promotional_subscription') {
            await minTimePromise;
            handleUnsubscribeWithPromo();
          } else {
            console.error('unexpected 409 for deleting account:', body);
            setError(
              <ErrorBanner>
                <ErrorBannerText>E73G9F: Contact hi@oseh.com for assistance.</ErrorBannerText>
              </ErrorBanner>
            );
          }
        } else {
          console.error('unexpected response for deleting account:', e);
          setError(await describeError(e));
        }
      } else {
        console.error('unexpected error for deleting account:', e);
        setError(await describeError(e));
      }
    } finally {
      setUnsubscribing(false);
    }
  }, [
    loginContext,
    handleUnsubscribeNoActiveSubscription,
    handleUnsubscribeWithApple,
    handleUnsubscribeWithPromo,
    handleUnsubscribeSuccess,
  ]);

  const onUnsubscribeOsehPlus = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="Are you sure you want to unsubscribe from Oseh+?"
          body="By unsubscribing, you will lose access to Oseh+ including choosing your own journeys, unlocking more classes each day, and inviting friends for free."
          ctas={[
            {
              text: 'Not Now',
              onPress: () => setModal(null),
            },
            {
              text: 'Unsubscribe',
              onPress: doUnsubscribe,
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, [doUnsubscribe]);

  const handleDeleteStripeRef = useRef<() => void>(() => {
    /* noop */
  });
  const handleDeleteGoogleRef = useRef<() => void>(() => {
    /* noop */
  });
  const handleDeletePromoRef = useRef<() => void>(() => {
    /* noop */
  });
  const handleDeleteAppleRef = useRef<() => void>(() => {
    /* noop */
  });

  const deleteAccount = useCallback(
    async (force: boolean): Promise<void> => {
      if (loginContext.state !== 'logged-in') {
        return;
      }

      try {
        const response = await apiFetch(
          `/api/1/users/me/account?${new URLSearchParams({ force: force ? '1' : '0' })}`,
          {
            method: 'DELETE',
          },
          loginContext
        );

        if (!response.ok) {
          if (!force && response.status === 409) {
            const body: {
              type:
                | 'has_active_stripe_subscription'
                | 'has_active_ios_subscription'
                | 'has_active_google_subscription'
                | 'has_active_promotional_subscription';
            } = await response.json();
            if (body.type === 'has_active_stripe_subscription') {
              handleDeleteStripeRef.current();
              return;
            } else if (body.type === 'has_active_ios_subscription') {
              handleDeleteAppleRef.current();
              return;
            } else if (body.type === 'has_active_google_subscription') {
              handleDeleteGoogleRef.current();
              return;
            } else if (body.type === 'has_active_promotional_subscription') {
              handleDeletePromoRef.current();
              return;
            } else {
              console.log('Unknown conflict type', body.type);
              setError(
                <ErrorBanner>
                  <ErrorBannerText>E_A7015: Contact hi@oseh.com for assistance.</ErrorBannerText>
                </ErrorBanner>
              );
              return;
            }
          }
          throw response;
        }

        await loginContext.setAuthTokens(null);
      } catch (e) {
        console.error(e);
        const err = await describeError(e);
        setError(err);
      }
    },
    [loginContext]
  );

  const forceDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await deleteAccount(true);
    } finally {
      setDeleting(false);
    }
  }, [deleteAccount]);

  const handleDeleteStripe = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="Are you sure you want to cancel your subscription?"
          body="By unsubscribing, you will lose access to Oseh+ including choosing your own journeys, unlocking more classes each day, and inviting friends for free."
          ctas={[
            {
              text: 'Cancel',
              onPress: () => setModal(null),
            },
            {
              text: 'Delete my account',
              onPress: forceDeleteAccount,
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, [forceDeleteAccount]);
  handleDeleteStripeRef.current = handleDeleteStripe;

  const handleDeleteGoogle = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="To unsubscribe from Oseh+"
          body="Open the Google Play app, at the top right, tap the profile icon, tap Payments & subscriptions > Subscriptions, select the subcription you want to cancel, tap Cancel subscription, and follow the instructions."
          ctas={[
            {
              text: 'Cancel',
              onPress: () => setModal(null),
            },
            {
              text: 'Delete my account',
              onPress: forceDeleteAccount,
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, [forceDeleteAccount]);
  handleDeleteGoogleRef.current = handleDeleteGoogle;

  const handleDeletePromo = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="You do not have an active subscription."
          body="You were gifted free access and are currently not being charged."
          ctas={[
            {
              text: 'Cancel',
              onPress: () => setModal(null),
            },
            {
              text: 'Delete my account',
              onPress: forceDeleteAccount,
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, [forceDeleteAccount]);
  handleDeletePromoRef.current = handleDeletePromo;

  const handleDeleteApple = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="To unsubscribe from Oseh+"
          body="Visit the App Store > Settings > Subscriptions > Oseh > Cancel subscription."
          ctas={[
            {
              text: 'Cancel',
              onPress: () => setModal(null),
            },
            {
              text: 'Delete my account',
              onPress: forceDeleteAccount,
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, [forceDeleteAccount]);
  handleDeleteAppleRef.current = handleDeleteApple;

  const doDeleteAccount = useCallback(async () => {
    setModal(null);

    setDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await deleteAccount(false);
    } finally {
      setDeleting(false);
    }
  }, [deleteAccount]);

  const onDeleteAccount = useCallback(() => {
    setModal(
      <SimpleModalContainer onDismiss={() => setModal(null)}>
        <PromptContainer
          title="Are you sure you want to delete your account?"
          body="By deleting your account, all your progress and history will be permanently lost. If you have a subscription, we recommend you manually unsubscribe prior to deleting your account."
          ctas={[
            {
              text: 'Not Now',
              onPress: () => setModal(null),
            },
            {
              text: 'Delete',
              onPress: doDeleteAccount,
            },
          ]}
        />
      </SimpleModalContainer>
    );
  }, [doDeleteAccount]);

  const onUpgradePress = useCallback(() => {
    onGotoUpgrade();
  }, [onGotoUpgrade]);

  if (!state.loaded || unsubscribing || deleting) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      {error}

      <CloseButton onPress={onBack} />

      <Pressable style={styles.bigLinkWrapper} onPress={onInviteFriends}>
        <Text style={styles.bigLink}>Invite friends</Text>
      </Pressable>
      {!state.isOsehPlus && (
        <Pressable style={styles.bigLinkWrapper} onPress={onUpgradePress}>
          <Text style={styles.bigLink}>Upgrade to Oseh+</Text>
        </Pressable>
      )}
      <Pressable onPress={onContactSupport} style={styles.bigLinkWrapper}>
        <Text style={styles.bigLink}>Contact Support</Text>
      </Pressable>
      <Pressable onPress={onLogout} style={styles.bigLinkWrapper}>
        <Text style={styles.bigLink}>Logout</Text>
      </Pressable>
      <Pressable onPress={onGotoPrivacyPolicy} style={styles.firstSmallLinkWrapper}>
        <Text style={styles.smallLink}>Privacy Policy</Text>
      </Pressable>
      <Pressable onPress={onGotoTerms} style={styles.smallLinkWrapper}>
        <Text style={styles.smallLink}>Terms & Conditions</Text>
      </Pressable>
      {state.isOsehPlus && (
        <Pressable onPress={onUnsubscribeOsehPlus} style={styles.smallLinkWrapper}>
          <Text style={styles.smallLink}>Unsubscribe Oseh+</Text>
        </Pressable>
      )}
      <Pressable onPress={onDeleteAccount} style={styles.smallLinkWrapper}>
        <Text style={styles.smallLink}>Delete Account</Text>
      </Pressable>
      {!state.isOsehPlus && (
        <View style={styles.smallLinkWrapper}>
          <Text style={styles.smallLink}>Restore Purchase</Text>
        </View>
      )}

      {modal}
      <StatusBar style="light" />
    </View>
  );
};
