import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, Share, StyleProp, Text, TextStyle, View } from 'react-native';
import { CloseButton } from '../../shared/components/CloseButton';
import { ErrorBanner, ErrorBannerText } from '../../shared/components/ErrorBanner';
import { FilledPrimaryButton } from '../../shared/components/FilledPrimaryButton';
import { LinkButton } from '../../shared/components/LinkButton';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { describeError } from '../../shared/lib/describeError';
import { getDailyEventInvite } from '../../shared/lib/getDailyEventInvite';
import { RSQUO } from '../../shared/lib/HtmlEntities';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';
import { styles } from './JourneyStartScreenStyles';

export const JourneyStartScreen = ({
  journey,
  shared,
  setScreen,
  onJourneyFinished,
  error,
  setError,
  isOnboarding,
}: JourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const screenSize = useScreenSize();
  const [letsGoTextStyle, setLetsGoTextStyle] = useState<StyleProp<TextStyle> | undefined>(
    undefined
  );
  const [letsGoHeight, setLetsGoHeight] = useState<number>(56);
  const [invAFriendTextStyle, setInvAFriendTextStyle] = useState<StyleProp<TextStyle> | undefined>(
    undefined
  );
  const [invAFriendHeight, setInvAFriendHeight] = useState<number>(56);

  const letsGoContainerStyle = useMemo(() => {
    return Object.assign({}, styles.letsGoContainer, {
      width: screenSize.width,
      maxHeight: letsGoHeight,
    });
  }, [screenSize.width, letsGoHeight]);

  const invAFriendContainerStyle = useMemo(() => {
    return Object.assign({}, styles.invAFriendContainer, {
      width: screenSize.width,
      maxHeight: invAFriendHeight,
    });
  }, [screenSize.width, invAFriendHeight]);

  const onInviteFriend = useCallback(async () => {
    if (loginContext.state !== 'logged-in') {
      setError(
        <ErrorBanner>
          <ErrorBannerText>You can{RSQUO}t do that right now.</ErrorBannerText>
        </ErrorBanner>
      );
      return;
    }

    setError(null);
    try {
      const invite = await getDailyEventInvite({
        loginContext,
        journeyUid: isOnboarding ? null : journey.uid,
      });

      const text = `Let's do a ${journey.category.externalName.toLowerCase()} class together on Oseh.`;
      const shareInfo = Platform.select({
        ios: {
          title: text,
          url: invite.url,
        },
        android: {
          message: text + ' ' + invite.url,
        },
      });

      if (shareInfo === undefined) {
        throw new Error('Unsupported platform');
      }

      await Share.share(shareInfo);
    } catch (e) {
      const err = await describeError(e);
      setError(err);
    }
  }, [loginContext, journey, setError, isOnboarding]);

  const onLetsGo = useCallback(async () => {
    setScreen('journey');
  }, [setScreen]);

  const onClose = useCallback(async () => {
    onJourneyFinished(null);
  }, [onJourneyFinished]);

  if (shared.image === null) {
    return <SplashScreen />;
  }

  return (
    <View style={sharedStyles.container}>
      {error}

      <CloseButton onPress={onClose} />

      <OsehImageBackgroundFromState state={shared.image} style={sharedStyles.background}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Class is Ready</Text>
        </View>
        <View style={letsGoContainerStyle}>
          <FilledPrimaryButton
            setTextStyle={setLetsGoTextStyle}
            setHeight={setLetsGoHeight}
            onPress={onLetsGo}>
            <Text style={letsGoTextStyle}>Let{RSQUO}s Go</Text>
          </FilledPrimaryButton>
        </View>
        <View style={invAFriendContainerStyle}>
          <LinkButton
            setTextStyle={setInvAFriendTextStyle}
            setHeight={setInvAFriendHeight}
            onPress={onInviteFriend}>
            <Text style={invAFriendTextStyle}>Invite a Friend</Text>
          </LinkButton>
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="auto" />
    </View>
  );
};
