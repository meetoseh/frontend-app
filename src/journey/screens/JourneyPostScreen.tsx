import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { CloseButton } from '../../shared/components/CloseButton';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';
import { styles } from './JourneyPostScreenStyles';
import * as Colors from '../../styling/colors';
import { SvgProps } from 'react-native-svg';
import ThumbsUp from '../../shared/icons/ThumbsUp';
import { FilledPrimaryButton } from '../../shared/components/FilledPrimaryButton';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { apiFetch } from '../../shared/lib/apiFetch';
import { RSQUO } from '../../shared/lib/HtmlEntities';

export const JourneyPostScreen = ({
  journey,
  shared,
  error,
  onJourneyFinished,
  setScreen,
}: JourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const [streak, setStreak] = useState(1);
  const [streakLoaded, setStreakLoaded] = useState(false);
  const screenSize = useScreenSize();
  const [review, setReview] = useState<'yes' | 'no' | null>(null);
  const [pressingReviewYes, setPressingReviewYes] = useState(false);
  const [pressingReviewNo, setPressingReviewNo] = useState(false);
  const [shareTextStyle, setShareTextStyle] = useState<StyleProp<TextStyle>>({});
  const [shareHeight, setShareHeight] = useState(56);

  const reviewYesStyle: SvgProps = useMemo(() => {
    if (pressingReviewYes) {
      return { fill: Colors.GRAYSCALE_MID_GRAY };
    }

    if (review === 'yes') {
      return { fill: Colors.WHITE };
    }

    return { fill: Colors.TRANSPARENT_WHITE };
  }, [review, pressingReviewYes]);

  const reviewNoStyle: SvgProps = useMemo(() => {
    // svg type hint is incorrect; this is the correct form, but it's not in the type hint
    const baseStyle: SvgProps = { transform: [{ scale: -1 }] } as SvgProps;

    if (pressingReviewNo) {
      return Object.assign({}, baseStyle, { fill: Colors.GRAYSCALE_MID_GRAY });
    }

    if (review === 'no') {
      return Object.assign({}, baseStyle, { fill: Colors.WHITE });
    }

    return Object.assign({}, baseStyle, { fill: Colors.TRANSPARENT_WHITE });
  }, [review, pressingReviewNo]);

  const handleThumbsUpPressIn = useCallback(() => {
    setPressingReviewYes(true);
  }, []);

  const handleThumbsDownPressIn = useCallback(() => {
    setPressingReviewNo(true);
  }, []);

  const handleThumbsUpPressOut = useCallback(() => {
    setPressingReviewYes(false);
  }, []);

  const handleThumbsDownPressOut = useCallback(() => {
    setPressingReviewNo(false);
  }, []);

  const giveFeedback = useCallback(
    async (answer: number, feedback?: string | null) => {
      if (feedback === undefined) {
        feedback = null;
      }

      try {
        const response = await apiFetch(
          '/api/1/journeys/feedback',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              journey_uid: journey.uid,
              journey_jwt: journey.jwt,
              version: 'oseh_jf-otp_fKWQzTG-JnA',
              response: answer,
              feedback,
            }),
          },
          loginContext
        );

        if (!response.ok) {
          throw response;
        }
      } catch (e) {
        console.error('failed to tell server about feedback', e);
      }
    },
    [loginContext, journey]
  );

  const handleThumbsUpPress = useCallback(() => {
    if (review === 'yes') {
      return;
    }
    setReview('yes');
    giveFeedback(1);
  }, [review, giveFeedback]);

  const handleThumbsDownPress = useCallback(() => {
    if (review === 'no') {
      return;
    }
    setReview('no');
    giveFeedback(0);
  }, [review, giveFeedback]);

  const onShare = useCallback(() => {
    setScreen('share');
  }, [setScreen]);

  useEffect(() => {
    if (loginContext.state !== 'logged-in') {
      return;
    }
    let active = true;
    fetchStreak();
    return () => {
      active = false;
    };

    async function fetchStreak() {
      if (streakLoaded) {
        return;
      }

      try {
        const response = await apiFetch(
          '/api/1/users/me/streak',
          {
            method: 'GET',
          },
          loginContext
        );
        if (!active) {
          return;
        }

        if (!response.ok) {
          throw response;
        }

        const data: { streak: number } = await response.json();
        if (!active) {
          return;
        }
        setStreak(data.streak);
        setStreakLoaded(true);
      } catch (e) {
        console.log('error loading streak');
      }
    }
  }, [loginContext, streakLoaded]);

  const shareContainerStyle = useMemo<ViewStyle>(() => {
    return {
      width: Math.min(screenSize.width - 48, 342),
      height: shareHeight,
      alignSelf: 'center',
    };
  }, [screenSize.width, shareHeight]);

  if (shared.image === null || loginContext.userAttributes === null) {
    return <SplashScreen />;
  }

  return (
    <View style={sharedStyles.container}>
      {error}

      <OsehImageBackgroundFromState state={shared.image} style={sharedStyles.background}>
        <CloseButton onPress={onJourneyFinished} />
        <View style={styles.content}>
          <Text style={styles.title}>
            Thanks for practicing {loginContext.userAttributes.givenName}, you{RSQUO}re on a roll.
          </Text>
          <Text style={streakLoaded ? styles.streak : styles.streakLoading}>{streak}</Text>
          <Text style={styles.streakUnit}>day streak</Text>
          <Text style={styles.feedbackPrompt}>Do you want to see more classes like this?</Text>
          <View style={styles.reviewButtons}>
            <Pressable
              onPressIn={handleThumbsUpPressIn}
              onPressOut={handleThumbsUpPressOut}
              onPress={handleThumbsUpPress}
              style={styles.reviewButton}>
              <ThumbsUp {...reviewYesStyle} />
            </Pressable>
            <Pressable
              onPressIn={handleThumbsDownPressIn}
              onPressOut={handleThumbsDownPressOut}
              onPress={handleThumbsDownPress}
              style={styles.reviewButton}>
              <ThumbsUp {...reviewNoStyle} />
            </Pressable>
          </View>
          <View style={shareContainerStyle}>
            <FilledPrimaryButton
              onPress={onShare}
              setTextStyle={setShareTextStyle}
              setHeight={setShareHeight}>
              <Text style={shareTextStyle}>Share This Class</Text>
            </FilledPrimaryButton>
          </View>
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="auto" />
    </View>
  );
};
