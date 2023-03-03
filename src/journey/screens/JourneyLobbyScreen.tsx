import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { CloseButton } from '../../shared/components/CloseButton';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { useTopBarHeight } from '../../shared/hooks/useTopBarHeight';
import { getPaddingFromStyle } from '../../shared/lib/getPaddingFromStyle';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyColorPrompt } from '../components/JourneyColorPrompt';
import { JourneyNumericPrompt } from '../components/JourneyNumericPrompt';
import { JourneyProfilePictures } from '../components/JourneyProfilePictures';
import { JourneyWordPrompt } from '../components/JourneyWordPrompt';
import { useJoinLeave } from '../hooks/useJoinLeave';
import { useCoarseTime, useJourneyTime } from '../hooks/useJourneyTime';
import { useProfilePictures } from '../hooks/useProfilePictures';
import { useStats } from '../hooks/useStats';
import { JourneyPromptProps } from '../models/JourneyPromptProps';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';
import { styles } from './JourneyLobbyScreenStyles';

/**
 * Shows the journey lobby, which contains a poll and a countdown to the start
 * of the journey.
 */
export const JourneyLobbyScreen = ({
  journey,
  shared,
  error,
  setScreen,
}: JourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const journeyTime = useJourneyTime(0, false);
  const topBarHeight = useTopBarHeight();
  const screenSize = useScreenSize();
  const [promptHeight, setPromptHeight] = useState(0);
  const stats = useStats({
    journeyUid: journey.uid,
    journeyJwt: journey.jwt,
    journeyLobbyDurationSeconds: journey.lobbyDurationSeconds,
    journeyPrompt: journey.prompt,
    journeyTime,
  });

  const showingProfilePictures = useMemo(
    () => screenSize.height - topBarHeight >= 633,
    [screenSize.height, topBarHeight]
  );
  const profilePictures = useProfilePictures({
    journeyUid: journey.uid,
    journeyJwt: journey.jwt,
    journeyLobbyDurationSeconds: journey.lobbyDurationSeconds,
    journeyTime,
    enabled: showingProfilePictures,
  });

  useJoinLeave({
    journeyUid: journey.uid,
    journeyJwt: journey.jwt,
    sessionUid: journey.sessionUid,
    journeyLobbyDurationSeconds: journey.lobbyDurationSeconds,
    journeyTime,
    loginContext,
  });

  const onClose = useCallback(() => {
    setScreen('start');
  }, [setScreen]);

  const promptProps = useMemo<JourneyPromptProps>(
    () => ({
      journeyUid: journey.uid,
      journeyJwt: journey.jwt,
      sessionUid: journey.sessionUid,
      prompt: journey.prompt,
      stats,
      journeyLobbyDurationSeconds: journey.lobbyDurationSeconds,
      journeyTime,
      loginContext,
      setHeight: setPromptHeight,
    }),
    [
      journey.uid,
      journey.jwt,
      journey.sessionUid,
      journey.prompt,
      stats,
      journey.lobbyDurationSeconds,
      journeyTime,
      loginContext,
    ]
  );

  useEffect(() => {
    if (journeyTime.time.current >= journey.lobbyDurationSeconds * 1000) {
      setScreen('start');
      return;
    }

    let active = true;
    const idx = journeyTime.onTimeChanged.current.length;
    journeyTime.onTimeChanged.current.push(handleTimeChanged);
    const unmount = () => {
      if (!active) {
        return;
      }
      active = false;
      for (let i = Math.min(idx, journeyTime.onTimeChanged.current.length - 1); i >= 0; i--) {
        if (journeyTime.onTimeChanged.current[i] === handleTimeChanged) {
          journeyTime.onTimeChanged.current.splice(i, 1);
          break;
        }
      }
    };
    return unmount;

    function handleTimeChanged(oldTime: number, newTime: number) {
      if (!active) {
        return;
      }

      if (newTime >= journey.lobbyDurationSeconds * 1000) {
        setScreen('start');
        unmount();
      }
    }
  }, [journeyTime.onTimeChanged, journeyTime.time, journey.lobbyDurationSeconds, setScreen]);

  const coarsenedJourneyTime = useCoarseTime(journeyTime, 1000, 0, false);
  const countdownText = Math.max(Math.ceil(journey.lobbyDurationSeconds - coarsenedJourneyTime), 0);

  const containerStyle = useMemo(() => {
    const [top, right, bottom, left] = getPaddingFromStyle(styles.container);
    return Object.assign({}, styles.container, {
      paddingTop: top + topBarHeight,
      paddingRight: right,
      paddingBottom: bottom,
      paddingLeft: left,
    });
  }, [topBarHeight]);

  const promptAndProfilePicturesStyle = useMemo<ViewStyle>(() => {
    if (promptHeight <= 0) {
      return {};
    }

    if (!showingProfilePictures) {
      return {
        height: promptHeight,
        maxHeight: promptHeight,
      };
    }

    const minHeight = promptHeight + 38;
    const spacing = screenSize.height - topBarHeight >= 844 ? 50 : 32;
    const height = minHeight + spacing;
    return {
      height,
      maxHeight: height,
      flex: 1,
      justifyContent: 'space-between',
      flexDirection: 'column',
    };
  }, [promptHeight, showingProfilePictures, screenSize.height, topBarHeight]);

  if (shared.image === null) {
    return <SplashScreen />;
  }

  return (
    <View style={sharedStyles.container}>
      {error}

      <CloseButton onPress={onClose} />

      <OsehImageBackgroundFromState state={shared.image} style={sharedStyles.background}>
        <View style={containerStyle}>
          <View style={styles.countdownContainer}>
            <Text style={styles.title}>Class is almost ready</Text>
            <Text style={styles.countdown}>{countdownText}</Text>
          </View>
          <View style={promptAndProfilePicturesStyle}>
            {journey.prompt.style === 'word' && <JourneyWordPrompt {...promptProps} />}
            {journey.prompt.style === 'numeric' && <JourneyNumericPrompt {...promptProps} />}
            {journey.prompt.style === 'color' && <JourneyColorPrompt {...promptProps} />}
            {showingProfilePictures && (
              <JourneyProfilePictures profilePictures={profilePictures} users={stats.users} />
            )}
          </View>
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="light" />
    </View>
  );
};
