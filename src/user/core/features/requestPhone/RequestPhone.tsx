import { ReactElement, useCallback, useContext } from "react";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { useTimezone } from "../../../../shared/hooks/useTimezone";
import { FeatureComponentProps } from "../../models/Feature";
import { RequestPhoneState } from "./RequestPhoneState";
import { RequestPhoneResources } from "./RequestPhoneResources";
import { useStartSession } from "../../../../shared/hooks/useInappNotificationSession";
import {
  InterestsContext,
  InterestsContextValue,
} from "../../../../shared/contexts/InterestsContext";
import { useWindowSize } from "../../../../shared/hooks/useWindowSize";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { setVWC } from "../../../../shared/lib/setVWC";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { useMappedValuesWithCallbacks } from "../../../../shared/hooks/useMappedValuesWithCallbacks";
import { useErrorModal } from "../../../../shared/hooks/useErrorModal";
import { describeError } from "../../../../shared/lib/describeError";
import { apiFetch } from "../../../../shared/lib/apiFetch";
import { View, Text, TextInput, StyleProp, TextStyle } from "react-native";
import { styles } from "./RequestPhoneStyles";
import { Modals, ModalsOutlet } from "../../../../shared/contexts/ModalContext";
import * as Linking from "expo-linking";
import * as Colors from "../../../../styling/colors";
import { LinearGradientBackground } from "../../../../shared/anim/LinearGradientBackground";
import { FullscreenView } from "../../../../shared/components/FullscreenView";
import { StatusBar } from "expo-status-bar";
import Messages from "./icons/Messages";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { useKeyboardVisibleValueWithCallbacks } from "../../../../shared/lib/useKeyboardVisibleValueWithCallbacks";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";
import { inferAnimators } from "../../../../shared/anim/AnimationLoop";
import { useAnimatedValueWithCallbacks } from "../../../../shared/anim/useAnimatedValueWithCallbacks";
import { easeIn } from "../../../../shared/lib/Bezier";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import {
  ErrorBanner,
  ErrorBannerText,
} from "../../../../shared/components/ErrorBanner";
import { LinkButton } from "../../../../shared/components/LinkButton";
import { useContentWidth } from "../../../../shared/lib/useContentWidth";

/**
 * Prompts the user for their phone number, then verifies it.
 */
