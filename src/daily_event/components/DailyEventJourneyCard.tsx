import { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, Pressable, ViewStyle, LayoutChangeEvent } from 'react-native';
import { DailyEventJourneyState } from '../hooks/useDailyEventJourneyState';
import { DailyEvent } from '../models/DailyEvent';
import { DailyEventJourney } from '../models/DailyEventJourney';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { styles } from './DailyEventJourneyCardStyles';
import { MyProfilePictureState } from '../../shared/hooks/useMyProfilePicture';
import { OsehImageFromState } from '../../shared/components/OsehImageFromState';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { SplashScreen } from '../../splash/SplashScreen';
import { RSQUO } from '../../shared/lib/HtmlEntities';
import * as Colors from '../../styling/colors';
import Play from '../../shared/icons/Play';
import { useTopBarHeight } from '../../shared/hooks/useTopBarHeight';
import { getPaddingFromStyle } from '../../shared/lib/getPaddingFromStyle';
import Svg, { Circle } from 'react-native-svg';
import { useScreenSize } from '../../shared/hooks/useScreenSize';

type DailyEventJourneyCardProps = {
  /**
   * The daily event this journey is a part of
   */
  event: DailyEvent;

  /**
   * The journey to show
   */
  journey: DailyEventJourney;

  /**
   * The index of this journey within the journeys, in the shuffled
   * carousel order. Used to decide which dot to highlight.
   */
  journeyIndex: number;

  /**
   * The loaded information about the journey card, so it can be
   * reused even when the card is unmounted
   */
  state: DailyEventJourneyState;

  /**
   * The authenticated users profile picture
   */
  profilePicture: MyProfilePictureState;

  /**
   * The function to call when the user wants to see their settings.
   */
  onGotoSettings: () => void;

  /**
   * The function to call when the user wants to play this journey. Only
   * called if the user has access to play this journey.
   */
  onStart: () => void;

  /**
   * The function to call when the user wants to play a random journey
   * within this daily event. Only called if the user has access to
   * play a random journey.
   */
  onStartRandom: () => void;
};

/**
 * Shows a full screen card describing a journey within a daily event, with
 * tools to select that journey.
 */
export const DailyEventJourneyCard = ({
  journey,
  state,
  profilePicture,
  journeyIndex,
  event,
  onStart,
  onGotoSettings,
}: DailyEventJourneyCardProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const [pressingPlay, setPressingPlay] = useState(false);
  const topBarHeight = useTopBarHeight();
  const screenSize = useScreenSize();

  const onPlayButtonPressIn = useCallback(() => {
    setPressingPlay(true);
  }, []);

  const onPlayButtonPressOut = useCallback(() => {
    setPressingPlay(false);
  }, []);

  const playButtonColor = useMemo(() => {
    if (pressingPlay) {
      return Colors.GRAYSCALE_MID_GRAY;
    }

    return Colors.WHITE;
  }, [pressingPlay]);

  const containerStyle = useMemo(() => {
    const [top, right, bottom, left] = getPaddingFromStyle(styles.container);
    return Object.assign({}, styles.container, {
      padding: undefined,
      paddingTop: top + topBarHeight,
      paddingRight: right,
      paddingBottom: bottom,
      paddingLeft: left,
    });
  }, [topBarHeight]);

  const playButtonContainerStyle = useMemo<ViewStyle>(() => {
    if (!journey.access.start) {
      return {};
    }

    return {
      position: 'absolute',
      top: screenSize.height / 2 - 45,
      left: screenSize.width / 2 - 45,
      width: 90,
      height: 90,
      padding: 20,
    };
  }, [journey.access.start, screenSize]);

  const alwaysTrue = useCallback(() => true, []);

  const onGotoSettingsPressed = useCallback(() => {
    onGotoSettings();
  }, [onGotoSettings]);

  if (loginContext.state !== 'logged-in' || loginContext.userAttributes === null) {
    return <SplashScreen />;
  }

  return (
    <OsehImageBackgroundFromState state={state.image} style={containerStyle}>
      <Pressable
        style={styles.header}
        onPress={onGotoSettingsPressed}
        onStartShouldSetResponder={alwaysTrue}
        onMoveShouldSetResponder={alwaysTrue}>
        {profilePicture.state === 'available' && (
          <OsehImageFromState state={profilePicture.image} style={styles.profileImage} />
        )}
        <View style={styles.headerText}>
          <Text style={styles.headerName}>Hi {loginContext.userAttributes.givenName} 👋</Text>
          <Text style={styles.headerTitle}>Today{RSQUO}s Journeys</Text>
        </View>
      </Pressable>
      {journey.access.start && (
        <Pressable
          style={playButtonContainerStyle}
          onPressIn={onPlayButtonPressIn}
          onPressOut={onPlayButtonPressOut}
          onPress={onStart}
          onStartShouldSetResponder={alwaysTrue}
          onMoveShouldSetResponder={alwaysTrue}>
          <Play width={50} height={50} color={playButtonColor} />
        </Pressable>
      )}
      <BottomSection event={event} journey={journey} journeyIndex={journeyIndex} />
    </OsehImageBackgroundFromState>
  );
};

