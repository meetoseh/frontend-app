import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { OsehImageBackground } from '../shared/components/OsehImageBackground';
import { useScreenSize } from '../shared/hooks/useScreenSize';
import { styles } from './LoginScreenStyles';
import Apple from './icons/Apple';
import Google from './icons/Google';
import { SplashScreen } from '../splash/SplashScreen';
import { describeError } from '../shared/lib/describeError';
import * as WebBrowser from 'expo-web-browser';
import { apiFetch } from '../shared/lib/apiFetch';
import { ErrorBanner, ErrorBannerText } from '../shared/components/ErrorBanner';
import * as Linking from 'expo-linking';
import { URLSearchParams } from 'react-native-url-polyfill';
import { LoginContext } from '../shared/contexts/LoginContext';

type LoginScreenProps = {
  /**
   * Called after the user successfully logs in.
   *
   * @param onboard True if the user should be directed through the onboarding flow, false otherwise
   */
  onLogin: (onboard: boolean) => void;
};

const prepareLink = async (
  provider: 'Google' | 'SignInWithApple'
): Promise<{ url: string; redirectUrl: string }> => {
  const redirectUrl = Linking.createURL('login_callback');
  const response = await apiFetch(
    '/api/1/oauth/prepare',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
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
 * Allows the user to login. The user should not be directed here if they
 * are already logged in, but if they are, this will allow them to login to
 * a new account, potentially skipping some of our standard logout process.
 *
 * This assumes that fonts have already been loaded. Requires the login context.
 */
export const LoginScreen = ({ onLogin }: LoginScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const dims = useScreenSize();
  const [pressingGoogle, setPressingGoogle] = useState(false);
  const [pressingApple, setPressingApple] = useState(false);
  const [goingToGoogle, setGoingToGoogle] = useState(false);
  const [goingToApple, setGoingToApple] = useState(false);
  const [error, setError] = useState<ReactElement | null>(null);

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
    async (provider: 'Google' | 'SignInWithApple') => {
      setError(null);
      try {
        const { url, redirectUrl } = await prepareLink(provider);
        const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
        if (result.type === 'cancel') {
          setError(
            <ErrorBanner>
              <ErrorBannerText>Authorization failed: cancelled by user</ErrorBannerText>
            </ErrorBanner>
          );
          return;
        } else if (result.type === 'dismiss') {
          console.log('dismissed by user; ignoring');
          return;
        } else if (result.type !== 'success') {
          setError(
            <ErrorBanner>
              <ErrorBannerText>Authorization failed: unknown error</ErrorBannerText>
            </ErrorBanner>
          );
          return;
        }
        const params = new URLSearchParams(result.url.substring(result.url.indexOf('#') + 1));
        if (params.get('auth_error') === '1') {
          const errorMessage = params.get('auth_error_message');
          setError(
            <ErrorBanner>
              <ErrorBannerText>Authorization failed: {errorMessage}</ErrorBannerText>
            </ErrorBanner>
          );
          return;
        }

        const idToken = params.get('id_token');
        if (!idToken) {
          setError(
            <ErrorBanner>
              <ErrorBannerText>Authorization failed: no id token</ErrorBannerText>
            </ErrorBanner>
          );
          return;
        }

        const refreshToken = params.get('refresh_token') ?? null;
        const onboard = params.get('onboard') === '1';

        const tokenResponse = {
          idToken,
          refreshToken,
        };

        loginContext.setAuthTokens.apply(undefined, [tokenResponse]);
        onLogin(onboard);
      } catch (e) {
        setError(await describeError(e));
      }
    },
    [loginContext.setAuthTokens, onLogin]
  );

  const onContinueWithGoogle = useCallback(async () => {
    setGoingToGoogle(true);
    try {
      onContinueWithProvider('Google');
    } finally {
      setGoingToGoogle(false);
    }
  }, [onContinueWithProvider]);

  const onContinueWithApple = useCallback(async () => {
    setGoingToApple(true);
    try {
      onContinueWithProvider('SignInWithApple');
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
      <OsehImageBackground
        uid="oseh_if_hH68hcmVBYHanoivLMgstg"
        jwt={null}
        displayWidth={dims.width}
        displayHeight={dims.height}
        alt=""
        isPublic={true}
        style={styles.content}>
        <Text style={styles.header}>Sign in with your social account</Text>
        <View style={styles.continueWithGoogleContainer}>
          <Pressable
            style={googleStyles}
            onPress={onContinueWithGoogle}
            onPressIn={onGooglePressIn}
            onPressOut={onGooglePressOut}>
            <Google style={styles.google} />
            <Text style={styles.continueWithGoogleText}>Continue with Google</Text>
          </Pressable>
        </View>
        <View style={styles.continueWithAppleContainer}>
          <Pressable
            style={appleStyles}
            onPress={onContinueWithApple}
            onPressIn={onApplePressIn}
            onPressOut={onApplePressOut}>
            <Apple style={styles.apple} />
            <Text style={styles.continueWithAppleText}>Continue with Apple</Text>
          </Pressable>
        </View>
        <View style={styles.legalContainer}>
          <Text style={styles.legal}>
            We won&rquo;t post to any of your accounts without asking first.
          </Text>
        </View>
      </OsehImageBackground>
      <StatusBar style="light" />
    </View>
  );
};
