import { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LoginContext } from '../shared/contexts/LoginContext';
import {
  OsehImageState,
  OsehImageStateChangedEvent,
  ensureHandlingImage,
  removeImageIfPresent,
  useOsehImageStatesRef,
} from '../shared/hooks/useOsehImage';
import { OsehScreen } from '../shared/models/OsehScreen';
import { ScreenState } from '../shared/models/ScreenState';
import { useScreenSize } from '../shared/hooks/useScreenSize';
import { Pressable, ScaledSize, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { apiFetch } from '../shared/lib/apiFetch';
import * as WebBrowser from 'expo-web-browser';
import { ErrorBanner, ErrorBannerText } from '../shared/components/ErrorBanner';
import { describeError } from '../shared/lib/describeError';
import { styles } from './LoginScreenStyles';
import Constants from 'expo-constants';
import { SplashScreen } from '../splash/SplashScreen';
import { OsehImageBackgroundFromState } from '../shared/components/OsehImageBackgroundFromState';
import Google from './icons/Google';
import Apple from './icons/Apple';
import { StatusBar } from 'expo-status-bar';
import OsehBrandmarkWhite from './icons/OsehBrandmarkWhite';

type LoginScreenState = ScreenState & {
  /**
   * True if the user logged in and hasn't gone through onboarding,
   * false if the user either was already logged in or logged in and has already
   * gone through onboarding, undefined if unsure.
   */
  onboard: boolean | undefined;

  /**
   * Called to set the onboard value. This should only be used by components
   * reacting to new login JWTs or by components which manage the onboarding
   * process
   */
  setOnboard: (onboard: boolean) => void;
};
type LoginScreenResources = {
  background: OsehImageState | null;
  windowSize: ScaledSize;
  loading: boolean;
};

/**
 * Presents the user with the ability to login when they are logged out.
 */
export const LoginScreen: OsehScreen<LoginScreenState, LoginScreenResources, object> = {
  useState() {
    const loginContext = useContext(LoginContext);
    const [onboard, setOnboard] = useState<boolean>(false);

    return useMemo(
      () => ({
        required: loginContext.state === 'loading' ? undefined : loginContext.state !== 'logged-in',
        onboard: loginContext.state === 'loading' ? undefined : onboard,
        setOnboard,
      }),
      [loginContext.state, onboard]
    );
  },

  useResources(state, load) {
    const windowSize = useScreenSize();
    const images = useOsehImageStatesRef({});
    const [background, setBackground] = useState<OsehImageState | null>(null);

    const backgroundUid =
      windowSize.width < 450 ? 'oseh_if_ds8R1NIo4ch3pD7vBRT2cg' : 'oseh_if_hH68hcmVBYHanoivLMgstg';

    useEffect(() => {
      if (!load) {
        return;
      }

      ensureHandlingImage(images, backgroundUid, {
        uid: backgroundUid,
        jwt: null,
        displayWidth: windowSize.width,
        displayHeight: windowSize.height,
        isPublic: true,
        alt: '',
      });
      const newState = images.state.current.get(backgroundUid);
      if (newState !== undefined) {
        setBackground(newState);
      } else {
        setBackground(null);
      }
      images.onStateChanged.current.add(handleStateChanged);

      return () => {
        images.onStateChanged.current.remove(handleStateChanged);
        removeImageIfPresent(images, backgroundUid);
        setBackground(null);
      };

      function handleStateChanged(e: OsehImageStateChangedEvent) {
        if (e.uid !== backgroundUid) {
          return;
        }

        setBackground(e.current);
      }
    }, [load, backgroundUid, images, windowSize]);

    return useMemo(
      () => ({
        background,
        windowSize,
        loading: background === null || background.loading,
      }),
      [background, windowSize]
    );
  },

  component: (state, resources) => <LoginScreenComponent state={state} resources={resources} />,
};

const DEV_ACCOUNT_USER_IDENTITY_ID = 'guest9833';

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

const LoginScreenComponent = ({
  state,
  resources,
}: {
  state: LoginScreenState;
  resources: LoginScreenResources;
}) => {
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
        state.setOnboard.call(undefined, onboard);
      } catch (e) {
        setError(await describeError(e));
      }
    },
    [loginContext.setAuthTokens, state.setOnboard]
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

  const onPressMessage = useCallback(async () => {
    if (Constants.expoConfig?.extra?.environment !== 'dev') {
      return;
    }

    setError(null);
    try {
      const response = await apiFetch(
        '/api/1/dev/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
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

      const data: { id_token: string; refresh_token: string; onboard: boolean } =
        await response.json();
      await loginContext.setAuthTokens({
        idToken: data.id_token,
        refreshToken: data.refresh_token,
      });
      state.setOnboard.call(undefined, data.onboard);
    } catch (e) {
      setError(await describeError(e));
    }
  }, [loginContext, state.setOnboard]);

  if (goingToApple || goingToGoogle) {
    if (pressingApple) {
      setPressingApple(false);
    }
    if (pressingGoogle) {
      setPressingGoogle(false);
    }
    return <SplashScreen />;
  }

  if (resources.background === null) {
    return <></>;
  }

  return (
    <View style={styles.container}>
      {error}
      <OsehImageBackgroundFromState state={resources.background} style={styles.content}>
        <OsehBrandmarkWhite width={163} height={40} style={styles.logo} />
        <Text style={styles.message} onPress={onPressMessage}>
          Make mindfulness a daily part of your life in 60 seconds.
        </Text>
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
      </OsehImageBackgroundFromState>
      <StatusBar style="light" />
    </View>
  );
};
