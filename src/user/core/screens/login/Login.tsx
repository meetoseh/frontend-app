import { ReactElement, useCallback, useEffect, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { styles } from './LoginScreenStyles';
import Constants from 'expo-constants';
import OsehWordmarkWhite from './icons/OsehWordmarkWhite';
import { isSilentAuthSupported } from '../../../../shared/contexts/LoginContext';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { URLSearchParams } from 'react-native-url-polyfill';
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
import { ProvidersList } from './components/ProvidersList';
import { OauthProvider } from '../../../login/lib/OauthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { VISITOR_SOURCE } from '../../../../shared/lib/visitorSource';
import { SCREEN_VERSION } from '../../../../shared/lib/screenVersion';
import { Passkey } from 'react-native-passkey';
import { Passkey as PasskeyIcon } from '../../../../shared/components/icons/Passkey';
import { OsehColors } from '../../../../shared/OsehColors';
import { Google } from '../../../../shared/components/icons/Google';
import { Apple } from '../../../../shared/components/icons/Apple';
import { Email } from '../../../../shared/components/icons/Email';
import { Anonymous } from '../../../../shared/components/icons/Anonymous';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { ScreenContext } from '../../hooks/useScreenContext';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { showYesNoModal } from '../../../../shared/lib/showYesNoModal';
import {
  chooseErrorFromStatus,
  DisplayableError,
} from '../../../../shared/lib/errors';

/* guest -> random guest; apple -> random guest no name */
const DEV_ACCOUNT_USER_IDENTITY_ID: string = 'guest-original';

let failedLogin = false;

const prepareLink = async (
  provider: 'Google' | 'SignInWithApple' | 'Direct' | 'Dev'
): Promise<{ url: string; redirectUrl: string }> => {
  const redirectUrl = Linking.createURL('login_callback');
  let response;
  try {
    response = await apiFetch(
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
  } catch {
    throw new DisplayableError('connectivity', `prepare ${provider}`);
  }

  if (!response.ok) {
    throw chooseErrorFromStatus(response.status, `prepare ${provider}`);
  }

  const data: { url: string } = await response.json();
  return { url: data.url, redirectUrl };
};

export const LOGIN_ICONS_BY_PROVIDER: Record<
  OauthProvider,
  (color?: string) => ReactElement
> = {
  Google: (color) => (
    <Google
      icon={{
        width: 18,
      }}
      container={{
        width: 32,
        height: 20,
      }}
      startPadding={{
        x: {
          fixed: 1,
        },
        y: {
          fraction: 0.5,
        },
      }}
      color={color ?? OsehColors.v4.primary.dark}
    />
  ),
  SignInWithApple: (color) => (
    <Apple
      icon={{
        width: 18,
      }}
      container={{
        width: 32,
        height: 20,
      }}
      startPadding={{
        x: {
          fixed: 1,
        },
        y: {
          fraction: 0.5,
        },
      }}
      color={color ?? OsehColors.v4.primary.dark}
    />
  ),
  Direct: (color) => (
    <Email
      icon={{
        width: 20,
      }}
      container={{
        width: 32,
        height: 20,
      }}
      startPadding={{
        x: {
          fraction: 0,
        },
        y: {
          fraction: 0.5,
        },
      }}
      color={color ?? OsehColors.v4.primary.dark}
    />
  ),
  Dev: (color) => (
    <Email
      icon={{
        width: 20,
      }}
      container={{
        width: 32,
        height: 20,
      }}
      startPadding={{
        x: {
          fraction: 0,
        },
        y: {
          fraction: 0.5,
        },
      }}
      color={color ?? OsehColors.v4.primary.dark}
    />
  ),
  Silent: (color) => (
    <Anonymous
      icon={{
        width: 20,
      }}
      container={{
        width: 32,
        height: 20,
      }}
      startPadding={{
        x: {
          fixed: 60,
        },
        y: {
          fraction: 0.5,
        },
      }}
      color={color ?? OsehColors.v4.primary.dark}
    />
  ),
  Passkey: (color) => (
    <PasskeyIcon
      icon={{
        width: 20,
      }}
      container={{
        width: 32,
        height: 20,
      }}
      startPadding={{
        x: {
          fraction: 0,
        },
        y: {
          fraction: 0.5,
        },
      }}
      color={color ?? OsehColors.v4.primary.dark}
    />
  ),
};

export const LOGIN_NAMES_BY_PROVIDER: Record<OauthProvider, string> = {
  Google: 'Sign in with Google',
  SignInWithApple: 'Sign in with Apple',
  Direct: 'Sign in with Email',
  Dev: 'Sign in as Developer',
  Silent: 'Sign in later',
  Passkey: 'Sign in with Passkey',
};

const isDev = Constants.expoConfig?.extra?.environment === 'dev';

/**
 * The standard full screen component for logging in, which
 * presents the user with options to log in with Google, Apple,
 * or Direct
 */
export const Login = ({ ctx }: { ctx: ScreenContext }) => {
  const checkedMessagePipeVWC = useWritableValueWithCallbacks(() => false);
  const errorVWC = useWritableValueWithCallbacks<DisplayableError | null>(
    () => null
  );
  const mountedVWC = useIsMounted();

  const onMessageFromPipe = useCallback(
    (result: LoginMessage) => {
      if (result.type !== 'success') {
        failedLogin = true;
      }

      if (result.type === 'cancel') {
        setVWC(
          errorVWC,
          new DisplayableError('client', 'login', 'cancelled by user')
        );
      } else if (result.type === 'dismiss') {
        console.log('dismissed by user; ignoring');
      } else if (result.type === 'unknown') {
        setVWC(
          errorVWC,
          new DisplayableError('client', 'login', `${result.rawType}`)
        );
      } else if (result.type === 'error') {
        setVWC(
          errorVWC,
          new DisplayableError('client', 'login', `${result.message}`)
        );
      } else {
        // ensures no missing cases
        ((() => {}) as (t: 'success') => void)(result.type);

        const { idToken, refreshToken, onboard } = result;
        ctx.login.setAuthTokens.call(undefined, {
          idToken,
          refreshToken: refreshToken ?? null,
        });
      }
    },
    [ctx.login, errorVWC]
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

  const checkedIfTrackable = useRef(false);
  useEffect(() => {
    if (checkedIfTrackable.current) {
      return;
    }

    let active = true;
    handle();
    return () => {
      active = false;
    };

    async function handle() {
      if (!active || checkedIfTrackable.current) {
        return;
      }

      const specialValueInStorage = await AsyncStorage.getItem(
        'installTracked'
      );
      if (specialValueInStorage !== null) {
        checkedIfTrackable.current = true;
        return;
      }

      const specialSecret = await SecureStore.getItemAsync('installTracked');
      if (specialSecret !== null) {
        checkedIfTrackable.current = true;
        return;
      }

      if (!active) {
        return;
      }

      checkedIfTrackable.current = true;
      const response = await apiFetch(
        '/api/1/onboarding/track_possible_new_install?platform=' +
          VISITOR_SOURCE +
          '&version=' +
          SCREEN_VERSION,
        {
          method: 'POST',
          keepalive: true,
        },
        null
      );
      if (response.ok) {
        await AsyncStorage.setItem('installTracked', 'true');
        await SecureStore.setItemAsync('installTracked', 'true');
      }
    }
  }, []);

  const onContinueWithProvider = useCallback(
    async (provider: OauthProvider) => {
      if (provider === 'Passkey') {
        const response = await showYesNoModal(modals, {
          title: 'Passkey',
          body: 'Would you like to register a new passkey or sign in with an existing one?',
          cta1: 'Register',
          cta2: 'Sign in',
          emphasize: 1,
        }).promise;

        if (response === null) {
          return;
        }

        const technique = response ? 'register' : 'authenticate';

        try {
          if (technique === 'register') {
            return await handleRegister();
          } else {
            return await handleAuthenticate();
          }
        } catch (e) {
          const described =
            e instanceof DisplayableError
              ? e
              : new DisplayableError('client', 'handle passkey login', `${e}`);
          setVWC(errorVWC, described);
        }

        async function handleRegister() {
          const response = await apiFetch(
            '/api/1/oauth/passkeys/register_begin?platform=' +
              encodeURIComponent(VISITOR_SOURCE) +
              '&version=' +
              encodeURIComponent(SCREEN_VERSION),
            {
              method: 'POST',
            },
            null
          );
          if (!response.ok) {
            throw response;
          }

          const requestJson = await response.json();
          let result: Awaited<ReturnType<typeof Passkey.create>>;
          try {
            result = await Passkey.create(requestJson);
            if (typeof result === 'string') {
              // android
              result = JSON.parse(result);
            }
          } catch (e) {
            console.log('passkey regstration failed:', e);
            setVWC(
              errorVWC,
              new DisplayableError('client', 'passkey registration', `${e}`)
            );
            return;
          }
          const loginResponse = await apiFetch(
            '/api/1/oauth/passkeys/register_login_complete?platform=' +
              encodeURIComponent(VISITOR_SOURCE) +
              '&version=' +
              encodeURIComponent(SCREEN_VERSION),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              body: JSON.stringify({
                id_b64url: result.id,
                client_data_json_b64url: result.response.clientDataJSON,
                attestation_object_b64url: result.response.attestationObject,
                refresh_token_desired: true,
              }),
            },
            null
          );
          if (!loginResponse.ok) {
            throw loginResponse;
          }

          const loginResponseJson: {
            id_token: string;
            refresh_token?: string;
          } = await loginResponse.json();

          ctx.login.setAuthTokens.call(undefined, {
            idToken: loginResponseJson.id_token,
            refreshToken: loginResponseJson.refresh_token ?? null,
          });
        }

        async function handleAuthenticate() {
          const response = await apiFetch(
            '/api/1/oauth/passkeys/authenticate_begin?platform=' +
              encodeURIComponent(VISITOR_SOURCE) +
              '&version=' +
              encodeURIComponent(SCREEN_VERSION),
            {
              method: 'POST',
            },
            null
          );
          if (!response.ok) {
            throw response;
          }

          const requestJson = await response.json();
          let result: Awaited<ReturnType<typeof Passkey.get>>;
          try {
            result = await Passkey.get(requestJson);
            if (typeof result === 'string') {
              // android
              result = JSON.parse(result);
            }
          } catch (e) {
            console.log('passkey authentication failed:', e);
            setVWC(
              errorVWC,
              new DisplayableError('client', 'passkey authentication', `${e}`)
            );
            return;
          }
          const loginResponse = await apiFetch(
            '/api/1/oauth/passkeys/authenticate_login_complete?platform=' +
              encodeURIComponent(VISITOR_SOURCE) +
              '&version=' +
              encodeURIComponent(SCREEN_VERSION),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              body: JSON.stringify({
                id_b64url: result.id,
                authenticator_data_b64url: result.response.authenticatorData,
                client_data_json_b64url: result.response.clientDataJSON,
                signature_b64url: result.response.signature,
                refresh_token_desired: true,
              }),
            },
            null
          );
          if (!loginResponse.ok) {
            throw loginResponse;
          }

          const loginResponseJson: {
            id_token: string;
            refresh_token?: string;
          } = await loginResponse.json();

          ctx.login.setAuthTokens.call(undefined, {
            idToken: loginResponseJson.id_token,
            refreshToken: loginResponseJson.refresh_token ?? null,
          });
        }
        return;
      }

      if (provider === 'Silent') {
        await ctx.login.setSilentAuthPreference({ type: 'preferred' });
        return;
      }

      const options: WebBrowser.AuthSessionOpenOptions = {};
      if (Platform.OS === 'ios' && provider === 'Google' && failedLogin) {
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
        setVWC(
          errorVWC,
          e instanceof DisplayableError
            ? e
            : new DisplayableError('client', 'login', `${e}`)
        );
      }
    },
    [onMessageFromPipe, mountedVWC, errorVWC]
  );

  const onLongPressMessage = useCallback(async () => {
    if (!isDev) {
      return;
    }

    console.log('on long press');

    setVWC(errorVWC, null);
    try {
      const sub = selectDevAccountSub();
      console.log('logging in as dev account:', sub);

      let response;
      try {
        response = await apiFetch(
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
      } catch {
        throw new DisplayableError('connectivity', 'dev login');
      }

      if (!response.ok) {
        throw chooseErrorFromStatus(response.status, 'dev login');
      }

      const data: {
        id_token: string;
        refresh_token: string;
        onboard: boolean;
      } = await response.json();
      console.log('data ready, setting auth tokens..');
      await ctx.login.setAuthTokens({
        idToken: data.id_token,
        refreshToken: data.refresh_token,
      });
    } catch (e) {
      console.log('dev login failed:', e);
      console.error(e);
      setVWC(
        errorVWC,
        e instanceof DisplayableError
          ? e
          : new DisplayableError('client', 'dev login', `${e}`)
      );
    }
  }, [ctx.login, errorVWC]);

  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  useErrorModal(modals, errorVWC, { topBarHeightVWC: ctx.topBarHeight });

  const silentAuthSupportedVWC = useWritableValueWithCallbacks(
    (): boolean | null => null
  );
  useEffect(() => {
    let active = true;
    handle();
    return () => {
      active = false;
    };

    async function handle() {
      const supported = await isSilentAuthSupported();
      setVWC(silentAuthSupportedVWC, supported);
    }
  });

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar="light"
      modals={modals}
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        gridSizeVWC={ctx.windowSizeImmediate}
        contentWidthVWC={ctx.contentWidth}
        scrollable={false}
        justifyContent="flex-start"
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <View style={styles.row}>
          <HorizontalSpacer width={0} flexGrow={1} />
          <OsehWordmarkWhite width={163} height={40} />
          <HorizontalSpacer width={0} flexGrow={1} />
        </View>
        <VerticalSpacer height={0} maxHeight={24} flexGrow={1} />
        <Text
          style={styles.message}
          {...(isDev ? { onLongPress: onLongPressMessage } : {})}
        >
          Reclaim your Calm
        </Text>
        <VerticalSpacer height={0} maxHeight={48} flexGrow={1} />
        <RenderGuardedComponent
          props={silentAuthSupportedVWC}
          component={(silentAuthSupported) => (
            <ProvidersList
              items={[
                ...(silentAuthSupported
                  ? ([
                      {
                        key: 'Silent',
                        icon: LOGIN_ICONS_BY_PROVIDER['Silent'](),
                        name: LOGIN_NAMES_BY_PROVIDER['Silent'],
                      },
                    ] as const)
                  : []),
                ...(Passkey.isSupported()
                  ? ([
                      {
                        key: 'Passkey',
                        icon: LOGIN_ICONS_BY_PROVIDER['Passkey'](),
                        name: LOGIN_NAMES_BY_PROVIDER['Passkey'],
                      },
                    ] as const)
                  : []),
                {
                  key: 'Google',
                  icon: LOGIN_ICONS_BY_PROVIDER['Google'](
                    OsehColors.v4.primary.light
                  ),
                  name: LOGIN_NAMES_BY_PROVIDER['Google'],
                  deemphasize: true,
                },
                {
                  key: 'SignInWithApple',
                  icon: LOGIN_ICONS_BY_PROVIDER['SignInWithApple'](
                    OsehColors.v4.primary.light
                  ),
                  name: LOGIN_NAMES_BY_PROVIDER['SignInWithApple'],
                  deemphasize: true,
                },
                {
                  key: 'Direct',
                  icon: LOGIN_ICONS_BY_PROVIDER['Direct'](
                    OsehColors.v4.primary.light
                  ),
                  name: LOGIN_NAMES_BY_PROVIDER['Direct'],
                  deemphasize: true,
                },
              ]}
              onItemPressed={(key) => onContinueWithProvider(key)}
            />
          )}
        />
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
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