/**
 * Handles just the bottom section of the card, which is constant. The
 * challenge here is that we need th ebottom section to be tight, e.g.,
 * its height must only include the fixed padding, but there doesn't seem
 * to be a way to do that in react easily (there is no block display). So
 * this uses refs to measure the heights of the individual components and
 * handles all the spacing.
 */
const BottomSection = ({
  event,
  journey,
  journeyIndex,
}: {
  journey: DailyEventJourney;
  event: DailyEvent;
  journeyIndex: number;
}): ReactElement => {
  const dotsHeight = 8;

  const [titleHeight, setTitleHeight] = useState(styles.bottomTitle.lineHeight);
  const [instructorHeight, setInstructorHeight] = useState(styles.bottomInstructor.lineHeight);
  const [descriptionHeight, setDescriptionHeight] = useState(
    styles.bottomDescription.lineHeight * 3
  );

  const onTitleLayout = useCallback((event: LayoutChangeEvent) => {
    if (!event.nativeEvent) {
      return;
    }
    setTitleHeight(event.nativeEvent.layout.height);
  }, []);

  const onInstructorLayout = useCallback((event: LayoutChangeEvent) => {
    if (!event.nativeEvent) {
      return;
    }
    setInstructorHeight(event.nativeEvent.layout.height);
  }, []);

  const onDescriptionLayout = useCallback((event: LayoutChangeEvent) => {
    if (!event.nativeEvent) {
      return;
    }
    setDescriptionHeight(event.nativeEvent.layout.height);
  }, []);

  const containerStyle = useMemo(() => {
    const titlePadding = getPaddingFromStyle(styles.bottomTitle);
    const instructorPadding = getPaddingFromStyle(styles.bottomInstructor);
    const descPadding = getPaddingFromStyle(
      journey.access.start ? styles.bottomDescription : styles.bottomDescriptionFree
    );
    const height =
      titleHeight +
      titlePadding[0] +
      titlePadding[2] +
      instructorHeight +
      instructorPadding[0] +
      instructorPadding[2] +
      descriptionHeight +
      descPadding[0] +
      descPadding[2] +
      dotsHeight;
    return Object.assign({}, styles.bottomContainer, {
      height,
      maxHeight: height,
    });
  }, [titleHeight, instructorHeight, descriptionHeight, journey.access.start]);

  const dots = useMemo<ReactElement>(() => {
    const arr = [];
    for (let idx = 0; idx < event.journeys.length; idx++) {
      arr.push(
        <View style={idx === 0 ? styles.firstDot : styles.nonFirstDot} key={idx}>
          <Svg
            width={8}
            height={8}
            fill={idx === journeyIndex ? Colors.WHITE : Colors.PRIMARY_DEFAULT}>
            <Circle cx={4} cy={4} r={4} />
          </Svg>
        </View>
      );
    }
    return <View style={styles.bottomDots}>{arr}</View>;
  }, [event.journeys.length, journeyIndex]);

  return (
    <View style={containerStyle}>
      <Text style={styles.bottomTitle} onLayout={onTitleLayout}>
        {journey.title}
      </Text>
      <Text style={styles.bottomInstructor} onLayout={onInstructorLayout}>
        {journey.instructor.name}
      </Text>
      <Text
        style={journey.access.start ? styles.bottomDescription : styles.bottomDescriptionFree}
        onLayout={onDescriptionLayout}>
        {journey.description.text}
      </Text>
      {dots}
    </View>
  );
};
