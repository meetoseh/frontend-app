import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import {
  MappedValueWithCallbacksOpts,
  useMappedValueWithCallbacks,
} from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { FeatureComponentProps } from "../../models/Feature";
import { SettingsResources } from "./SettingsResources";
import { SettingsState } from "./SettingsState";
import { styles } from "./SettingsStyles";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { ReactElement, useCallback, useContext, useMemo } from "react";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { useErrorModal } from "../../../../shared/hooks/useErrorModal";
import {
  ModalContextValue,
  Modals,
  ModalsOutlet,
} from "../../../../shared/contexts/ModalContext";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CloseButton } from "../../../../shared/components/CloseButton";
import { STANDARD_BLACK_GRAY_GRADIENT_SVG } from "../../../../styling/colors";
import { FullscreenView } from "../../../../shared/components/FullscreenView";
import { SvgLinearGradientBackground } from "../../../../shared/anim/SvgLinearGradientBackground";
import { useContentWidth } from "../../../../shared/lib/useContentWidth";
import { useHandleDeleteAccount } from "./hooks/useHandleDeleteAccount";
import { SettingLink, SettingsLinks } from "./components/SettingLinks";
import { SettingSection } from "./components/SettingSection";
import Wordmark from "../../../../shared/icons/Wordmark";
import Constants from "expo-constants";
import { useManageConnectWithProvider } from "./hooks/useManageConnectWithProvider";
import { MergeProvider } from "../mergeAccount/MergeAccountState";
import { deleteJourneyFeedbackRequestReviewStoredState } from "../../../journey/lib/JourneyFeedbackRequestReviewStore";

/**
 * Shows a basic settings screen for the user. Requires a login context and a modal
 * context.
 */
