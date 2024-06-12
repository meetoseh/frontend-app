import { ReactElement, useCallback, useContext, useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { styles } from './LoginScreenStyles';
import Constants from 'expo-constants';
import { SplashScreen } from '../../../splash/SplashScreen';
import Google from './icons/Google';
import Apple from './icons/Apple';
import { StatusBar } from 'expo-status-bar';
import OsehWordmarkWhite from './icons/OsehWordmarkWhite';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../shared/components/ErrorBanner';
import { describeError } from '../../../../shared/lib/describeError';
import { URLSearchParams } from 'react-native-url-polyfill';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useUnwrappedValueWithCallbacks } from '../../../../shared/hooks/useUnwrappedValueWithCallbacks';
import {
  LoginMessage,
  ReadableLoginMessagePipe,
  createReadPipeIfAvailable,
  createWritePipe,
} from './LoginMessagePipe';
import {
  Callbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useIsMounted } from '../../../../shared/hooks/useIsMounted';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { OsehImageBackgroundFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import Email from './icons/Email';
import { useIsTablet } from '../../../../shared/lib/useIsTablet';
import { ProvidersList } from './components/ProvidersList';
import { useOsehImageStateValueWithCallbacks } from '../../../../shared/images/useOsehImageStateValueWithCallbacks';
import {
  useWindowSize,
  useWindowSizeValueWithCallbacks,
} from '../../../../shared/hooks/useWindowSize';
import { useOsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { OsehImageProps } from '../../../../shared/images/OsehImageProps';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';

/* guest -> random guest; apple -> random guest no name */
const DEV_ACCOUNT_USER_IDENTITY_ID: string = 'timothy';

const prepareLink = async (
  provider: 'Google' | 'SignInWithApple' | 'Direct'
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
 * The standard full screen component for logging in, which
 * presents the user with options to log in with Google, Apple,
 * or Direct
 */
export const Login = () => {
  const loginContextRaw = useContext(LoginContext);
  const checkedMessagePipeVWC = useWritableValueWithCallbacks(() => false);
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const mountedVWC = useIsMounted();

  const onMessageFromPipe = useCallback(
    (result: LoginMessage) => {
      if (result.type === 'cancel') {
        setVWC(
          errorVWC,
          <ErrorBanner>
            <ErrorBannerText>
              Authorization failed: cancelled by user
            </ErrorBannerText>
          </ErrorBanner>
        );
      } else if (result.type === 'dismiss') {
        console.log('dismissed by user; ignoring');
      } else if (result.type === 'unknown') {
        setVWC(
          errorVWC,
          <ErrorBanner>
            <ErrorBannerText>
              Authorization failed: unknown result ({result.rawType})
            </ErrorBannerText>
          </ErrorBanner>
        );
      } else if (result.type === 'error') {
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
        ((() => {}) as (t: 'success') => void)(result.type);

        const { idToken, refreshToken, onboard } = result;
        loginContextRaw.setAuthTokens.call(undefined, {
          idToken,
          refreshToken: refreshToken ?? null,
        });
      }
    },
    [loginContextRaw.setAuthTokens, errorVWC]
  );

  useEffect(() => {
    if (checkedMessagePipeVWC.get()) {
      return;
    }

    let active = true;
    const cancelers = new Callbacks<undefined>();
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
        console.log('login failed to create read pipe: ', e);
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
        const timeoutPromise = new Promise<void>((resolve) =>
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
    async (provider: 'Google' | 'SignInWithApple' | 'Direct') => {
      const options: WebBrowser.AuthSessionOpenOptions = {};
      if (Platform.OS === 'ios' && provider === 'Google') {
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
          if (result.type === 'cancel') {
            sendPipeMessageOrApplyImmediately({ type: 'cancel' });
            return;
          } else if (result.type === 'dismiss') {
            sendPipeMessageOrApplyImmediately({ type: 'dismiss' });
            return;
          } else if (result.type !== 'success') {
            sendPipeMessageOrApplyImmediately({
              type: 'unknown',
              rawType: result.type,
            });
            return;
          }
          const params = new URLSearchParams(
            result.url.substring(result.url.indexOf('#') + 1)
          );
          if (params.get('auth_error') === '1') {
            const errorMessage = params.get('auth_error_message');
            sendPipeMessageOrApplyImmediately({
              type: 'error',
              message: errorMessage ?? '',
            });
            return;
          }

          const idToken = params.get('id_token');
          if (!idToken) {
            sendPipeMessageOrApplyImmediately({
              type: 'error',
              message: 'no id token',
            });
            return;
          }

          const refreshToken = params.get('refresh_token') ?? undefined;
          const onboard = params.get('onboard') === '1';

          sendPipeMessageOrApplyImmediately({
            type: 'success',
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
    [onMessageFromPipe, mountedVWC, errorVWC]
  );

  const onLongPressMessage = useCallback(async () => {
    if (Constants.expoConfig?.extra?.environment !== 'dev') {
      return;
    }

    setVWC(errorVWC, null);
    try {
      const sub = selectDevAccountSub();
      console.log('logging in as dev account:', sub);

      const response = await apiFetch(
        '/api/1/dev/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            sub,
            refresh_token_desired: true,
          }),
        },
        null
      );

      if (!response.ok) {
        throw response;
      }

      const data: {
        id_token: string;
        refresh_token: string;
        onboard: boolean;
      } = await response.json();
      await loginContextRaw.setAuthTokens({
        idToken: data.id_token,
        refreshToken: data.refresh_token,
      });
    } catch (e) {
      setVWC(errorVWC, await describeError(e));
    }
  }, [loginContextRaw, errorVWC]);

  const checkedMessagePipe = useUnwrappedValueWithCallbacks(
    checkedMessagePipeVWC
  );

  const contentWidth = useContentWidth();

  useEffect(() => {
    (async () => {
      await requestTrackingPermissionsAsync();
    })();
  }, []);

  const isTablet = useIsTablet();

  const imageHandler = useOsehImageStateRequestHandler({});
  const backgroundPropsVWC = useMappedValueWithCallbacks(
    useWindowSizeValueWithCallbacks(),
    (size): OsehImageProps => ({
      uid: 'oseh_if_NOA1u2xYanYQlA8rdpPEQQ',
      jwt: null,
      displayWidth: size.width,
      displayHeight: size.height,
      alt: '',
      isPublic: true,
      placeholderColor: '#040b17',
    })
  );
  const backgroundVWC = useOsehImageStateValueWithCallbacks(
    adaptValueWithCallbacksAsVariableStrategyProps(backgroundPropsVWC),
    imageHandler
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
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={backgroundVWC}
        style={{
          ...styles.content,
          ...(isTablet ? styles.contentTablet : {}),
          width: contentWidth,
        }}
      >
        <OsehWordmarkWhite width={163} height={40} style={styles.logo} />
        <Text style={styles.message} onLongPress={onLongPressMessage}>
          Reclaim your Calm
        </Text>
        <ProvidersList
          items={[
            {
              key: 'Google',
              icon: <Google style={styles.google} />,
              name: 'Sign in with Google',
            },
            {
              key: 'SignInWithApple',
              icon: <Apple style={styles.apple} />,
              name: 'Sign in with Apple',
            },
            {
              key: 'Direct',
              icon: <Email style={styles.email} />,
              name: 'Sign in with Email',
            },
          ]}
          onItemPressed={(key) => onContinueWithProvider(key)}
        />
        <View style={{ height: 56 }} />
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};

function selectDevAccountSub() {
  if (DEV_ACCOUNT_USER_IDENTITY_ID === 'guest') {
    return `guest-${Math.random().toString(36).substring(2)}`;
  }

  if (DEV_ACCOUNT_USER_IDENTITY_ID === 'apple') {
    return `apple-${Math.random().toString(36).substring(2)}`;
  }

  return DEV_ACCOUNT_USER_IDENTITY_ID;
}