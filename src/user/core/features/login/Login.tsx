import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Platform, StyleProp, Text, TextStyle, View } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { styles } from "./LoginScreenStyles";
import Constants from "expo-constants";
import { SplashScreen } from "../../../splash/SplashScreen";
import Google from "./icons/Google";
import Apple from "./icons/Apple";
import { StatusBar } from "expo-status-bar";
import OsehWordmarkWhite from "./icons/OsehWordmarkWhite";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { apiFetch } from "../../../../shared/lib/apiFetch";
import { LoginResources } from "./LoginResources";
import { LoginState } from "./LoginState";
import {
  ErrorBanner,
  ErrorBannerText,
} from "../../../../shared/components/ErrorBanner";
import { describeError } from "../../../../shared/lib/describeError";
import { OsehImageBackgroundFromState } from "../../../../shared/images/OsehImageBackgroundFromState";
import { URLSearchParams } from "react-native-url-polyfill";
import { FeatureComponentProps } from "../../models/Feature";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { useUnwrappedValueWithCallbacks } from "../../../../shared/hooks/useUnwrappedValueWithCallbacks";
import {
  LoginMessage,
  ReadableLoginMessagePipe,
  createReadPipeIfAvailable,
  createWritePipe,
} from "./LoginMessagePipe";
import {
  Callbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import { setVWC } from "../../../../shared/lib/setVWC";
import { useIsMounted } from "../../../../shared/hooks/useIsMounted";
import { FilledPrimaryButton } from "../../../../shared/components/FilledPrimaryButton";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { OutlineWhiteButton } from "../../../../shared/components/OutlineWhiteButton";

const DEV_ACCOUNT_USER_IDENTITY_ID = "guest9833";

const prepareLink = async (
  provider: "Google" | "SignInWithApple" | "Direct"
): Promise<{ url: string; redirectUrl: string }> => {
  const redirectUrl = Linking.createURL("login_callback");
  const response = await apiFetch(
    "/api/1/oauth/prepare",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        provider,
        refresh_token_desired: true,
        redirect_uri: redirectUrl,
      }),
    },
    null
  );

  if (!response.ok) {
    throw response;
  }

  const data: { url: string } = await response.json();
  return { url: data.url, redirectUrl };
};

/**
 * The standard full screen component for logging in, which
 * presents the user with options to log in with Google or Apple.
 */