export const Settings = ({
  state,
  resources,
}: FeatureComponentProps<SettingsState, SettingsResources>) => {
  const loginContext = useContext(LoginContext);
  const modals = useWritableValueWithCallbacks((): Modals => []);
  const modalContext: ModalContextValue = useMemo(() => ({ modals }), [modals]);
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const mergeError = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const handleDeleteAccount = useHandleDeleteAccount(
    loginContext,
    modalContext,
    errorVWC,
    () => state.get().setShow(false, true)
  );

  useErrorModal(modalContext.modals, errorVWC, "settings");
  useErrorModal(modalContext.modals, mergeError, "merge account in settings");

  const onClickX = useCallback(() => {
    state.get().setShow(false, true);
  }, [state]);

  const myLibraryLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: "My Library",
      key: "my-library",
      onClick: () => {
        resources.get().gotoMyLibrary();
        return undefined;
      },
    })
  );

  const logoutLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: "Logout",
      key: "logout",
      onClick: () => {
        if (loginContext.state === "logged-in") {
          deleteJourneyFeedbackRequestReviewStoredState();
          loginContext.setAuthTokens(null);
          // a delay is an easy way to avoid flashing the homescreen while
          // logout finishes as contexts are slower than setShow
          setTimeout(() => state.get().setShow(false, true), 1000);
        }
        return new Promise(() => {});
      },
    })
  );

  const accountLinks = useMemo(
    () => [myLibraryLink, logoutLink],
    [myLibraryLink, logoutLink]
  );

  const remindersLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: "Reminders",
      key: "edit-reminders",
      onClick: () => {
        resources.get().gotoEditReminderTimes();
        return undefined;
      },
    })
  );

  const settingsLinks = useMemo(() => [remindersLink], [remindersLink]);

  const contactSupportLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: "Contact Support",
      key: "contact-support",
      onClick: "mailto:hi@oseh.com",
    })
  );

  const privacyPolicyLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: "Privacy Policy",
      key: "privacy-policy",
      onClick: "https://www.oseh.com/privacy",
    })
  );

  const termsAndConditionsLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: "Terms & Conditions",
      key: "terms-and-conditions",
      onClick: "https://www.oseh.com/terms",
    })
  );

  const deleteAccountLink = useWritableValueWithCallbacks(
    (): SettingLink => ({
      text: "Delete Account",
      key: "delete-account",
      onClick: () => {
        handleDeleteAccount();
        return undefined;
      },
    })
  );

  const supportLinks = useMemo(
    () => [
      contactSupportLink,
      privacyPolicyLink,
      termsAndConditionsLink,
      deleteAccountLink,
    ],
    [
      contactSupportLink,
      privacyPolicyLink,
      termsAndConditionsLink,
      deleteAccountLink,
    ]
  );

  const manageConnectWithProvider = useManageConnectWithProvider({
    resources,
    mergeError,
    modals: modalContext.modals,
  });

  const getLinkForProvider = useCallback(
    (
      r: SettingsResources,
      provider: MergeProvider,
      name: string
    ): SettingLink | null => {
      if (
        provider === "Dev" &&
        Constants.expoConfig?.extra?.environment !== "dev"
      ) {
        return null;
      }

      const key = `connect-via-${provider}`;
      if (r.identities.type !== "success") {
        return {
          text: `Connect ${name}`,
          details:
            r.identities.type === "error" ? ["An error occurred"] : undefined,
          key,
          onClick: () => manageConnectWithProvider(provider, name),
        };
      }

      const providerIdentities = r.identities.identities.filter(
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
        details: providerIdentities.map((i) => i.email ?? "unknown"),
        onClick: () => manageConnectWithProvider(provider, name),
        action: "none",
      };
    },
    [manageConnectWithProvider]
  );

  const identityOpts: MappedValueWithCallbacksOpts<
    SettingsResources,
    SettingLink | null
  > = {
    inputEqualityFn: (a, b) => Object.is(a.identities, b.identities),
  };

  const identityDirectLink = useMappedValueWithCallbacks(
    resources,
    (r) => getLinkForProvider(r, "Direct", "Email"),
    identityOpts
  );

  const identityGoogleLink = useMappedValueWithCallbacks(
    resources,
    (r) => getLinkForProvider(r, "Google", "Sign in with Google"),
    identityOpts
  );

  const identityAppleLink = useMappedValueWithCallbacks(
    resources,
    (r) => getLinkForProvider(r, "SignInWithApple", "Sign in with Apple"),
    identityOpts
  );

  const identityDevLink = useMappedValueWithCallbacks(
    resources,
    (r) => getLinkForProvider(r, "Dev", "Dev"),
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

  const contentWidth = useContentWidth();

  return (
    <RenderGuardedComponent
      props={useMappedValueWithCallbacks(resources, (r) => r.loadError)}
      component={(loadError) => {
        if (loadError !== null) {
          return (
            <FullscreenView
              style={{
                ...styles.container,
                backgroundColor: "black",
              }}
            >
              <CloseButton onPress={onClickX} />
              <View style={styles.content}>{loadError}</View>
              <StatusBar style="light" />
            </FullscreenView>
          );
        }

        return (
          <View style={styles.container}>
            <SvgLinearGradientBackground
              state={{
                type: "react-rerender",
                props: STANDARD_BLACK_GRAY_GRADIENT_SVG,
              }}
            >
              <FullscreenView style={styles.background} alwaysScroll>
                <CloseButton onPress={onClickX} />
                <View style={{ ...styles.content, width: contentWidth }}>
                  <View style={styles.sections}>
                    <SettingSection title="Account">
                      <SettingsLinks links={accountLinks} />
                    </SettingSection>
                    <View style={styles.sectionSeparator} />
                    <SettingSection title="Logins">
                      <SettingsLinks links={identityLinks} />
                    </SettingSection>
                    <View style={styles.sectionSeparator} />
                    <SettingSection title="Settings">
                      <SettingsLinks links={settingsLinks} />
                    </SettingSection>
                    <View style={styles.sectionSeparator} />
                    <SettingSection title="Support">
                      <SettingsLinks links={supportLinks} />
                    </SettingSection>
                  </View>
                  <View style={styles.footer}>
                    <Wordmark width={98} height={24} />
                    <Text style={styles.version}>
                      {Constants.manifest?.version || "development"}
                    </Text>
                  </View>
                </View>
              </FullscreenView>
            </SvgLinearGradientBackground>
            <ModalsOutlet modals={modals} />
            <StatusBar style="light" />
          </View>
        );
      }}
    />
  );
};
