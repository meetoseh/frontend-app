import { StatusBar } from 'expo-status-bar';
import { ReactElement, useMemo, useState } from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';
import { FilledInvertedButton } from '../../shared/components/FilledInvertedButton';
import { FilledPrimaryButton } from '../../shared/components/FilledPrimaryButton';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';
import { styles } from './JourneyStartScreenStyle';

export const JourneyStartScreen = ({ shared, error }: JourneyScreenProps): ReactElement => {
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

  if (shared.image === null) {
    return <SplashScreen />;
  }

  return (
    <View style={sharedStyles.container}>
      {error}

      <OsehImageBackgroundFromState state={shared.image} style={sharedStyles.background}>
        <View style={pwafContainerStyle}>
          <FilledPrimaryButton setTextStyle={setPwafTextStyle} setHeight={setPwafHeight}>
            <Text style={pwafTextStyle}>Practice with a Friend</Text>
          </FilledPrimaryButton>
        </View>
        <View style={sfnContainerStyle}>
          <FilledInvertedButton setTextStyle={setSfnTextStyle} setHeight={setSfnHeight}>
            <Text style={sfnTextStyle}>Skip for Now</Text>
          </FilledInvertedButton>
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="auto" />
    </View>
  );
};
