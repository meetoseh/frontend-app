import { StatusBar } from 'expo-status-bar';
import { ReactElement } from 'react';
import { View, Text, Pressable } from 'react-native';
import { OsehImageBackground } from '../shared/components/OsehImageBackground';
import { useScreenSize } from '../shared/hooks/useScreenSize';
import { styles } from './LoginScreenStyles';
import Apple from './icons/Apple';
import Google from './icons/Google';

type LoginScreenProps = {
  /**
   * Called after the user successfully logs in.
   */
  onLogin: () => void;
};

/**
 * Allows the user to login. The user should not be directed here if they
 * are already logged in, but if they are, this will allow them to login to
 * a new account, potentially skipping some of our standard logout process.
 *
 * This assumes that fonts have already been loaded.
 */
export const LoginScreen = ({ onLogin }: LoginScreenProps): ReactElement => {
  const dims = useScreenSize();

  const onContinueWithGoogle = () => {
    console.log('Continue with Google');
  };

  const onContinueWithApple = () => {
    console.log('Continue with Apple');
  };

  return (
    <View style={styles.container}>
      <OsehImageBackground
        uid="oseh_if_hH68hcmVBYHanoivLMgstg"
        jwt={null}
        displayWidth={dims.width}
        displayHeight={dims.height}
        alt=""
        isPublic={true}
        style={styles.content}>
        <Text style={styles.header}>Sign in with your social account</Text>
        <View style={styles.continueWithGoogleContainer}>
          <Pressable style={styles.continueWithGoogle} onPress={onContinueWithGoogle}>
            <Google style={styles.google} />
            <Text style={styles.continueWithGoogleText}>Continue with Google</Text>
          </Pressable>
        </View>
        <View style={styles.continueWithAppleContainer}>
          <Pressable style={styles.continueWithApple} onPress={onContinueWithApple}>
            <Apple style={styles.apple} />
            <Text style={styles.continueWithAppleText}>Continue with Apple</Text>
          </Pressable>
        </View>
        <View style={styles.legalContainer}>
          <Text style={styles.legal}>
            We won't post to any of your accounts without asking first.
          </Text>
        </View>
      </OsehImageBackground>
      <StatusBar style="light" />
    </View>
  );
};
