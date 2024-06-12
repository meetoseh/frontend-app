import { useFonts } from 'expo-font';
import {
  LoginContext,
  LoginProvider,
} from './src/shared/contexts/LoginContext';
import { SplashScreen } from './src/user/splash/SplashScreen';
import { RenderGuardedComponent } from './src/shared/components/RenderGuardedComponent';
import { useConfigureBackgroundAudio } from './src/shared/hooks/useConfigureBackgroundAudio';
import { useMappedValuesWithCallbacks } from './src/shared/hooks/useMappedValuesWithCallbacks';
import { useWritableValueWithCallbacks } from './src/shared/lib/Callbacks';
import { useCallback, useContext } from 'react';
import { setVWC } from './src/shared/lib/setVWC';
import { Dimensions, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVersionedCache } from './src/shared/hooks/useVersionedCache';
import { useUnwrappedValueWithCallbacks } from './src/shared/hooks/useUnwrappedValueWithCallbacks';
import { InterestsAutoProvider } from './src/shared/contexts/InterestsContext';
import { SvgLinearGradient } from './src/shared/anim/SvgLinearGradient';
import { DARK_BLACK_GRAY_GRADIENT_SVG } from './src/styling/colors';
import { ConfirmationScreen } from './src/user/core/screens/confirmation/ConfirmationScreen';
import { OsehScreen, ScreenResources } from './src/user/core/models/Screen';
import { useScreenQueueState } from './src/user/core/hooks/useScreenQueueState';
import { USES_WEBP_STATIC } from './src/shared/images/usesWebp';
import { USES_SVG_STATIC } from './src/shared/images/usesSvg';
import { useScreenContext } from './src/user/core/hooks/useScreenContext';
import { useScreenQueue } from './src/user/core/hooks/useScreenQueue';
import Constants from 'expo-constants';
import { useTimedValueWithCallbacks } from './src/shared/hooks/useTimedValue';
import { useMappedValueWithCallbacks } from './src/shared/hooks/useMappedValueWithCallbacks';
import { useValuesWithCallbacksEffect } from './src/shared/hooks/useValuesWithCallbacksEffect';
import { Login } from './src/user/core/screens/login/Login';
import { AddPhoneScreen } from './src/user/core/screens/add_phone/AddPhoneScreen';
import { AudioInterstitialScreen } from './src/user/core/screens/audio_interstitial/AudioInterstitialScreen';
import { ChoicesScreen } from './src/user/core/screens/choices/ChoicesScreen';
import { ChooseAFeelingScreen } from './src/user/core/screens/choose_a_feeling/ChooseAFeelingScreen';
import { CompletionScreen } from './src/user/core/screens/completion/CompletionScreen';
import { EmotionScreen } from './src/user/core/screens/emotion/EmotionScreen';

export default function App() {
  // We don't want to load the features at all while the cache cannot be read.
  const cacheReadyVWC = useVersionedCache('1.1.0');
  const cacheReady = useUnwrappedValueWithCallbacks(cacheReadyVWC);

  if (!cacheReady) {
    return <SplashScreen />;
  }

  return (
    <LoginProvider>
      <InterestsAutoProvider>
        <AppInner />
      </InterestsAutoProvider>
    </LoginProvider>
  );
}

const screens = [
  AddPhoneScreen,
  AudioInterstitialScreen,
  ChoicesScreen,
  ChooseAFeelingScreen,
  CompletionScreen,
  ConfirmationScreen,
  EmotionScreen,
] as any[] as readonly OsehScreen<
  string,
  ScreenResources,
  object,
  { __mapped?: true }
>[];

/**
 * Entry point into the application. Selects a screen to render, providing it
 * with the ability to switch screens.
 */
