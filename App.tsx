import { useFonts } from 'expo-font';
import { ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { LoginScreen } from './src/login/LoginScreen';
import { SplashScreen } from './src/splash/SplashScreen';
import { LoginContext, LoginProvider } from './src/shared/contexts/LoginContext';
import { IntroductoryJourneyScreen } from './src/journey/IntroductoryJourneyScreen';

/**
 * The allowed identifiers for screens
 */
export type ScreenId = 'splash' | 'login' | 'introductory-journey';

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

  useEffect(() => {
    if (!fontsLoaded || loginContext.state === 'loading') {
      setScreen('splash');
      return;
    }

    if (loginContext.state === 'logged-out') {
      setScreen('login');
      return;
    }

    setScreen('introductory-journey');
  }, [fontsLoaded, loginContext.state]);

  const setErrorAndDoNothing = useCallback((error?: ReactElement | null) => {
    if (error === undefined) {
      error = null;
    }
    setError(error);
  }, []);

  const doNothing = useCallback(() => {
    // do nothing; for things not yet implemented
  }, []);

  if (screen === 'splash') {
    return <SplashScreen type="wordmark" />;
  }
  if (screen === 'login') {
    return <LoginScreen onLogin={doNothing} initialError={error} />;
  }
  if (screen === 'introductory-journey') {
    return <IntroductoryJourneyScreen onFinished={setErrorAndDoNothing} />;
  }

  throw new Error(`Unknown screen: ${screen}`);
};
