import { StatusBar } from 'expo-status-bar';
import { ReactElement } from 'react';
import { Text, View } from 'react-native';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';

export const JourneyScreen = ({ journey, shared, error }: JourneyScreenProps): ReactElement => {
  if (shared.image === null) {
    return <SplashScreen />;
  }

  return (
    <View style={sharedStyles.container}>
      {error}

      <OsehImageBackgroundFromState state={shared.image} style={sharedStyles.background}>
        <Text>
          JourneyScreen {journey.uid}; audioLoading={shared.audioLoading ? 'y' : 'n'}
        </Text>
      </OsehImageBackgroundFromState>
      <StatusBar style="auto" />
    </View>
  );
};
