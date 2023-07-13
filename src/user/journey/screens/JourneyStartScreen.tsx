import { ReactElement, useCallback, useRef } from "react";
import { useStateCompat as useState } from "../../../shared/hooks/useStateCompat";
import { View, Text, TextStyle, StyleProp } from "react-native";
import { StatusBar } from "expo-status-bar";
import { JourneyScreenProps } from "../models/JourneyScreenProps";
import { styles } from "./JourneyStartScreenStyles";
import { useUnwrappedValueWithCallbacks } from "../../../shared/hooks/useUnwrappedValueWithCallbacks";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";
import { useTopBarHeight } from "../../../shared/hooks/useTopBarHeight";
import { FilledInvertedButton } from "../../../shared/components/FilledInvertedButton";

/**
 * Shows a screen allowing the user to perform an interaction to start the
 * journey, as well as potentially other social actions.
 *
 * This is useful for elevating to a privileged context, which is required
 * for starting the journey audio.
 */
export const JourneyStartScreen = ({
  journey,
  shared,
  setScreen,
  isOnboarding,
  onJourneyFinished,
  selectedEmotionAntonym,
  duration = "1-minute",
}: JourneyScreenProps & {
  selectedEmotionAntonym?: string;
  duration?: string;
}): ReactElement => {
  const audioReady = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(shared, (s) => s.audio.play !== null)
  );

  const onSkipClick = useCallback(() => {
    setScreen("journey", true);
  }, [setScreen]);

  const darkenedImage = useMappedValueWithCallbacks(
    shared,
    (s) => s.darkenedImage
  );

  const [skipButtonStyle, setSkipButtonStyle] = useState<StyleProp<TextStyle>>(
    () => undefined
  );
  const topBarHeight = useTopBarHeight();
  const windowSize = useWindowSize();

  if (selectedEmotionAntonym === undefined) {
    return (
      <View style={styles.container}>
        <OsehImageBackgroundFromStateValueWithCallbacks
          state={darkenedImage}
          style={{ ...styles.innerContainer, height: windowSize.height }}
        >
          <View
            style={{
              ...styles.content,
              paddingTop: styles.content.paddingTop + topBarHeight,
              maxHeight: styles.content.maxHeight + topBarHeight,
            }}
          >
            <Text style={styles.title}>Your Class is Ready</Text>
            <Text style={styles.description}>
              Put on your headset, get comfortable, and prepare for a short
              audio experience.
            </Text>
            <Text style={styles.journeyTitle}>{journey.title}</Text>
            <Text style={styles.journeyDescription}>
              {journey.description.text}
            </Text>
            <View style={styles.skipForNowContainer}>
              <FilledInvertedButton
                fullWidth
                onPress={onSkipClick}
                disabled={!audioReady}
                spinner={!audioReady}
                setTextStyle={setSkipButtonStyle}
              >
                {audioReady ? (
                  <Text style={skipButtonStyle}>Let&rsquo;s Go</Text>
                ) : (
                  <Text style={skipButtonStyle}>Loading...</Text>
                )}
              </FilledInvertedButton>
            </View>
          </View>
        </OsehImageBackgroundFromStateValueWithCallbacks>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={darkenedImage}
        style={{ ...styles.innerContainer, height: windowSize.height }}
      >
        <View
          style={{
            ...styles.content,
            paddingTop: styles.content.paddingTop + topBarHeight,
            maxHeight: styles.content.maxHeight + topBarHeight,
          }}
        >
          <Text style={styles.title}>
            Here&rsquo;s a {duration}{" "}
            {journey.category.externalName.toLocaleLowerCase()} class to help
            you {selectedEmotionAntonym.toLocaleLowerCase()} with{" "}
            {journey.instructor.name}.
          </Text>
          <View style={styles.skipForNowContainer}>
            <FilledInvertedButton
              fullWidth
              onPress={onSkipClick}
              disabled={!audioReady}
              spinner={!audioReady}
              setTextStyle={setSkipButtonStyle}
            >
              {audioReady ? (
                <Text style={skipButtonStyle}>Let&rsquo;s Go</Text>
              ) : (
                <Text style={skipButtonStyle}>Loading...</Text>
              )}
            </FilledInvertedButton>
          </View>
        </View>
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};
