import { useFonts } from "expo-font";
import { LoginProvider } from "./src/shared/contexts/LoginContext";
import { SplashScreen } from "./src/user/splash/SplashScreen";
import { useFeaturesState } from "./src/user/core/hooks/useFeaturesState";
import { FeaturesRouter } from "./src/user/core/FeaturesRouter";

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
    "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
    "OpenSans-BoldItalic": require("./assets/fonts/OpenSans-BoldItalic.ttf"),
    "OpenSans-ExtraBold": require("./assets/fonts/OpenSans-ExtraBold.ttf"),
    "OpenSans-ExtraBoldItalic": require("./assets/fonts/OpenSans-ExtraBoldItalic.ttf"),
    "OpenSans-Italic": require("./assets/fonts/OpenSans-Italic.ttf"),
    "OpenSans-Light": require("./assets/fonts/OpenSans-Light.ttf"),
    "OpenSans-LightItalic": require("./assets/fonts/OpenSans-LightItalic.ttf"),
    "OpenSans-Medium": require("./assets/fonts/OpenSans-Medium.ttf"),
    "OpenSans-MediumItalic": require("./assets/fonts/OpenSans-MediumItalic.ttf"),
    "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
    "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
    "OpenSans-SemiBoldItalic": require("./assets/fonts/OpenSans-SemiBoldItalic.ttf"),
  });
  const featuresState = useFeaturesState();

  if (!fontsLoaded || featuresState.loading) {
    return <SplashScreen type="wordmark" />;
  }

  return <FeaturesRouter state={featuresState} />;
};
