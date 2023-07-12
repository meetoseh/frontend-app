import { ReactElement, useCallback, useContext, useRef } from "react";
import { LoginContext } from "../../../shared/contexts/LoginContext";
import { JourneyScreenProps } from "../models/JourneyScreenProps";
import { styles } from "./JourneyLobbyScreenStyles";
import { JourneyPrompt } from "../components/JourneyPrompt";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { useUnwrappedValueWithCallbacks } from "../../../shared/hooks/useUnwrappedValueWithCallbacks";
import { View } from "react-native";
import { OsehImageBackgroundFromState } from "../../../shared/images/OsehImageBackgroundFromState";
import { StatusBar } from "expo-status-bar";
import { CloseButton } from "../../../shared/components/CloseButton";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";

/**
 * Shows the screen for the lobby prior to the actual class, where the user
 * can answer a prompt while they wait. Also useful for hiding the audio loading
 * time, which allows higher quality audio on lower-end devices.
 */
export const JourneyLobbyScreen = ({
  journey,
  shared,
  setScreen,
  onJourneyFinished,
}: JourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const leavingCallback = useRef<(() => void) | null>(null);
  if (leavingCallback.current === undefined) {
    leavingCallback.current = null;
  }

  const gotoStartPrivileged = useCallback(() => {
    if (leavingCallback.current !== null) {
      leavingCallback.current();
    }
    setScreen("start", true);
  }, [setScreen]);

  const gotoStart = useCallback(() => {
    if (leavingCallback.current !== null) {
      leavingCallback.current();
    }
    setScreen("start", false);
  }, [setScreen]);

  return (
    <View style={styles.container}>
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={useMappedValueWithCallbacks(shared, (s) => s.darkenedImage)}
        style={styles.innerContainer}
      >
        <CloseButton onPress={gotoStartPrivileged} />
        <View style={styles.content}>
          <JourneyPrompt
            journey={journey}
            loginContext={loginContext}
            onFinished={gotoStart}
            leavingCallback={leavingCallback}
          />
        </View>
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};
