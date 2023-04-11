import { useFonts } from 'expo-font';
import { useMemo, useState } from 'react';
import { useStatefulScreen } from './src/shared/lib/useStatefulScreen';
import { LoginScreen } from './src/login/LoginScreen';
import { GreedyScreenManager } from './src/shared/components/GreedyScreenManager';
import { SplashScreen } from './src/splash/SplashScreen';
import { LoginProvider } from './src/shared/contexts/LoginContext';
import { DailyEventScreen } from './src/daily_event/screens/DailyEventScreen';

/**
 * The allowed identifiers for screens
 * @deprecated
 */
export type ScreenId =
  | 'splash'
  | 'login'
  | 'introductory-journey'
  | 'current-daily-event'
  | 'journey'
  | 'settings'
  | 'upgrade';

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
  const [sharedState, setSharedState] = useState<object>({});
  const loginScreen = useStatefulScreen(LoginScreen, sharedState, setSharedState);
  const dailyEventScreen = useStatefulScreen(DailyEventScreen, sharedState, setSharedState);
  const screens = useMemo(() => [loginScreen, dailyEventScreen], [loginScreen, dailyEventScreen]);

  if (!fontsLoaded) {
    return <SplashScreen type="wordmark" />;
  }

  return <GreedyScreenManager screens={screens} />;
};
