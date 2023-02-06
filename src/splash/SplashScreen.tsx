import { StatusBar } from 'expo-status-bar';
import { ReactElement } from 'react';
import { View, Text } from 'react-native';
import { styles } from './SplashScreenStyles';

/**
 * Shows a fun animation and image which is typically used while the app is
 * loading.
 */
export const SplashScreen = (): ReactElement => {
  return (
    <View style={styles.container}>
      <Text>Splash</Text>
      <StatusBar style="auto" />
    </View>
  );
};
