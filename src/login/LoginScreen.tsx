import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useMemo, useState } from 'react';
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

type LoginScreenProps = {
  /**
   * Called after the user successfully logs in.
   */
  onLogin: () => void;
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
 * This assumes that fonts have already been loaded.
 */
export const LoginScreen = ({ onLogin }: LoginScreenProps): ReactElement => {
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

  const onContinueWithGoogle = useCallback(async () => {
    setGoingToGoogle(true);
    setError(null);
    try {
      const { url, redirectUrl } = await prepareLink('Google');
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

      console.log('login succeeded: ', result);
    } catch (e) {
      setError(await describeError(e));
    } finally {
      setGoingToGoogle(false);
    }
  }, []);

  const onContinueWithApple = useCallback(async () => {
    setGoingToApple(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
      setError(await describeError(e));
    } finally {
      setGoingToApple(false);
    }
  }, []);

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
            We won't post to any of your accounts without asking first.
          </Text>
        </View>
      </OsehImageBackground>
      <StatusBar style="light" />
    </View>
  );
};