export const RequestPhone = ({
  state,
  resources,
}: FeatureComponentProps<
  RequestPhoneState,
  RequestPhoneResources
>): ReactElement => {
  const loginContext = useContext(LoginContext);
  const interests = useContext(InterestsContext);
  const appNotifsAvailable = useMappedValueWithCallbacks(
    resources,
    (r) => r.appNotifsEnabled
  );

  const step = useWritableValueWithCallbacks<"number" | "verify" | "done">(
    () => "number"
  );
  const phone = useWritableValueWithCallbacks<string>(() => "");
  const error = useWritableValueWithCallbacks<ReactElement | null>(() => null);
  const saving = useWritableValueWithCallbacks<boolean>(() => false);
  const code = useWritableValueWithCallbacks<string>(() => "");
  const errorPhone = useWritableValueWithCallbacks<boolean>(() => false);
  const verificationUid = useWritableValueWithCallbacks<string | null>(
    () => null
  );
  const timezone = useTimezone();
  useStartSession({
    type: "callbacks",
    props: () => resources.get().session,
    callbacks: resources.callbacks,
  });

  const formatAndSetPhone = useCallback(
    (newValue: string) => {
      setVWC(errorPhone, false);

      if (newValue === "+") {
        setVWC(phone, "+");
        return;
      }

      if (newValue[0] === "+" && newValue[1] !== "1") {
        // international number; we'll just let them type it
        setVWC(phone, newValue);
        return;
      }

      let stripped = newValue.replace(/[^0-9]/g, "");

      if (newValue.endsWith("-")) {
        // they backspaced a space
        stripped = stripped.slice(0, -1);
      }

      if (stripped.length === 0) {
        setVWC(phone, "");
        return;
      }

      let result = stripped;
      if (result[0] !== "1") {
        result = "+1" + result;
      } else {
        result = "+" + result;
      }

      // +1123
      if (result.length >= 5) {
        result = result.slice(0, 5) + " - " + result.slice(5);
      }

      // +1123 - 456
      if (result.length >= 11) {
        result = result.slice(0, 11) + " - " + result.slice(11);
      }

      setVWC(phone, result);
    },
    [phone, errorPhone]
  );

  const phoneFormatCorrect = useMappedValueWithCallbacks(phone, (phone) => {
    if (phone.length < 3) {
      return false;
    }

    if (phone[0] === "+" && phone[1] !== "1") {
      // we don't bother validating international numbers
      return true;
    }

    // +1123 - 456 - 7890
    return phone.length === 18;
  });

  const onStartPhone = useCallback(async () => {
    const phoneInputRaw = phoneTextInput.get();
    if (phoneInputRaw === null) {
      setVWC(
        error,
        <ErrorBanner>
          <ErrorBannerText>ERR: phone input not available</ErrorBannerText>
        </ErrorBanner>
      );
      return;
    }
    const phoneInput = phoneInputRaw;
    phoneInput.blur();

    if (loginContext.state !== "logged-in") {
      setVWC(
        error,
        <ErrorBanner>
          <ErrorBannerText>
            You need to be logged in to do that.
          </ErrorBannerText>
        </ErrorBanner>
      );
      return;
    }

    if (!phoneFormatCorrect.get()) {
      setVWC(error, null);
      setVWC(errorPhone, true);
      phoneInput.focus();
      return;
    }

    const phoneNumber = phone.get();
    const receiveNotifs = !resources.get().appNotifsEnabled;

    resources.get().session?.storeAction?.call(undefined, "continue", {
      pn: phoneNumber,
      tz: timezone.timeZone,
    });
    setVWC(saving, true);
    setVWC(error, null);
    try {
      const response = await apiFetch(
        "/api/1/phones/verify/start",
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            phone_number: phoneNumber,
            receive_notifications: receiveNotifs,
            timezone: timezone.timeZone,
            timezone_technique: timezone.guessed ? "app-guessed" : "app",
          }),
        },
        loginContext
      );

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      setVWC(verificationUid, data.uid);
      setVWC(step, "verify");
    } catch (e) {
      console.error(e);
      const err = await describeError(e);
      setVWC(error, err);
    } finally {
      setVWC(saving, false);
    }
  }, [
    loginContext,
    phoneFormatCorrect,
    phone,
    timezone,
    resources,
    error,
    saving,
    errorPhone,
    step,
    verificationUid,
  ]);

  const onVerifyPhone = useCallback(async () => {
    if (loginContext.state !== "logged-in") {
      setVWC(
        error,
        <ErrorBanner>
          <ErrorBannerText>
            You need to be logged in to do that.
          </ErrorBannerText>
        </ErrorBanner>
      );
      return;
    }

    const phoneNumber = phone.get().replaceAll(/ - /g, "");

    resources.get().session?.storeAction?.call(undefined, "verify_start", null);
    setVWC(saving, true);
    setVWC(error, null);
    try {
      const response = await apiFetch(
        "/api/1/phones/verify/finish",
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            uid: verificationUid.get(),
            code: code.get(),
          }),
        },
        loginContext
      );

      if (!response.ok) {
        if (response.status === 404) {
          setVWC(
            error,
            <ErrorBanner>
              <ErrorBannerText>
                The code you entered is incorrect. Please try again.
              </ErrorBannerText>
            </ErrorBanner>
          );
          return;
        }
        throw response;
      }

      await loginContext.setUserAttributes({
        ...loginContext.userAttributes!,
        phoneNumber,
      });
      resources
        .get()
        .session?.storeAction?.call(undefined, "verify_success", null);
      setVWC(step, "done");
    } catch (e) {
      resources
        .get()
        .session?.storeAction?.call(undefined, "verify_fail", null);
      console.error(e);
      const err = await describeError(e);
      setVWC(error, err);
    } finally {
      setVWC(saving, false);
    }
  }, [
    loginContext,
    code,
    phone,
    verificationUid,
    resources,
    error,
    saving,
    step,
  ]);

  const onSkipPhone = useCallback(async () => {
    const res = resources.get();
    const st = state.get();

    if (res.session !== null) {
      res.session.storeAction("skip", null);
      res.session.reset();
      st.onboardingPhoneNumberIAN?.onShown();
    }
  }, [state, resources]);

  const onBackVerify = useCallback(async () => {
    resources.get().session?.storeAction?.call(undefined, "verify_back", null);
    setVWC(error, null);
    setVWC(verificationUid, null);
    setVWC(step, "number");
  }, [resources, error, verificationUid, step]);

  const phoneInputData = useMappedValuesWithCallbacks(
    [phone, errorPhone, saving],
    () => ({
      phone: phone.get(),
      errorPhone: errorPhone.get(),
      saving: saving.get(),
    })
  );

  const codeInputData = useMappedValuesWithCallbacks([code, saving], () => ({
    code: code.get(),
    saving: saving.get(),
  }));

  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  useErrorModal(modals, error, "request or verify phone");

  const windowSize = useWindowSize();
  const contentWidth = useContentWidth();
  const contentView = useWritableValueWithCallbacks<View | null>(() => null);
  const renderedContentOffset = useWritableValueWithCallbacks<{
    translateY: number;
  }>(() => ({ translateY: 0 }));
  const targetContentOffset = useAnimatedValueWithCallbacks<{
    translateY: number;
  }>(
    { translateY: 0 },
    () => inferAnimators({ translateY: 0 }, easeIn, 500),
    (v) => {
      const ele = contentView.get();
      if (ele === null) {
        return;
      }

      setVWC(renderedContentOffset, { ...v });
      ele.setNativeProps({
        style: {
          transform: [{ translateY: v.translateY }],
        },
      });
    }
  );

  const keyboardVisible = useKeyboardVisibleValueWithCallbacks();
  const phoneTextInput = useWritableValueWithCallbacks<TextInput | null>(
    () => null
  );
  const codeTextInput = useWritableValueWithCallbacks<TextInput | null>(
    () => null
  );
  useValueWithCallbacksEffect(keyboardVisible, () => {
    const view = contentView.get();
    if (view === null) {
      return undefined;
    }

    if (!keyboardVisible.get()) {
      setVWC(
        targetContentOffset,
        { translateY: 0 },
        compareTargetContentOffsets
      );
      return undefined;
    }

    let active = true;

    const input =
      step.get() === "number" ? phoneTextInput.get() : codeTextInput.get();
    if (input === null) {
      return undefined;
    }

    input.measureInWindow((x, y, width, height) => {
      if (!active) {
        return;
      }

      const currentOffset = renderedContentOffset.get();
      const desiredY = Math.max(Math.min(windowSize.height / 3, 300), 100);
      if (Math.abs(y - desiredY) < 1) {
        return;
      }

      const requiredShift = desiredY - y;
      const requiredOffset = {
        translateY: currentOffset.translateY + requiredShift,
      };
      setVWC(targetContentOffset, requiredOffset, compareTargetContentOffsets);
    });

    return () => {
      active = false;
    };
  });

  const continueTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  const skipButtonTextStyle = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  const handleNumberChanged = useCallback((newNumber: string) => {
    formatAndSetPhone(newNumber);

    if (phone.get() === newNumber) {
      return;
    }

    const phoneInput = phoneTextInput.get();
    if (phoneInput === null) {
      return;
    }

    phoneInput.setNativeProps({ text: phone.get() });
  }, []);

  const handleCodeChanged = useCallback(
    (newCode: string) => {
      setVWC(code, newCode);
    },
    [code]
  );

  return (
    <View style={styles.container}>
      <LinearGradientBackground
        state={{
          type: "react-rerender",
          props: Colors.STANDARD_BLACK_GRAY_GRADIENT,
        }}
      >
        <FullscreenView
          style={styles.background}
          alwaysScroll={windowSize.width < 360 || windowSize.height < 760}
        >
          <View
            style={{
              ...styles.content,
              width: contentWidth,
            }}
            ref={(r) => setVWC(contentView, r)}
          >
            <RenderGuardedComponent
              props={useMappedValueWithCallbacks(
                step,
                (step) => step === "number"
              )}
              component={(isNumberStep) => {
                if (!isNumberStep) {
                  return <></>;
                }
                return (
                  <>
                    <Messages width={111} height={111} />
                    <RenderGuardedComponent
                      props={appNotifsAvailable}
                      component={(appNotifsAvailable) => (
                        <>
                          {phoneStepTitle(
                            interests,
                            appNotifsAvailable ?? false
                          )}
                          {phoneStepSubtitle(
                            interests,
                            appNotifsAvailable ?? false
                          )}
                        </>
                      )}
                    />
                    <RenderGuardedComponent
                      props={phoneInputData}
                      component={({ phone, errorPhone, saving }) => (
                        /* Notice how we avoid this being a managed input; */
                        /* this avoids some terrible jitter, but means handleNumberChanged */
                        /* has to use its ref to update the value */
                        <TextInput
                          ref={(r) => {
                            setVWC(phoneTextInput, r);
                          }}
                          autoComplete="tel"
                          style={{
                            ...styles.phoneInput,
                            ...(errorPhone
                              ? styles.errorPhoneInput
                              : undefined),
                            width: windowSize.width - 64,
                          }}
                          defaultValue={phone}
                          editable={!saving}
                          onChangeText={handleNumberChanged}
                        />
                      )}
                    />

                    <RenderGuardedComponent
                      props={saving}
                      component={(disabled) => (
                        <>
                          <FilledInvertedButton
                            width={contentWidth}
                            disabled={disabled}
                            onPress={onStartPhone}
                            spinner={disabled}
                            setTextStyle={(s) => setVWC(continueTextStyle, s)}
                          >
                            <RenderGuardedComponent
                              props={continueTextStyle}
                              component={(style) => (
                                <Text style={style}>Continue</Text>
                              )}
                            />
                          </FilledInvertedButton>
                          <LinkButton
                            width={contentWidth}
                            disabled={disabled}
                            onPress={onSkipPhone}
                            spinner={false}
                            setTextStyle={(s) => setVWC(skipButtonTextStyle, s)}
                            marginTop={20}
                          >
                            <RenderGuardedComponent
                              props={skipButtonTextStyle}
                              component={(style) => (
                                <Text style={style}>Skip</Text>
                              )}
                            />
                          </LinkButton>
                        </>
                      )}
                    />

                    <RenderGuardedComponent
                      props={appNotifsAvailable}
                      component={(appNotifsAvailable) =>
                        phoneStepDisclaimer(
                          interests,
                          appNotifsAvailable ?? false
                        )
                      }
                    />
                  </>
                );
              }}
            />
            <RenderGuardedComponent
              props={useMappedValueWithCallbacks(
                step,
                (step) => step === "verify"
              )}
              component={(isVerifyStep) => {
                if (!isVerifyStep) {
                  return <></>;
                }

                return (
                  <>
                    <Messages width={111} height={111} />
                    <Text style={styles.title}>Verify your phone number</Text>
                    <Text style={styles.subtitle}>
                      If you do not receive the code within a few minutes, go
                      back to try again or skip.
                    </Text>
                    <RenderGuardedComponent
                      props={codeInputData}
                      component={(d) => (
                        /* Notice how we avoid this being a managed input; */
                        /* this avoids some terrible jitter */
                        <TextInput
                          ref={(r) => {
                            setVWC(codeTextInput, r);
                          }}
                          autoComplete="sms-otp"
                          style={{
                            ...styles.phoneInput,
                            width: windowSize.width - 64,
                          }}
                          defaultValue={d.code}
                          editable={!d.saving}
                          onChangeText={handleCodeChanged}
                        />
                      )}
                    />
                    <RenderGuardedComponent
                      props={saving}
                      component={(disabled) => (
                        <>
                          <FilledInvertedButton
                            width={contentWidth}
                            disabled={disabled}
                            onPress={onVerifyPhone}
                            spinner={disabled}
                            setTextStyle={(s) => setVWC(continueTextStyle, s)}
                          >
                            <RenderGuardedComponent
                              props={continueTextStyle}
                              component={(style) => (
                                <Text style={style}>Continue</Text>
                              )}
                            />
                          </FilledInvertedButton>
                          <LinkButton
                            width={contentWidth}
                            disabled={disabled}
                            onPress={onBackVerify}
                            spinner={false}
                            setTextStyle={(s) => setVWC(skipButtonTextStyle, s)}
                            marginTop={20}
                          >
                            <RenderGuardedComponent
                              props={skipButtonTextStyle}
                              component={(style) => (
                                <Text style={style}>Back</Text>
                              )}
                            />
                          </LinkButton>
                        </>
                      )}
                    />
                  </>
                );
              }}
            />
          </View>
        </FullscreenView>
      </LinearGradientBackground>
      <ModalsOutlet modals={modals} />
      <StatusBar style="light" />
    </View>
  );
};

