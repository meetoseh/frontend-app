import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { FeatureComponentProps } from "../../models/Feature";
import { SettingsResources } from "./SettingsResources";
import { SettingsState } from "./SettingsState";
import { styles } from "./SettingsStyles";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import { ReactElement, useCallback, useContext, useMemo } from "react";
import {
  LoginContext,
  LoginContextValue,
} from "../../../../shared/contexts/LoginContext";
import { setVWC } from "../../../../shared/lib/setVWC";
import { useErrorModal } from "../../../../shared/hooks/useErrorModal";
import {
  ModalContextValue,
  Modals,
  ModalsOutlet,
  addModalWithCallbackToRemove,
} from "../../../../shared/contexts/ModalContext";
import { useTimedValueWithCallbacks } from "../../../../shared/hooks/useTimedValue";
import { useMappedValuesWithCallbacks } from "../../../../shared/hooks/useMappedValuesWithCallbacks";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";
import { InlineOsehSpinner } from "../../../../shared/components/InlineOsehSpinner";
import { View, Text, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { apiFetch } from "../../../../shared/lib/apiFetch";
import { describeError } from "../../../../shared/lib/describeError";
import { ModalWrapper } from "../../../../shared/lib/ModalWrapper";
import {
  ErrorBanner,
  ErrorBannerText,
} from "../../../../shared/components/ErrorBanner";
import * as Linking from "expo-linking";
import { CloseButton } from "../../../../shared/components/CloseButton";
import { STANDARD_BLACK_GRAY_GRADIENT_SVG } from "../../../../styling/colors";
import { FullscreenView } from "../../../../shared/components/FullscreenView";
import { SvgLinearGradientBackground } from "../../../../shared/anim/SvgLinearGradientBackground";
import { useContentWidth } from "../../../../shared/lib/useContentWidth";

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
  const haveProVWC = useMappedValueWithCallbacks(resources, (r) => r.havePro);
  const handleDeleteAccount = useHandleDeleteAccount(
    loginContext,
    modalContext,
    errorVWC
  );
  const handleCancelSubscription = useHandleCancelSubscription(
    loginContext,
    modalContext,
    errorVWC
  );

  const logout = useCallback(() => {
    if (loginContext.state === "logged-in") {
      loginContext.setAuthTokens(null);
      // a delay is an easy way to avoid flashing the homescreen while
      // logout finishes as contexts are slower than setShow
      setTimeout(() => state.get().setShow(false, true), 1000);
    }
  }, [loginContext, state]);

  useErrorModal(modalContext.modals, errorVWC, "settings");

  const onClickX = useCallback(() => {
    state.get().setShow(false, true);
  }, [state]);

  const updateNotificationTimes = useCallback(() => {
    resources.get().gotoEditReminderTimes();
  }, [resources]);

  const onContactSupport = useCallback(() => {
    Linking.openURL("mailto:hi@oseh.com");
  }, []);

  const onClickPrivacyPolicy = useCallback(() => {
    Linking.openURL("https://www.oseh.com/privacy");
  }, []);

  const onClickTerms = useCallback(() => {
    Linking.openURL("https://www.oseh.com/terms");
  }, []);

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
              <FullscreenView style={styles.background}>
                <CloseButton onPress={onClickX} />
                <View style={{ ...styles.content, width: contentWidth }}>
                  <View style={styles.bigLinks}>
                    <Pressable
                      style={styles.bigLinkContainer}
                      onPress={updateNotificationTimes}
                    >
                      <Text style={styles.bigLinkText}>Edit Reminders</Text>
                    </Pressable>
                    <Pressable
                      style={styles.bigLinkContainer}
                      onPress={onContactSupport}
                    >
                      <Text style={styles.bigLinkText}>Contact Support</Text>
                    </Pressable>
                    <Pressable style={styles.bigLinkContainer} onPress={logout}>
                      <Text style={styles.bigLinkText}>Logout</Text>
                    </Pressable>
                  </View>
                  <View style={styles.smallLinks}>
                    <Pressable
                      style={styles.smallLinkContainer}
                      onPress={onClickPrivacyPolicy}
                    >
                      <Text style={styles.smallLinkText}>Privacy Policy</Text>
                    </Pressable>
                    <Pressable
                      style={styles.smallLinkContainer}
                      onPress={onClickTerms}
                    >
                      <Text style={styles.smallLinkText}>
                        Terms & Conditions
                      </Text>
                    </Pressable>
                    <RenderGuardedComponent
                      props={haveProVWC}
                      component={(havePro) => (
                        <>
                          {havePro ? (
                            <Pressable
                              style={styles.smallLinkContainer}
                              onPress={handleCancelSubscription}
                            >
                              <Text style={styles.smallLinkText}>
                                Unsubscribe Oseh+
                              </Text>
                            </Pressable>
                          ) : null}
                        </>
                      )}
                    />
                    <Pressable
                      style={styles.smallLinkContainer}
                      onPress={handleDeleteAccount}
                    >
                      <Text style={styles.smallLinkText}>Delete Account</Text>
                    </Pressable>
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

const useHandleDeleteAccount = (
  loginContext: LoginContextValue,
  modalContext: ModalContextValue,
  errorVWC: WritableValueWithCallbacks<ReactElement | null>
): (() => void) => {
  const showDeleteConfirmInitialPromptVWC = useWritableValueWithCallbacks(
    () => false
  );
  const showDeleteConfirmApplePromptVWC = useWritableValueWithCallbacks(
    () => false
  );
  const showDeleteConfirmGooglePromptVWC = useWritableValueWithCallbacks(
    () => false
  );
  const showDeleteConfirmStripePromptVWC = useWritableValueWithCallbacks(
    () => false
  );
  const showDeleteConfirmPromoPromptVWC = useWritableValueWithCallbacks(
    () => false
  );

  const deleteAccount = useCallback(
    async (force: boolean): Promise<void> => {
      if (loginContext.state !== "logged-in") {
        setVWC(
          errorVWC,
          <ErrorBanner>
            <ErrorBannerText>Try logging in again first.</ErrorBannerText>
          </ErrorBanner>
        );
        return;
      }

      try {
        const response = await apiFetch(
          `/api/1/users/me/account?${new URLSearchParams({
            force: force ? "1" : "0",
          })}`,
          {
            method: "DELETE",
          },
          loginContext
        );

        if (!response.ok) {
          if (!force && response.status === 409) {
            const body: {
              type:
                | "has_active_stripe_subscription"
                | "has_active_ios_subscription"
                | "has_active_google_subscription"
                | "has_active_promotional_subscription";
            } = await response.json();
            if (body.type === "has_active_stripe_subscription") {
              setVWC(showDeleteConfirmStripePromptVWC, true);
              return;
            } else if (body.type === "has_active_ios_subscription") {
              setVWC(showDeleteConfirmApplePromptVWC, true);
              return;
            } else if (body.type === "has_active_google_subscription") {
              setVWC(showDeleteConfirmGooglePromptVWC, true);
              return;
            } else if (body.type === "has_active_promotional_subscription") {
              setVWC(showDeleteConfirmPromoPromptVWC, true);
              return;
            } else {
              console.log("Unknown conflict type", body.type);
              setVWC(
                errorVWC,
                <ErrorBanner>
                  <ErrorBannerText>
                    E_A7015: Contact hi@oseh.com for assistance.
                  </ErrorBannerText>
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
        setVWC(errorVWC, err);
      }
    },
    [
      loginContext,
      errorVWC,
      showDeleteConfirmApplePromptVWC,
      showDeleteConfirmGooglePromptVWC,
      showDeleteConfirmPromoPromptVWC,
      showDeleteConfirmStripePromptVWC,
    ]
  );

  useValueWithCallbacksEffect(
    showDeleteConfirmInitialPromptVWC,
    (showDeleteConfirmInitialPrompt) => {
      if (loginContext.state !== "logged-in") {
        return;
      }

      if (!showDeleteConfirmInitialPrompt) {
        return;
      }

      const onDelete = async () => {
        try {
          await deleteAccount(false);
        } finally {
          setVWC(showDeleteConfirmInitialPromptVWC, false);
        }
      };

      const onCancel = async () =>
        setVWC(showDeleteConfirmInitialPromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="Are you sure you want to delete your account?"
            body={
              <Text style={styles.deleteConfirmBody}>
                By deleting your account, all your progress and history will be
                permanently lost. If you have a subscription, we recommend you
                manually unsubscribe prior to deleting your account.
              </Text>
            }
            cta="Delete"
            cancelCta="Not Now"
            onConfirm={onDelete}
            onCancel={onCancel}
            flipButtons
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showDeleteConfirmApplePromptVWC,
    (showDeleteConfirmApplePrompt) => {
      if (!showDeleteConfirmApplePrompt) {
        return;
      }

      const onDelete = async () => {
        try {
          await deleteAccount(true);
        } finally {
          setVWC(showDeleteConfirmApplePromptVWC, false);
        }
      };

      const onCancel = () => setVWC(showDeleteConfirmApplePromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="To unsubscribe from Oseh+"
            body={
              <Text style={styles.deleteConfirmBody}>
                Visit the App Store &gt; Settings &gt; Subscriptions &gt; Oseh
                &gt; Cancel subscription.
              </Text>
            }
            cta="Delete my account"
            cancelCta="Cancel"
            onConfirm={onDelete}
            onCancel={onCancel}
            flipButtons
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showDeleteConfirmGooglePromptVWC,
    (showDeleteConfirmGooglePrompt) => {
      if (!showDeleteConfirmGooglePrompt) {
        return;
      }

      const onDelete = async () => {
        try {
          await deleteAccount(true);
        } finally {
          setVWC(showDeleteConfirmGooglePromptVWC, false);
        }
      };

      const onCancel = () => setVWC(showDeleteConfirmGooglePromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="To unsubscribe from Oseh+"
            body={
              <Text style={styles.deleteConfirmBody}>
                Open the Google Play app, at the top right, tap the profile
                icon, tap Payments & subscriptions &gt; Subscriptions, select
                the subcription you want to cancel, tap Cancel subscription, and
                follow the instructions.
              </Text>
            }
            cta="Delete my account"
            cancelCta="Cancel"
            onConfirm={onDelete}
            onCancel={onCancel}
            flipButtons
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showDeleteConfirmStripePromptVWC,
    (showDeleteConfirmStripePrompt) => {
      if (!showDeleteConfirmStripePrompt) {
        return;
      }

      const onDelete = async () => {
        try {
          await deleteAccount(true);
        } finally {
          setVWC(showDeleteConfirmStripePromptVWC, false);
        }
      };

      const onCancel = () => setVWC(showDeleteConfirmStripePromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="Are you sure you want to cancel your subscription?"
            body={
              <Text style={styles.deleteConfirmBody}>
                By unsubscribing, you will lose access to Oseh+.
              </Text>
            }
            cta="Unsubscribe and Delete Account"
            cancelCta="Cancel"
            onConfirm={onDelete}
            onCancel={onCancel}
            flipButtons
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showDeleteConfirmPromoPromptVWC,
    (showDeleteConfirmPromoPrompt) => {
      if (!showDeleteConfirmPromoPrompt) {
        return;
      }

      const onDelete = async () => {
        try {
          await deleteAccount(true);
        } finally {
          setVWC(showDeleteConfirmPromoPromptVWC, false);
        }
      };

      const onCancel = () => setVWC(showDeleteConfirmPromoPromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="You do not have an active subscription."
            body={
              <Text style={styles.deleteConfirmBody}>
                You were gifted free access and are currently not being charged.
              </Text>
            }
            cta="Delete my account"
            cancelCta="Cancel"
            onConfirm={onDelete}
            onCancel={onCancel}
            flipButtons
          />
        </ModalWrapper>
      );
    }
  );

  return useCallback(() => {
    setVWC(showDeleteConfirmInitialPromptVWC, true);
  }, [showDeleteConfirmInitialPromptVWC]);
};

const useHandleCancelSubscription = (
  loginContext: LoginContextValue,
  modalContext: ModalContextValue,
  errorVWC: WritableValueWithCallbacks<ReactElement | null>
): (() => void) => {
  const showCancelInitialPromptVWC = useWritableValueWithCallbacks(() => false);
  const showCancelApplePromptVWC = useWritableValueWithCallbacks(() => false);
  const showCancelPromoPromptVWC = useWritableValueWithCallbacks(() => false);
  const showCancelNoSubscriptionPromptVWC = useWritableValueWithCallbacks(
    () => false
  );
  const showCancelSuccessPromptVWC = useWritableValueWithCallbacks(() => false);

  useValueWithCallbacksEffect(
    showCancelInitialPromptVWC,
    (showCancelInitialPrompt) => {
      if (!showCancelInitialPrompt) {
        return;
      }

      const tryCancel = async () => {
        try {
          const response = await apiFetch(
            "/api/1/users/me/subscription",
            {
              method: "DELETE",
            },
            loginContext
          );

          if (!response.ok) {
            throw response;
          }

          setVWC(showCancelSuccessPromptVWC, true);
        } catch (e) {
          if (e instanceof TypeError) {
            setVWC(
              errorVWC,
              <ErrorBanner>
                <ErrorBannerText>
                  Could not connect to server. Check your internet connection.
                </ErrorBannerText>
              </ErrorBanner>
            );
          } else if (e instanceof Response) {
            if (e.status === 409) {
              const body = await e.json();
              console.log("conflict on cancel:", body);
              if (body.type === "no_active_subscription") {
                setVWC(showCancelNoSubscriptionPromptVWC, true);
              } else if (body.type === "has_active_ios_subscription") {
                setVWC(showCancelApplePromptVWC, true);
              } else if (body.type === "has_active_promotional_subscription") {
                setVWC(showCancelPromoPromptVWC, true);
              } else {
                console.error("unexpected 409 for deleting account:", body);
                setVWC(
                  errorVWC,
                  <ErrorBanner>
                    <ErrorBannerText>
                      Your subscription requires special handling in order to be
                      canceled. Contact hi@oseh.com for assistance.
                    </ErrorBannerText>
                  </ErrorBanner>
                );
              }
            } else {
              console.error("unexpected response for deleting account:", e);
              setVWC(errorVWC, await describeError(e));
            }
          } else {
            console.error("unexpected error for deleting account:", e);
            setVWC(
              errorVWC,
              <ErrorBanner>
                <ErrorBannerText>
                  An unexpected error occurred. Contact hi@oseh.com for
                  assistance.
                </ErrorBannerText>
              </ErrorBanner>
            );
          }
        } finally {
          setVWC(showCancelInitialPromptVWC, false);
        }
      };

      const onCancel = () => setVWC(showCancelInitialPromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="Are you sure you want to unsubscribe from Oseh+?"
            body={
              <Text style={styles.deleteConfirmBody}>
                By unsubscribing, you will lose access to Oseh+.
              </Text>
            }
            cta="Unsubscribe"
            cancelCta="Not Now"
            onConfirm={tryCancel}
            onCancel={onCancel}
            flipButtons
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showCancelApplePromptVWC,
    (showCancelApplePrompt) => {
      if (!showCancelApplePrompt) {
        return;
      }

      const onCancel = () => setVWC(showCancelApplePromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="To unsubscribe from Oseh+"
            body={
              <Text style={styles.deleteConfirmBody}>
                Visit the App Store &gt; Settings &gt; Subscriptions &gt; Oseh
                &gt; Cancel subscription.
              </Text>
            }
            cta="Okay"
            onConfirm={null}
            onCancel={onCancel}
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showCancelPromoPromptVWC,
    (showCancelPromoPrompt) => {
      if (!showCancelPromoPrompt) {
        return;
      }

      const onCancel = () => setVWC(showCancelPromoPromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="You do not have an active subscription."
            body={
              <Text style={styles.deleteConfirmBody}>
                You were gifted free access and are currently not being charged.
              </Text>
            }
            cta="Okay"
            onConfirm={null}
            onCancel={onCancel}
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showCancelNoSubscriptionPromptVWC,
    (showCancelNoSubscriptionPrompt) => {
      if (!showCancelNoSubscriptionPrompt) {
        return;
      }

      const onCancel = () => setVWC(showCancelNoSubscriptionPromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="You’ve already cancelled your subscription to Oseh+"
            body={
              <Text style={styles.deleteConfirmBody}>
                You do not have a recurring subscription. Access will end after
                your current billing period.
              </Text>
            }
            cta="Okay"
            onConfirm={null}
            onCancel={onCancel}
          />
        </ModalWrapper>
      );
    }
  );

  useValueWithCallbacksEffect(
    showCancelSuccessPromptVWC,
    (showCancelSuccessPrompt) => {
      if (!showCancelSuccessPrompt) {
        return;
      }

      const onCancel = () => setVWC(showCancelSuccessPromptVWC, false);

      return addModalWithCallbackToRemove(
        modalContext.modals,
        <ModalWrapper minimalStyling={true} onClosed={onCancel}>
          <SettingsForceDelete
            title="You are no longer subscribed to Oseh+."
            body={
              <Text style={styles.deleteConfirmBody}>
                You will not be charged for Oseh+ unless you resubscribe.
              </Text>
            }
            cta="Okay"
            onConfirm={null}
            onCancel={onCancel}
          />
        </ModalWrapper>
      );
    }
  );

  return useCallback(() => {
    setVWC(showCancelInitialPromptVWC, true);
  }, [showCancelInitialPromptVWC]);
};

const SettingsForceDelete = ({
  title,
  body,
  cta,
  onConfirm,
  onCancel,
  cancelCta = "Cancel",
  confirmDisabled = false,
  flipButtons = false,
}: {
  title: string;
  body: ReactElement;
  cta: string | null;
  onConfirm: (() => Promise<void> | void) | null;
  onCancel: () => Promise<void> | void;
  cancelCta?: string;
  confirmDisabled?: boolean;
  flipButtons?: boolean;
}): ReactElement => {
  const ignoringDeleteVWC = useTimedValueWithCallbacks(true, false, 2000);
  const confirmingVWC = useWritableValueWithCallbacks(() => false);
  const cancellingVWC = useWritableValueWithCallbacks(() => false);
  const confirmPressingInVWC = useWritableValueWithCallbacks(() => false);
  const cancelPressingInVWC = useWritableValueWithCallbacks(() => false);
  const contentWidth = useContentWidth();

  const doConfirm = useCallback(async () => {
    if (confirmingVWC.get() || onConfirm === null) {
      return;
    }

    setVWC(confirmingVWC, true);
    try {
      await onConfirm();
    } finally {
      setVWC(confirmingVWC, false);
    }
  }, [onConfirm, confirmingVWC]);

  const doCancel = useCallback(async () => {
    if (cancellingVWC.get()) {
      return;
    }

    setVWC(cancellingVWC, true);
    try {
      await onCancel();
    } finally {
      setVWC(cancellingVWC, false);
    }
  }, [onCancel, cancellingVWC]);

  const confirmDisabledVWC = useMappedValuesWithCallbacks<
    boolean,
    ValueWithCallbacks<boolean>[],
    boolean
  >(
    [ignoringDeleteVWC, confirmingVWC, cancellingVWC],
    ([ignoringDelete, confirming, cancelling]) => {
      return confirmDisabled || ignoringDelete || confirming || cancelling;
    }
  );

  const cancelDisabledVWC = useMappedValuesWithCallbacks<
    boolean,
    ValueWithCallbacks<boolean>[],
    boolean
  >(
    [confirmingVWC, cancellingVWC],
    ([confirming, cancelling]) => confirming || cancelling
  );

  const confirmDisabledAndPressingIn = useMappedValuesWithCallbacks(
    [confirmDisabledVWC, confirmPressingInVWC],
    () => [confirmDisabledVWC.get(), confirmPressingInVWC.get()] as const
  );

  const confirmButton =
    onConfirm !== null ? (
      <RenderGuardedComponent
        props={confirmDisabledAndPressingIn}
        component={([disabled, pressingIn]) => (
          <Pressable
            style={Object.assign(
              {},
              styles.deleteConfirmButton,
              flipButtons ? undefined : styles.deleteConfirmDeleteButton,
              pressingIn ? styles.deleteConfirmButtonPressingIn : undefined
            )}
            disabled={disabled}
            onPressIn={() => setVWC(confirmPressingInVWC, true)}
            onPressOut={() => setVWC(confirmPressingInVWC, false)}
            onPress={doConfirm}
          >
            {disabled && (
              <View style={styles.deleteSpinnerContainer}>
                <InlineOsehSpinner
                  size={{ type: "react-rerender", props: { height: 12 } }}
                  variant="black"
                />
              </View>
            )}
            <Text
              style={Object.assign(
                {},
                styles.deleteConfirmButtonText,
                flipButtons ? undefined : styles.deleteConfirmDeleteButtonText
              )}
            >
              {cta}
            </Text>
          </Pressable>
        )}
      />
    ) : null;

  const cancelDisabledAndPressingIn = useMappedValuesWithCallbacks(
    [cancelDisabledVWC, cancelPressingInVWC],
    () => [cancelDisabledVWC.get(), cancelPressingInVWC.get()] as const
  );
  const cancelButton = (
    <RenderGuardedComponent
      props={cancelDisabledAndPressingIn}
      component={([disabled, pressingIn]) => (
        <Pressable
          style={Object.assign(
            {},
            styles.deleteConfirmButton,
            !flipButtons ? undefined : styles.deleteConfirmDeleteButton,
            pressingIn ? styles.deleteConfirmButtonPressingIn : undefined
          )}
          onPress={doCancel}
          onPressIn={() => setVWC(cancelPressingInVWC, true)}
          onPressOut={() => setVWC(cancelPressingInVWC, false)}
          disabled={disabled}
        >
          <Text
            style={Object.assign(
              {},
              styles.deleteConfirmButtonText,
              !flipButtons ? undefined : styles.deleteConfirmDeleteButtonText
            )}
          >
            {onConfirm !== null ? cancelCta : cta}
          </Text>
        </Pressable>
      )}
    />
  );

  return (
    <View
      style={{
        ...styles.deleteConfirm,
        width: Math.min(contentWidth, 279),
      }}
    >
      <Text style={styles.deleteConfirmTitle}>{title}</Text>
      {body}
      <View style={styles.deleteConfirmButtons}>
        {flipButtons ? (
          <>
            {cancelButton}
            {confirmButton}
          </>
        ) : (
          <>
            {confirmButton}
            {cancelButton}
          </>
        )}
      </View>
    </View>
  );
};
