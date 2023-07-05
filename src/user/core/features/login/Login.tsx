import {
  ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { styles } from "./LoginScreenStyles";
import Constants from "expo-constants";
import { SplashScreen } from "../../../splash/SplashScreen";
import Google from "./icons/Google";
import Apple from "./icons/Apple";
import { StatusBar } from "expo-status-bar";
import OsehBrandmarkWhite from "./icons/OsehBrandmarkWhite";
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

const DEV_ACCOUNT_USER_IDENTITY_ID = "guest9833";

const prepareLink = async (
  provider: "Google" | "SignInWithApple"
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
  const [error, setError] = useState<ReactElement | null>(null);
  const [pressingGoogle, setPressingGoogle] = useState(false);
  const [pressingApple, setPressingApple] = useState(false);
  const [goingToGoogle, setGoingToGoogle] = useState(false);
  const [goingToApple, setGoingToApple] = useState(false);

  const onGooglePressIn = useCallback(() => {
    setPressingGoogle(true);
  }, []);

  const onGooglePressOut = useCallback(() => {
    setPressingGoogle(false);
  }, []);

  const onApplePressIn = useCallback(() => {
    setPressingApple(true);
  }, []);

  const onApplePressOut = useCallback(() => {
    setPressingApple(false);
  }, []);

  const onContinueWithProvider = useCallback(
    async (provider: "Google" | "SignInWithApple") => {
      setError(null);
      try {
        const { url, redirectUrl } = await prepareLink(provider);
        const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
        if (result.type === "cancel") {
          setError(
            <ErrorBanner>
              <ErrorBannerText>
                Authorization failed: cancelled by user
              </ErrorBannerText>
            </ErrorBanner>
          );
          return;
        } else if (result.type === "dismiss") {
          console.log("dismissed by user; ignoring");
          return;
        } else if (result.type !== "success") {
          setError(
            <ErrorBanner>
              <ErrorBannerText>
                Authorization failed: unknown error
              </ErrorBannerText>
            </ErrorBanner>
          );
          return;
        }
        const params = new URLSearchParams(
          result.url.substring(result.url.indexOf("#") + 1)
        );
        if (params.get("auth_error") === "1") {
          const errorMessage = params.get("auth_error_message");
          setError(
            <ErrorBanner>
              <ErrorBannerText>
                Authorization failed: {errorMessage}
              </ErrorBannerText>
            </ErrorBanner>
          );
          return;
        }

        const idToken = params.get("id_token");
        if (!idToken) {
          setError(
            <ErrorBanner>
              <ErrorBannerText>
                Authorization failed: no id token
              </ErrorBannerText>
            </ErrorBanner>
          );
          return;
        }

        const refreshToken = params.get("refresh_token") ?? null;
        const onboard = params.get("onboard") === "1";

        const tokenResponse = {
          idToken,
          refreshToken,
        };

        loginContext.setAuthTokens.apply(undefined, [tokenResponse]);
        state.get().setOnboard.call(undefined, onboard);
      } catch (e) {
        setError(await describeError(e));
      }
    },
    [loginContext.setAuthTokens, state]
  );

  const onContinueWithGoogle = useCallback(async () => {
    setGoingToGoogle(true);
    try {
      onContinueWithProvider("Google");
    } finally {
      setGoingToGoogle(false);
    }
  }, [onContinueWithProvider]);

  const onContinueWithApple = useCallback(async () => {
    setGoingToApple(true);
    try {
      onContinueWithProvider("SignInWithApple");
    } finally {
      setGoingToApple(false);
    }
  }, [onContinueWithProvider]);

  const googleStyles = useMemo(() => {
    return Object.assign(
      {},
      styles.continueWithGoogle,
      pressingGoogle ? styles.continueWithGooglePressed : {}
    );
  }, [pressingGoogle]);

  const appleStyles = useMemo(() => {
    return Object.assign(
      {},
      styles.continueWithApple,
      pressingApple ? styles.continueWithApplePressed : {}
    );
  }, [pressingApple]);

  const onPressMessage = useCallback(async () => {
    if (Constants.expoConfig?.extra?.environment !== "dev") {
      return;
    }

    setError(null);
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
      setError(await describeError(e));
    }
  }, [loginContext, state]);

  const background = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(resources, (r) => r.background)
  );

  if (goingToApple || goingToGoogle) {
    if (pressingApple) {
      setPressingApple(false);
    }
    if (pressingGoogle) {
      setPressingGoogle(false);
    }
    return <SplashScreen />;
  }

  return (
    <View style={styles.container}>
      {error}
      <OsehImageBackgroundFromState state={background} style={styles.content}>
        <OsehBrandmarkWhite width={163} height={40} style={styles.logo} />
        <Text style={styles.message} onPress={onPressMessage}>
          Make mindfulness a daily part of your life in 60 seconds.
        </Text>
        <View style={styles.continueWithGoogleContainer}>
          <Pressable
            style={googleStyles}
            onPress={onContinueWithGoogle}
            onPressIn={onGooglePressIn}
            onPressOut={onGooglePressOut}
          >
            <Google style={styles.google} />
            <Text style={styles.continueWithGoogleText}>
              Continue with Google
            </Text>
          </Pressable>
        </View>
        <View style={styles.continueWithAppleContainer}>
          <Pressable
            style={appleStyles}
            onPress={onContinueWithApple}
            onPressIn={onApplePressIn}
            onPressOut={onApplePressOut}
          >
            <Apple style={styles.apple} />
            <Text style={styles.continueWithAppleText}>
              Continue with Apple
            </Text>
          </Pressable>
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="light" />
    </View>
  );
};
