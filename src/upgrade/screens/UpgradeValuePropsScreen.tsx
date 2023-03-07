import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useState } from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';
import { CloseButton } from '../../shared/components/CloseButton';
import { FilledPrimaryButton } from '../../shared/components/FilledPrimaryButton';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { OutlineWhiteButton } from '../../shared/components/OutlineWhiteButton';
import Checkmark from '../../shared/icons/Checkmark';
import Plus from '../../shared/icons/Plus';
import Wordmark from '../../shared/icons/Wordmark';
import { EMDASH, RSQUO } from '../../shared/lib/HtmlEntities';
import { UpgradeValuePropsState } from '../hooks/useUpgradeValuePropsState';
import { styles } from './UpgradeValuePropsScreenStyles';

type UpgradeValuePropsScreenProps = {
  /**
   * Called when the user should be returned to the previous screen,
   * either because of an error or because the user has cancelled the
   * upgrade, or because the upgrade was successful.
   */
  onBack: (error?: ReactElement | null) => void;

  /**
   * The state for this screen. If loading, shows a spinner instead of the
   * screen.
   */
  state: UpgradeValuePropsState;

  /**
   * The initial error to display, if an error is being forwarded from
   * an earlier screen.
   */
  initialError: ReactElement | null;
};

/**
 * Shows a list of value props, a price, and a button to subscribe.
 */
export const UpgradeValuePropsScreen = ({
  onBack,
  state,
  initialError,
}: UpgradeValuePropsScreenProps): ReactElement => {
  const error = initialError;
  const [upgradeTextStyle, setUpgradeTextStyle] = useState<StyleProp<TextStyle>>({});
  const [cancelTextStyle, setCancelTextStyle] = useState<StyleProp<TextStyle>>({});

  const onUpgrade = useCallback(() => {
    console.log('upgrade');
  }, []);

  const goBack = useCallback(() => {
    onBack();
  }, [onBack]);

  return (
    <View style={styles.container}>
      {error}
      <OsehImageBackgroundFromState state={state.background} style={styles.content}>
        <CloseButton onPress={onBack} />
        <View style={styles.wordmarkAndPlus}>
          <Wordmark width={125} height={29} />
          <Plus width={16} height={16} style={styles.plus} />
        </View>
        <View style={styles.valueProps}>
          <View style={styles.valueProp}>
            <Checkmark width={24} height={24} />
            <Text style={styles.valuePropText}>Choose your own journeys</Text>
          </View>
          <View style={styles.valueProp}>
            <Checkmark width={24} height={24} />
            <Text style={styles.valuePropText}>Invite friends to class for free</Text>
          </View>
          <View style={styles.valueProp}>
            <Checkmark width={24} height={24} />
            <Text style={styles.valuePropText}>Unlimited classes each day</Text>
          </View>
          <View style={styles.valueProp}>
            <Checkmark width={24} height={24} />
            <Text style={styles.valuePropText}>Early access to new content</Text>
          </View>
          <View style={styles.valueProp}>
            <Checkmark width={24} height={24} />
            <Text style={styles.valuePropText}>Cancel anytime</Text>
          </View>
        </View>

        {state.isOsehPlus ? (
          <>
            <Text style={styles.price}>You are already receiving these benefits!</Text>
            <FilledPrimaryButton
              onPress={goBack}
              setTextStyle={setUpgradeTextStyle}
              fullWidth
              marginTop={32}>
              <Text style={upgradeTextStyle}>Continue to Oseh+</Text>
            </FilledPrimaryButton>
          </>
        ) : (
          <>
            <Text style={styles.price}>Only $3.33/mo, $39.99 billed annually</Text>
            <OutlineWhiteButton
              onPress={onUpgrade}
              setTextStyle={setUpgradeTextStyle}
              fullWidth
              marginTop={32}>
              <Text style={upgradeTextStyle}>Upgrade to Oseh+</Text>
            </OutlineWhiteButton>
            <FilledPrimaryButton
              onPress={goBack}
              setTextStyle={setCancelTextStyle}
              fullWidth
              marginTop={24}>
              <Text style={cancelTextStyle}>Gimme My Free Minute</Text>
            </FilledPrimaryButton>
            <Text style={styles.price}>
              Not ready to upgrade? No worries{EMDASH}you{RSQUO}ll still get a complimentary class
              daily.
            </Text>
          </>
        )}
      </OsehImageBackgroundFromState>
      <StatusBar style="light" />
    </View>
  );
};
