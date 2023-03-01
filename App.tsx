import { useFonts } from 'expo-font';
import { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { LoginScreen } from './src/login/LoginScreen';
import { SplashScreen } from './src/splash/SplashScreen';
import { LoginContext, LoginProvider } from './src/shared/contexts/LoginContext';
import { IntroductoryJourneyScreen } from './src/journey/IntroductoryJourneyScreen';
import { CurrentDailyEvent } from './src/daily_event/CurrentDailyEvent';
import { JourneyRef } from './src/journey/models/JourneyRef';
import { JourneyRouter } from './src/journey/JourneyRouter';
import { View, ViewStyle } from 'react-native';

/**
 * The allowed identifiers for screens
 */
export type ScreenId =
  | 'splash'
  | 'login'
  | 'introductory-journey'
  | 'current-daily-event'
  | 'journey';

export default function App() {
  return (
    <LoginProvider>
      <AppInner />
    </LoginProvider>
  );
}
/**
 * Entry point into the application. Selects a screen to render, providing it
 * with the ability to switch screens.
 */
const AppInner = () => {
  const loginContext = useContext(LoginContext);
  const [screen, setScreen] = useState<ScreenId>('splash');
  const [loadingForced, setLoadingForced] = useState(true);
  const [journey, setJourney] = useState<JourneyRef | null>(null);
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
  const [error, setError] = useState<ReactElement | null>(null);

  const clearLoadingForced = useCallback(() => {
    setLoadingForced(false);
  }, []);

  useEffect(() => {
    if (!fontsLoaded || loginContext.state === 'loading') {
      setScreen('splash');
      return;
    }

    if (loginContext.state === 'logged-out') {
      setScreen('login');
      return;
    }

    setScreen('current-daily-event');
  }, [fontsLoaded, loginContext.state]);

  const setErrorAndDoNothing = useCallback((error?: ReactElement | null) => {
    if (error === undefined) {
      error = null;
    }
    setError(error);
  }, []);

  const doNothing = useCallback(() => {
    // do nothing; for things not yet implemented
    console.log('doNothing');
  }, []);

  const gotoJourney = useCallback((journey: JourneyRef) => {
    setJourney(journey);
    setScreen('journey');
  }, []);

  const gotoDailyEvent = useCallback(() => {
    setJourney(null);
    setScreen('current-daily-event');
  }, []);

  const inner = (() => {
    if (screen === 'splash') {
      return <SplashScreen type="wordmark" />;
    }
    if (screen === 'login') {
      return <LoginScreen onLogin={doNothing} initialError={error} onReady={clearLoadingForced} />;
    }
    if (screen === 'introductory-journey') {
      return (
        <IntroductoryJourneyScreen onFinished={setErrorAndDoNothing} onReady={clearLoadingForced} />
      );
    }
    if (screen === 'current-daily-event') {
      return (
        <CurrentDailyEvent
          onGotoSettings={doNothing}
          onGotoJourney={gotoJourney}
          onReady={clearLoadingForced}
        />
      );
    }
    if (screen === 'journey') {
      if (journey === null) {
        return <SplashScreen />;
      }
      return (
        <JourneyRouter
          journey={journey}
          onFinished={gotoDailyEvent}
          isOnboarding={false}
          initialError={null}
          onReady={clearLoadingForced}
        />
      );
    }

    throw new Error(`Unknown screen: ${screen}`);
  })();

  return (
    <View style={MOUNTED_HIDDEN_CONTAINER}>
      <View style={loadingForced ? DISPLAY_NONE : {}}>{inner}</View>
      {loadingForced ? <SplashScreen type="wordmark" /> : null}
    </View>
  );
};

const DISPLAY_NONE: ViewStyle = { display: 'none' };
const MOUNTED_HIDDEN_CONTAINER: ViewStyle = {
  flex: 1,
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  position: 'absolute',
};