const phoneStepTitle = (
  interests: InterestsContextValue,
  appNotifsAvailable: boolean
): ReactElement => {
  if (appNotifsAvailable) {
    return (
      <Text style={styles.title}>Please verify your phone&nbsp;number</Text>
    );
  }

  const defaultCopy = (
    <Text style={styles.title}>
      Let&rsquo;s create a daily mindfulness habit with friendly nudges
    </Text>
  );

  if (interests.state !== "loaded") {
    return defaultCopy;
  } else if (interests.primaryInterest === "anxiety") {
    return (
      <Text style={styles.title}>Relax every day with friendly nudges</Text>
    );
  } else if (interests.primaryInterest === "sleep") {
    return (
      <Text style={styles.title}>
        Sleep easier every day with friendly nudges
      </Text>
    );
  } else if (interests.primaryInterest === "isaiah-course") {
    return (
      <Text style={styles.title}>Oseh is much better with notifications</Text>
    );
  } else {
    return defaultCopy;
  }
};

const phoneStepSubtitle = (
  interests: InterestsContextValue,
  appNotifsAvailable: boolean
): ReactElement => {
  if (appNotifsAvailable) {
    return (
      <Text style={styles.subtitle}>
        Adding a phone number to your account adds an extra layer of security
        and&nbsp;convenience.
      </Text>
    );
  } else {
    return (
      <Text style={styles.subtitle}>
        Sign up for daily text reminders by entering your phone number below.
      </Text>
    );
  }
};

