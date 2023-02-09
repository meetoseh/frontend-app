import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, Share, StyleProp, Text, TextStyle, View } from 'react-native';
import { CloseButton } from '../../shared/components/CloseButton';
import { ErrorBanner, ErrorBannerText } from '../../shared/components/ErrorBanner';
import { FilledInvertedButton } from '../../shared/components/FilledInvertedButton';
import { FilledPrimaryButton } from '../../shared/components/FilledPrimaryButton';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { describeError } from '../../shared/lib/describeError';
import { getDailyEventInvite } from '../../shared/lib/getDailyEventInvite';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';
import { styles } from './JourneyStartScreenStyle';

export const JourneyStartScreen = ({
  journey,
  shared,
  setScreen,
  onJourneyFinished,
  error,
  setError,
}: JourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const screenSize = useScreenSize();
  const [pwafTextStyle, setPwafTextStyle] = useState<StyleProp<TextStyle> | undefined>(undefined);
  const [pwafHeight, setPwafHeight] = useState<number>(56);
  const [sfnTextStyle, setSfnTextStyle] = useState<StyleProp<TextStyle> | undefined>(undefined);
  const [sfnHeight, setSfnHeight] = useState<number>(56);

  const pwafContainerStyle = useMemo(() => {
    return Object.assign({}, styles.practiceWithAFriendContainer, {
      width: screenSize.width,
      maxHeight: pwafHeight,
    });
  }, [screenSize.width, pwafHeight]);

  const sfnContainerStyle = useMemo(() => {
    return Object.assign({}, styles.skipForNowContainer, {
      width: screenSize.width,
      maxHeight: sfnHeight,
    });
  }, [screenSize.width, sfnHeight]);

  const onInviteFriend = useCallback(async () => {
    if (loginContext.state !== 'logged-in') {
      setError(
        <ErrorBanner>
          <ErrorBannerText>You can&rsquo;t do that right now.</ErrorBannerText>
        </ErrorBanner>
      );
      return;
    }

    setError(null);
    try {
      const invite = await getDailyEventInvite({
        loginContext,
        journeyUid: journey.uid,
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
  }, [loginContext, journey, setError]);

  const onSkipForNow = useCallback(async () => {
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
        <View style={pwafContainerStyle}>
          <FilledPrimaryButton
            setTextStyle={setPwafTextStyle}
            setHeight={setPwafHeight}
            onPress={onInviteFriend}>
            <Text style={pwafTextStyle}>Practice with a Friend</Text>
          </FilledPrimaryButton>
        </View>
        <View style={sfnContainerStyle}>
          <FilledInvertedButton
            setTextStyle={setSfnTextStyle}
            setHeight={setSfnHeight}
            onPress={onSkipForNow}>
            <Text style={sfnTextStyle}>Skip for Now</Text>
          </FilledInvertedButton>
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="auto" />
    </View>
  );
};
