import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { LoginScreen } from './src/login/LoginScreen';
import { SplashScreen } from './src/splash/SplashScreen';
import * as Linking from 'expo-linking';

/**
 * The allowed identifiers for screens
 */
export type ScreenId = 'splash' | 'login';

/**
 * Entry point into the application. Selects a screen to render, providing it
 * with the ability to switch screens.
 */
export default function App() {
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

  (async () => {
    const initialUrl = await Linking.getInitialURL();
    console.log('initialUrl', initialUrl);
  })();

  useEffect(() => {
    if (!fontsLoaded) {
      setScreen('splash');
      return;
    }

    setScreen('login');
  }, [fontsLoaded]);

  const doNothing = useCallback(() => {}, []);

  if (screen === 'splash') {
    return <SplashScreen />;
  }
  if (screen === 'login') {
    return <LoginScreen onLogin={doNothing} />;
  }

  throw new Error(`Unknown screen: ${screen}`);
}
