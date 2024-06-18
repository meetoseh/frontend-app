import { ReactElement, useCallback, useMemo } from 'react';
import { CustomPop, ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { SettingsResources } from './SettingsResources';
import { SettingsMappedParams } from './SettingsParams';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { screenOut } from '../../lib/screenOut';
import {
  MappedValueWithCallbacksOpts,
  useMappedValueWithCallbacks,
} from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { SettingLink, SettingsLinks } from './components/SettingLinks';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { useHandleDeleteAccount } from './hooks/useHandleDeleteAccount';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { SettingSection } from './components/SettingSection';
import { Identity } from './hooks/useIdentities';
import { useManageConnectWithProvider } from './hooks/useManageConnectWithProvider';
import { OauthProvider } from '../../../login/lib/OauthProvider';
import { styles } from './SettingsStyles';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { View, Text, Platform } from 'react-native';
import Wordmark from '../../../../shared/icons/Wordmark';
import {
  GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT,
  GridSimpleNavigationForeground,
} from '../../../../shared/components/GridSimpleNavigationForeground';
import Constants from 'expo-constants';
import { trackMerge } from './lib/trackMerge';
import {
  Entitlement,
  entitlementKeyMap,
} from './lib/createEntitlementRequestHandler';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import Purchases from 'react-native-purchases';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';
import { showYesNoModal } from '../../../../shared/lib/showYesNoModal';

const isDevelopment = Constants.expoConfig?.extra?.environment === 'dev';

const entrance: StandardScreenTransition = { type: 'fade', ms: 350 };
const exit: StandardScreenTransition = { type: 'fade', ms: 350 };
/**
 * The setting screen, where the user can navigate to a bunch of long-tail
 * screens like updating their notification settings, etc
 */
export const Settings = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'settings',
  SettingsResources,
  SettingsMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const handleDeleteAccount = useHandleDeleteAccount(
    ctx.login,
    { modals },
    errorVWC
  );
  const mergeError = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );

  useErrorModal(modals, errorVWC, 'settings');
  useErrorModal(modals, mergeError, 'merge account in settings');

  const transition = useTransitionProp(
    (): StandardScreenTransition => entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const makeTriggerLink = ({
    key,
    text,
    trigger,
  }: {
    key: string;
    text: string;
    trigger: string | null;
  }): SettingLink => ({
    text,
    key,
    onClick: () => {
      trace({ type: 'trigger-link', key, text, trigger });
      screenOut(workingVWC, startPop, transition, exit, trigger);
      return undefined;
    },
  });

  const myLibraryLink = useWritableValueWithCallbacks(() =>
    makeTriggerLink({
      text: 'My Library',
      key: 'my-library',
      trigger: screen.parameters.history.trigger,
    })
  );

  const logoutLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: 'Logout',
      key: 'logout',
      onClick: () => {
        const loginContextUnch = ctx.login.value.get();
        if (loginContextUnch.state === 'logged-in') {
          ctx.login.setAuthTokens(null);
          ctx.resources.expoTokenSyncHandler.evictAll();
        }
        return new Promise(() => {});
      },
    })
  );
  const upgradeLink = useMappedValueWithCallbacks(
    resources.pro,
    (entitlement): SettingLink | null =>
      entitlement !== null && !entitlement.isActive
        ? makeTriggerLink({
            key: 'upgrade',
            text: 'Upgrade to Oseh+',
            trigger: screen.parameters.upgrade.trigger,
          })
        : null
  );
  const manageMembershipLink = useMappedValueWithCallbacks(
    resources.pro,
    (entitlement): SettingLink | null =>
      entitlement?.isActive
        ? makeTriggerLink({
            key: 'manage-membership',
            text: 'Manage Membership',
            trigger: screen.parameters.membership.trigger,
          })
        : null
  );
  const accountLinks = useMemo(
    () => [upgradeLink, myLibraryLink, manageMembershipLink, logoutLink],
    [upgradeLink, myLibraryLink, manageMembershipLink, logoutLink]
  );

  const remindersLink = useWritableValueWithCallbacks(() =>
    makeTriggerLink({
      text: 'Reminders',
      key: 'edit-reminders',
      trigger: screen.parameters.reminders.trigger,
    })
  );
  const setGoalLink = useWritableValueWithCallbacks(() =>
    makeTriggerLink({
      text: 'Edit Goal',
      key: 'edit-goal',
      trigger: screen.parameters.goal.trigger,
    })
  );

  const settingsLinks = useMemo(
    () => [remindersLink, setGoalLink],
    [remindersLink, setGoalLink]
  );

  const restorePurchasesErrorVWC =
    useWritableValueWithCallbacks<ReactElement | null>(() => null);
  useErrorModal(modals, restorePurchasesErrorVWC, 'restore-purchases');
  const restorePurchasesLink = useMappedValueWithCallbacks(
    resources.pro,
    (pro: Entitlement | null): SettingLink => ({
      text: 'Restore Purchases',
      details:
        pro === null
          ? ['Loading...']
          : pro.isActive
          ? ['Currently have Oseh+ access']
          : ['No Oseh+ access currently'],
      key: 'restore-purchases',
      onClick: async () => {
        trace({
          type: 'restore-purchases',
          technique: 'revenuecat',
          step: 'initializing..',
        });

        const user = ctx.login.value.get();
        if (user.state !== 'logged-in') {
          trace({
            type: 'restore-purchases',
            technique: 'revenuecat',
            step: 'not-logged-in',
          });
          return;
        }

        const response = await apiFetch(
          '/api/1/users/me/revenue_cat_id',
          {
            method: 'GET',
          },
          user
        );
        if (!response.ok) {
          throw response;
        }
        const data: { revenue_cat_id: string } = await response.json();
        const revenueCatID = data.revenue_cat_id;
        trace({
          type: 'restore-purchases',
          technique: 'revenuecat',
          step: 'configuring',
          revenueCatID,
        });

        const apiKey = Platform.select({
          ios: 'appl_iUUQsQeQYmaFsfylOIVhryaoUNa',
          android: 'goog_ykJYeTeXNtUcUZkeqfTOxGTBicI',
          default: undefined,
        });
        if (apiKey === undefined) {
          throw new Error('not implemented');
        }
        Purchases.configure({
          apiKey,
          appUserID: revenueCatID,
          // Not necessary to enforce entitlements client-side as we don't unlock any
          // client-side behavior
          entitlementVerificationMode:
            Purchases.ENTITLEMENT_VERIFICATION_MODE.DISABLED,
        });
        trace({
          type: 'restore-purchases',
          technique: 'revenuecat',
          step: 'restoring',
        });
        const newInfo = await Purchases.restorePurchases();
        const rcThinksHavePro = !!newInfo?.entitlements?.active?.pro?.isActive;
        trace({
          type: 'restore-purchases',
          technique: 'revenuecat',
          step: 'syncing',
          rcThinksHavePro,
        });

        const osehResponse = await apiFetch(
          '/api/1/users/me/entitlements/pro',
          {
            method: 'GET',
            headers: {
              pragma: 'no-cache',
            },
          },
          user
        );
        if (!response.ok) {
          throw response;
        }
        const dataRaw = await osehResponse.json();
        const pro = convertUsingMapper(dataRaw, entitlementKeyMap);
        trace({
          type: 'restore-purchases',
          technique: 'revenuecat',
          step: 'finalizing',
          osehThinksHavePro: pro.isActive,
        });
        ctx.resources.entitlementsHandler.evictOrReplace(
          { user, entitlement: 'pro' },
          () => ({
            type: 'data',
            data: pro,
          })
        );
        ctx.resources.seriesListHandler.evictAll();
        ctx.resources.seriesJourneysHandler.evictAll();

        await showYesNoModal(modals, {
          title: 'Restore Purchases',
          body: 'Your purchases have been restored.',
          cta1: 'OK',
          emphasize: 1,
        }).promise;
        return undefined;
      },
    })
  );

  const supportUrl = 'mailto:hi@oseh.com';
  const contactSupportLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: 'Contact Support',
      key: 'contact-support',
      onClick:
        screen.parameters.support.trigger === null
          ? supportUrl
          : async () => {
              trace({ type: 'contact-support', technique: 'trigger' });
              screenOut(
                workingVWC,
                startPop,
                transition,
                exit,
                screen.parameters.support.trigger
              );
            },
      onLinkClick: () => {
        trace({
          type: 'contact-support',
          technique: 'mailto',
          url: supportUrl,
        });
      },
    })
  );

  const privacyPolicyLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: 'Privacy Policy',
      key: 'privacy-policy',
      onClick: screen.parameters.privacy.url,
      onLinkClick: () => {
        trace({
          type: 'privacy-policy',
          technique: 'link',
          url: screen.parameters.privacy.url,
        });
      },
    })
  );

  const termsAndConditionsLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: 'Terms & Conditions',
      key: 'terms-and-conditions',
      onClick: screen.parameters.terms.url,
      onLinkClick: () => {
        trace({
          type: 'terms-and-conditions',
          technique: 'link',
          url: screen.parameters.terms.url,
        });
      },
    })
  );

  const deleteAccountLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: 'Delete Account',
      key: 'delete-account',
      onClick: () => {
        trace({ type: 'delete-account', technique: 'modal' });
        handleDeleteAccount();
        return undefined;
      },
    })
  );

  const supportLinks = useMemo(
    () => [
      restorePurchasesLink,
      contactSupportLink,
      privacyPolicyLink,
      termsAndConditionsLink,
      deleteAccountLink,
    ],
    [
      restorePurchasesLink,
      contactSupportLink,
      privacyPolicyLink,
      termsAndConditionsLink,
      deleteAccountLink,
    ]
  );

  const manageConnectWithProvider = useManageConnectWithProvider({
    mergeError,
    modals,
    onSecureLoginCompleted: (mergeToken) => {
      if (mergeToken === null) {
        return;
      }
      screenOut(workingVWC, startPop, transition, exit, CustomPop, {
        endpoint: '/api/1/users/me/screens/empty_with_merge_token',
        parameters: {
          merge_token: mergeToken,
        },
        afterDone: () => {
          trackMerge(ctx);
        },
      });
    },
  });

  const getLinkForProvider = useCallback(
    (
      identities: Identity[] | null,
      provider: OauthProvider,
      name: string
    ): SettingLink | null => {
      if (provider === 'Dev' && !isDevelopment) {
        return null;
      }

      const key = `connect-via-${provider}`;
      if (identities === null) {
        return {
          text: `Connect ${name}`,
          details: ['Loading...'],
          key,
          onClick: () => manageConnectWithProvider(provider, name),
        };
      }

      const providerIdentities = identities.filter(
        (i) => i.provider === provider
      );

      if (providerIdentities.length === 0) {
        return {
          text: `Connect ${name}`,
          key,
          onClick: () => manageConnectWithProvider(provider, name),
        };
      }

      return {
        text: `Connected with ${name}`,
        key,
        details: providerIdentities.map((i) => i.email ?? 'unknown'),
        onClick: () => manageConnectWithProvider(provider, name),
        action: 'none',
      };
    },
    [manageConnectWithProvider]
  );

  const identityOpts: MappedValueWithCallbacksOpts<
    Identity[] | null,
    SettingLink | null
  > = {
    inputEqualityFn: Object.is,
  };

  const identityDirectLink = useMappedValueWithCallbacks(
    resources.identities,
    (r) => getLinkForProvider(r, 'Direct', 'Email'),
    identityOpts
  );

  const identityGoogleLink = useMappedValueWithCallbacks(
    resources.identities,
    (r) => getLinkForProvider(r, 'Google', 'Sign in with Google'),
    identityOpts
  );

  const identityAppleLink = useMappedValueWithCallbacks(
    resources.identities,
    (r) => getLinkForProvider(r, 'SignInWithApple', 'Sign in with Apple'),
    identityOpts
  );

  const identityDevLink = useMappedValueWithCallbacks(
    resources.identities,
    (r) => getLinkForProvider(r, 'Dev', 'Dev'),
    identityOpts
  );

  const identityLinks = useMemo(
    () => [
      identityDirectLink,
      identityGoogleLink,
      identityAppleLink,
      identityDevLink,
    ],
    [identityDirectLink, identityGoogleLink, identityAppleLink, identityDevLink]
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
      statusBar
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={40} />
        <SettingSection title="Account">
          <SettingsLinks links={accountLinks} />
        </SettingSection>
        <VerticalSpacer height={24} />
        <SettingSection title="Logins">
          <SettingsLinks links={identityLinks} />
        </SettingSection>
        <VerticalSpacer height={24} />
        <SettingSection title="Settings">
          <SettingsLinks links={settingsLinks} />
        </SettingSection>
        <VerticalSpacer height={24} />
        <SettingSection title="Support">
          <SettingsLinks links={supportLinks} />
        </SettingSection>
        <VerticalSpacer height={32} />
        <View style={styles.footer}>
          <Wordmark width={98} height={24} />
          <VerticalSpacer height={8} />
          <Text style={styles.version}>
            {Constants.expoConfig?.version || 'development'}
          </Text>
        </View>
        <VerticalSpacer
          height={GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT + 32}
        />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <GridSimpleNavigationForeground
        workingVWC={workingVWC}
        startPop={startPop}
        gridSize={ctx.windowSizeImmediate}
        transitionState={transitionState}
        transition={transition}
        trace={trace}
        home={{
          trigger: screen.parameters.home.trigger,
          exit: { type: 'fade', ms: 350 },
        }}
        series={{
          trigger: screen.parameters.series.trigger,
          exit: { type: 'fade', ms: 350 },
        }}
        topBarHeight={ctx.topBarHeight}
        botBarHeight={ctx.botBarHeight}
        account={null}
        noTop
      />
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};