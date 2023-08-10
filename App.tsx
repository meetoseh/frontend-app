import { useFonts } from "expo-font";
import { LoginProvider } from "./src/shared/contexts/LoginContext";
import { SplashScreen } from "./src/user/splash/SplashScreen";
import { useFeaturesState } from "./src/user/core/hooks/useFeaturesState";
import { RenderGuardedComponent } from "./src/shared/components/RenderGuardedComponent";
import { useConfigureBackgroundAudio } from "./src/shared/hooks/useConfigureBackgroundAudio";
import { useMappedValuesWithCallbacks } from "./src/shared/hooks/useMappedValuesWithCallbacks";
import { useWritableValueWithCallbacks } from "./src/shared/lib/Callbacks";
import { useValueWithCallbacksEffect } from "./src/shared/hooks/useValueWithCallbacksEffect";
import { useCallback } from "react";
import { setVWC } from "./src/shared/lib/setVWC";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useVersionedCache } from "./src/shared/hooks/useVersionedCache";
import { useUnwrappedValueWithCallbacks } from "./src/shared/hooks/useUnwrappedValueWithCallbacks";

export default function App() {
  // We don't want to load the features at all while the cache cannot be read.
  const cacheReadyVWC = useVersionedCache("1.0.4");
  const cacheReady = useUnwrappedValueWithCallbacks(cacheReadyVWC);

  if (!cacheReady) {
    return <SplashScreen />;
  }

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
  const audioConfiguredVWC = useConfigureBackgroundAudio();
  const featureVWC = useFeaturesState();

  const featureIfReadyVWC = useMappedValuesWithCallbacks(
    [featureVWC, audioConfiguredVWC],
    () => {
      const feature = featureVWC.get();
      const audioConfigured = audioConfiguredVWC.get();

      if (
        feature === null ||
        feature === undefined ||
        !audioConfigured ||
        !fontsLoaded
      ) {
        return null;
      }

      return feature;
    }
  );

  const flashGreenVWC = useWritableValueWithCallbacks<boolean>(() => false);
  useValueWithCallbacksEffect(
    featureIfReadyVWC,
    useCallback((feature) => {
      if (feature !== null) {
        setVWC(flashGreenVWC, true);
        return undefined;
      }

      if (!flashGreenVWC.get()) {
        return undefined;
      }

      let active = true;
      let timeout: NodeJS.Timeout | null = setTimeout(() => {
        if (!active) {
          return;
        }
        timeout = null;
        setVWC(flashGreenVWC, false);
      }, 1000);
      return () => {
        active = false;
        if (timeout !== null) {
          clearTimeout(timeout);
          timeout = null;
        }
      };
    }, [])
  );

  return (
    <RenderGuardedComponent
      props={featureIfReadyVWC}
      component={(feature) => {
        if (feature === null) {
          return (
            <RenderGuardedComponent
              props={flashGreenVWC}
              component={(flashGreen) => {
                if (!flashGreen) {
                  return <SplashScreen type="wordmark" />;
                }

                return (
                  <View style={{ flex: 1, backgroundColor: "#253a41" }}>
                    <StatusBar style="light" />
                  </View>
                );
              }}
            />
          );
        }

        return feature;
      }}
    />
  );
};