export const Login = ({
  state,
  resources,
}: FeatureComponentProps<LoginState, LoginResources>) => {
  const loginContext = useContext(LoginContext);
  const checkedMessagePipeVWC = useWritableValueWithCallbacks(() => false);
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const mountedVWC = useIsMounted();
  const googleTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const updateGoogleTextStyle = useCallback(
    (v: StyleProp<TextStyle>) => {
      setVWC(googleTextStyleVWC, v);
    },
    [googleTextStyleVWC]
  );
  const appleTextStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  const updateAppleTextStyle = useCallback(
    (v: StyleProp<TextStyle>) => {
      setVWC(appleTextStyleVWC, v);
    },
    [appleTextStyleVWC]
  );

  const onMessageFromPipe = useCallback(
    (result: LoginMessage) => {
      if (result.type === "cancel") {
        setVWC(
          errorVWC,
          <ErrorBanner>
            <ErrorBannerText>
              Authorization failed: cancelled by user
            </ErrorBannerText>
          </ErrorBanner>
        );
      } else if (result.type === "dismiss") {
        console.log("dismissed by user; ignoring");
      } else if (result.type === "unknown") {
        setVWC(
          errorVWC,
          <ErrorBanner>
            <ErrorBannerText>
              Authorization failed: unknown result ({result.rawType})
            </ErrorBannerText>
          </ErrorBanner>
        );
      } else if (result.type === "error") {
        setVWC(
          errorVWC,
          <ErrorBanner>
            <ErrorBannerText>
              Authorization failed: {result.message}
            </ErrorBannerText>
          </ErrorBanner>
        );
      } else {
        // ensures no missing cases
        ((t: "success") => {})(result.type);

        const { idToken, refreshToken, onboard } = result;
        loginContext.setAuthTokens.call(undefined, {
          idToken,
          refreshToken: refreshToken ?? null,
        });
        state.get().setOnboard.call(undefined, onboard);
      }
    },
    [loginContext.setAuthTokens, state]
  );

  useEffect(() => {
    if (checkedMessagePipeVWC.get()) {
      return;
    }

    let active = true;
    let cancelers = new Callbacks<undefined>();
    checkPipe();
    return () => {
      active = false;
      cancelers.call(undefined);
    };

    async function checkPipe() {
      if (!active) {
        return;
      }

      let reader: ReadableLoginMessagePipe | null = null;
      try {
        reader = await createReadPipeIfAvailable();
      } catch (e) {
        console.log("login failed to create read pipe: ", e);
        setVWC(checkedMessagePipeVWC, true);
        return;
      }

      if (reader === null) {
        setVWC(checkedMessagePipeVWC, true);
        return;
      }
      try {
        const readCancelablePromise = reader.read();
        cancelers.add(() => readCancelablePromise.cancel());
        let timeoutPromise = new Promise<void>((resolve) =>
          setTimeout(resolve, 3000)
        );
        try {
          await Promise.race([timeoutPromise, readCancelablePromise.promise]);
        } finally {
          readCancelablePromise.cancel();
        }

        const read = await readCancelablePromise.promise;
        if (!active) {
          return;
        }
        onMessageFromPipe(read);
      } finally {
        await reader.close();
        if (active) {
          setVWC(checkedMessagePipeVWC, true);
        }
      }
    }
  }, [onMessageFromPipe, checkedMessagePipeVWC]);

  const onContinueWithProvider = useCallback(
    async (provider: "Google" | "SignInWithApple" | "Direct") => {
      const options: WebBrowser.AuthSessionOpenOptions = {};
      if (Platform.OS === "ios" && provider === "Google") {
        options.preferEphemeralSession = true;
      }

      setVWC(errorVWC, null);
      try {
        const { url, redirectUrl } = await prepareLink(provider);
        const pipe = await createWritePipe();

        const sendPipeMessageOrApplyImmediately = (msg: LoginMessage) => {
          if (mountedVWC.get()) {
            onMessageFromPipe(msg);
          } else {
            pipe.send(msg);
          }
        };

        try {
          const result = await WebBrowser.openAuthSessionAsync(
            url,
            redirectUrl,
            options
          );
          if (result.type === "cancel") {
            sendPipeMessageOrApplyImmediately({ type: "cancel" });
            return;
          } else if (result.type === "dismiss") {
            sendPipeMessageOrApplyImmediately({ type: "dismiss" });
            return;
          } else if (result.type !== "success") {
            sendPipeMessageOrApplyImmediately({
              type: "unknown",
              rawType: result.type,
            });
            return;
          }
          const params = new URLSearchParams(
            result.url.substring(result.url.indexOf("#") + 1)
          );
          if (params.get("auth_error") === "1") {
            const errorMessage = params.get("auth_error_message");
            sendPipeMessageOrApplyImmediately({
              type: "error",
              message: errorMessage ?? "",
            });
            return;
          }

          const idToken = params.get("id_token");
          if (!idToken) {
            sendPipeMessageOrApplyImmediately({
              type: "error",
              message: "no id token",
            });
            return;
          }

          const refreshToken = params.get("refresh_token") ?? undefined;
          const onboard = params.get("onboard") === "1";

          sendPipeMessageOrApplyImmediately({
            type: "success",
            idToken,
            refreshToken,
            onboard,
          });
        } finally {
          setTimeout(pipe.close, 3000);
        }
      } catch (e) {
        setVWC(errorVWC, await describeError(e));
      }
    },
    [loginContext.setAuthTokens, state, onMessageFromPipe, mountedVWC]
  );

  const onContinueWithGoogle = useCallback(async () => {
    onContinueWithProvider("Google");
  }, [onContinueWithProvider]);

  const onContinueWithApple = useCallback(async () => {
    onContinueWithProvider("SignInWithApple");
  }, [onContinueWithProvider]);

  const onLongPressMessage = useCallback(async () => {
    if (Constants.expoConfig?.extra?.environment !== "dev") {
      return;
    }

    setVWC(errorVWC, null);
    try {
      const response = await apiFetch(
        "/api/1/dev/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            sub: DEV_ACCOUNT_USER_IDENTITY_ID,
            refresh_token_desired: true,
          }),
        },
        loginContext
      );

      if (!response.ok) {
        throw response;
      }

      const data: {
        id_token: string;
        refresh_token: string;
        onboard: boolean;
      } = await response.json();
      await loginContext.setAuthTokens({
        idToken: data.id_token,
        refreshToken: data.refresh_token,
      });
      state.get().setOnboard.call(undefined, data.onboard);
    } catch (e) {
      setVWC(errorVWC, await describeError(e));
    }
  }, [loginContext, state]);

  const numDirectAccClicks = useWritableValueWithCallbacks<number[]>(() => []);
  const handlingDirectAccClick = useRef(false);
  const onPressMessage = useCallback(async () => {
    if (handlingDirectAccClick.current) {
      return;
    }

    handlingDirectAccClick.current = true;
    try {
      const clickAt = Date.now();
      const oldArr = numDirectAccClicks.get();
      const newArr = [...oldArr, clickAt];
      while (newArr[0] < clickAt - 5000) {
        newArr.shift();
      }
      setVWC(numDirectAccClicks, newArr);

      if (newArr.length < 3) {
        return;
      }
      onContinueWithProvider("Direct");
    } catch (e) {
      setVWC(errorVWC, await describeError(e));
    } finally {
      handlingDirectAccClick.current = false;
    }
  }, [numDirectAccClicks]);

  const background = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(resources, (r) => r.background)
  );

  const checkedMessagePipe = useUnwrappedValueWithCallbacks(
    checkedMessagePipeVWC
  );

  if (!checkedMessagePipe) {
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      <RenderGuardedComponent
        props={errorVWC}
        component={(error) => error ?? <></>}
      />
      <OsehImageBackgroundFromState state={background} style={styles.content}>
        <OsehWordmarkWhite width={163} height={40} style={styles.logo} />
        <Text
          style={styles.message}
          onLongPress={onLongPressMessage}
          onPress={onPressMessage}
        >
          Make mindfulness a daily part of your life in 60 seconds.
        </Text>
        <FilledPrimaryButton
          onPress={onContinueWithGoogle}
          setTextStyle={updateGoogleTextStyle}
          fullWidth
        >
          <Google style={styles.google} />
          <RenderGuardedComponent
            props={googleTextStyleVWC}
            component={(textStyle) => (
              <Text style={textStyle}>Sign in with Google</Text>
            )}
          />
        </FilledPrimaryButton>
        <View style={{ height: 32 }} />
        <OutlineWhiteButton
          onPress={onContinueWithApple}
          setTextStyle={updateAppleTextStyle}
          fullWidth
        >
          <Apple style={styles.apple} />
          <RenderGuardedComponent
            props={appleTextStyleVWC}
            component={(textStyle) => (
              <Text style={textStyle}>Sign in with Apple</Text>
            )}
          />
        </OutlineWhiteButton>
      </OsehImageBackgroundFromState>
      <StatusBar style="light" />
    </View>
  );
};
