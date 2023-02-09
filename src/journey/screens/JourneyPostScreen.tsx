import { StatusBar } from 'expo-status-bar';
import { ReactElement } from 'react';
import { Text, View } from 'react-native';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';

export const JourneyPostScreen = ({ journey, shared, error }: JourneyScreenProps): ReactElement => {
  return (
    <View style={sharedStyles.container}>
      {error}
      <Text>
        JourneyPostScreen {journey.uid}; audioLoading={shared.audioLoading ? 'y' : 'n'}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
};