const phoneStepDisclaimer = (
  interests: InterestsContextValue,
  appNotifsAvailable: boolean
): ReactElement => {
  if (appNotifsAvailable) {
    return (
      <Text style={styles.disclaimer}>
        By continuing you agree to our{" "}
        <Text
          style={{
            fontFamily: "OpenSans-Bold",
          }}
          onPress={() => Linking.openURL("https://www.oseh.com/terms")}
        >
          Terms
        </Text>{" "}
        and{" "}
        <Text
          style={{
            fontFamily: "OpenSans-Bold",
          }}
          onPress={() => Linking.openURL("https://www.oseh.com/privacy")}
        >
          Privacy Policy
        </Text>
        , and to receive 2FA, account notifications, security alerts, and
        customer care messages from Oseh. Msg & data rates may apply. Message
        frequency varies. Consent is not a condition of signup. Text HELP for
        help or STOP to cancel.
      </Text>
    );
  } else {
    return (
      <Text style={styles.disclaimer}>
        By continuing you agree to our{" "}
        <Text
          style={{
            borderBottomWidth: 1,
            borderBottomColor: Colors.GRAYSCALE_WHITE,
          }}
          onPress={() => Linking.openURL("https://www.oseh.com/terms")}
        >
          Terms
        </Text>{" "}
        and{" "}
        <Text
          style={{
            borderBottomWidth: 1,
            borderBottomColor: Colors.GRAYSCALE_WHITE,
          }}
          onPress={() => Linking.openURL("https://www.oseh.com/privacy")}
        >
          Privacy Policy
        </Text>
        , and to receive marketing messages from Oseh. Msg & data rates may
        apply. Approx. 1 message per day. Consent is not a condition of signup.
        Text HELP for help or STOP to cancel.
      </Text>
    );
  }
};

const compareTargetContentOffsets = (
  a: { translateY: number },
  b: { translateY: number }
): boolean => Math.abs(a.translateY - b.translateY) < 1;
