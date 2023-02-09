import { StatusBar } from 'expo-status-bar';
import { ReactElement } from 'react';
import { View, Text } from 'react-native';
import { styles } from './SplashScreenStyles';

type SplashScreenProps = {
  /**
   * The style to use for the spinner. Defaults to 'brandmark'
   */
  type?: 'wordmark' | 'brandmark' | undefined;
};
/**
 * Shows a fun animation and image which is typically used while the app is
 * loading.
 */
export const SplashScreen = ({ type }: SplashScreenProps): ReactElement => {
  if (type === undefined) {
    type = 'brandmark';
  }

  return (
    <View style={styles.container}>
      <Text>Splash {type}</Text>
      <StatusBar style="auto" />
    </View>
  );
};