const AppInner = () => {
  const loginContextRaw = useContext(LoginContext);
  const [fontsLoaded] = useFonts({
    'OpenSans-Bold': require('./assets/fonts/OpenSans-Bold.ttf'),
    'OpenSans-BoldItalic': require('./assets/fonts/OpenSans-BoldItalic.ttf'),
    'OpenSans-ExtraBold': require('./assets/fonts/OpenSans-ExtraBold.ttf'),
    'OpenSans-ExtraBoldItalic': require('./assets/fonts/OpenSans-ExtraBoldItalic.ttf'),
    'OpenSans-Italic': require('./assets/fonts/OpenSans-Italic.ttf'),
    'OpenSans-Light': require('./assets/fonts/OpenSans-Light.ttf'),
    'OpenSans-LightItalic': require('./assets/fonts/OpenSans-LightItalic.ttf'),
    'OpenSans-Medium': require('./assets/fonts/OpenSans-Medium.ttf'),
    'OpenSans-MediumItalic': require('./assets/fonts/OpenSans-MediumItalic.ttf'),
    'OpenSans-Regular': require('./assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-SemiBold': require('./assets/fonts/OpenSans-SemiBold.ttf'),
    'OpenSans-SemiBoldItalic': require('./assets/fonts/OpenSans-SemiBoldItalic.ttf'),
  });
  const audioConfiguredVWC = useConfigureBackgroundAudio();

  const screenQueueState = useScreenQueueState();
  const screenContext = useScreenContext(USES_WEBP_STATIC, USES_SVG_STATIC);
  const screenQueue = useScreenQueue({
    screenQueueState,
    screenContext,
    screens,
    logging:
      Constants.expoConfig?.extra?.environment === 'dev'
        ? {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
          }
        : {
            log: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
          },
  });

  const stateVWC = useWritableValueWithCallbacks<
    'loading' | 'error' | 'features'
  >(() => 'loading');
  // Since on first load the user likely sees the splash anyway, it's better to leave
  // it similar and then go straight to the content if we can do so rapidly, rather
  // than going splash -> flicker no logo -> start logo animation -> content. Of course,
  // if loading takes a while, we'll show the splash screen.
  const flashGradientInsteadOfSplashVWC = useTimedValueWithCallbacks(
    true,
    false,
    250
  );
  const beenLoadedVWC = useWritableValueWithCallbacks<boolean>(() => false);

  const screenQueueTypeVWC = useMappedValueWithCallbacks(
    screenQueue.value,
    (v) => v.type
  );
  useValuesWithCallbacksEffect(
    [loginContextRaw.value, screenQueueTypeVWC, audioConfiguredVWC],
    useCallback((): undefined => {
      const loginContextUnch = loginContextRaw.value.get();
      if (
        loginContextUnch.state === 'loading' ||
        !fontsLoaded ||
        !audioConfiguredVWC.get()
      ) {
        setVWC(stateVWC, 'loading');
        return;
      }

      const sqType = screenQueueTypeVWC.get();
      if (sqType === 'spinner') {
        setVWC(stateVWC, 'loading');
        return;
      }

      if (sqType === 'error') {
        setVWC(stateVWC, 'error');
        return;
      }

      setVWC(beenLoadedVWC, true);
      setVWC(stateVWC, 'features');
    }, [
      loginContextRaw.value,
      fontsLoaded,
      screenQueueTypeVWC,
      beenLoadedVWC,
      stateVWC,
      audioConfiguredVWC,
    ])
  );

  const splashTypeVWC = useMappedValuesWithCallbacks(
    [flashGradientInsteadOfSplashVWC, beenLoadedVWC],
    (): 'gradient' | 'word' | 'brand' => {
      if (beenLoadedVWC.get()) {
        return 'brand';
      }
      if (flashGradientInsteadOfSplashVWC.get()) {
        return 'gradient';
      }
      return 'word';
    }
  );

  const overlaySpinnerOnFeatures = useMappedValueWithCallbacks(
    screenQueue.value,
    (v) => v.type === 'finishing-pop'
  );

  const needLoginScreen = useMappedValueWithCallbacks(
    loginContextRaw.value,
    (v) => v.state === 'logged-out'
  );

  return (
    <RenderGuardedComponent
      props={needLoginScreen}
      component={(needLogin) => {
        if (needLogin) {
          return <Login />;
        }

        return (
          <>
            <RenderGuardedComponent
              props={stateVWC}
              component={(state) => {
                if (state === 'features') {
                  return (
                    <>
                      <RenderGuardedComponent
                        props={screenQueue.value}
                        component={(sq) => sq.component ?? <></>}
                      />
                      <RenderGuardedComponent
                        props={overlaySpinnerOnFeatures}
                        component={(overlay) =>
                          overlay ? <SplashScreen type="brandmark" /> : <></>
                        }
                      />
                    </>
                  );
                }

                if (state === 'error') {
                  return (
                    <RenderGuardedComponent
                      props={screenQueue.value}
                      component={(sq) =>
                        sq.error ?? (
                          <Text>
                            An error has occurred. Try restarting the app.
                          </Text>
                        )
                      }
                    />
                  );
                }

                return (
                  <RenderGuardedComponent
                    props={splashTypeVWC}
                    component={(splashType) => {
                      if (splashType === 'brand') {
                        return <SplashScreen type="brandmark" />;
                      }
                      if (splashType === 'word') {
                        return <SplashScreen type="wordmark" />;
                      }
                      const windowSize = Dimensions.get('screen');
                      return (
                        <View
                          style={{
                            width: windowSize.width,
                            height: windowSize.height,
                          }}
                        >
                          <SvgLinearGradient
                            state={DARK_BLACK_GRAY_GRADIENT_SVG}
                          />
                          <StatusBar style="light" />
                        </View>
                      );
                    }}
                  />
                );
              }}
            />
          </>
        );
      }}
    />
  );
};
