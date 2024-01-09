import { ReactElement, useContext } from 'react';
import { FeatureComponentProps } from '../../../models/Feature';
import { ConfirmMergeAccountResources } from '../ConfirmMergeAccountResources';
import { ConfirmMergeAccountState } from '../ConfirmMergeAccountState';
import { ConfirmMergeAccountWrapper } from './ConfirmMergeAccountWrapper';
import { styles } from './styles';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { useWritableValueWithCallbacks } from '../../../../../shared/lib/Callbacks';
import { ListLoginOptions } from './ListLoginOptions';
import { Text, View } from 'react-native';
import { FilledInvertedButton } from '../../../../../shared/components/FilledInvertedButton';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';

export const TrivialMerge = ({
  resources,
  state,
}: FeatureComponentProps<
  ConfirmMergeAccountState,
  ConfirmMergeAccountResources
>): ReactElement => {
  const loginContextRaw = useContext(LoginContext);
  const givenNameVWC = useMappedValueWithCallbacks(
    loginContextRaw.value,
    (loginRaw) =>
      loginRaw.state === 'logged-in'
        ? loginRaw.userAttributes.givenName
        : undefined
  );

  const closeDisabled = useWritableValueWithCallbacks(() => false);
  const onDismiss = useWritableValueWithCallbacks(() => () => {});

  return (
    <ConfirmMergeAccountWrapper
      state={state}
      resources={resources}
      closeDisabled={closeDisabled}
      onDismiss={onDismiss}
      keepSessionOpen
    >
      <RenderGuardedComponent
        props={givenNameVWC}
        component={(givenName) => (
          <Text style={styles.title}>
            All set{givenName && <>, {givenName}</>}
          </Text>
        )}
      />
      <Text style={styles.description}>
        You have successfully merged your two accounts. You can now login with{' '}
        <ListLoginOptions state={state} resources={resources} />
      </Text>
      <View style={styles.buttonContainer}>
        <RenderGuardedComponent
          props={closeDisabled}
          component={(disabled) => (
            <FilledInvertedButton
              onPress={() => {
                onDismiss.get()();
              }}
              disabled={disabled}
              spinner={disabled}
            >
              Ok
            </FilledInvertedButton>
          )}
        />
      </View>
    </ConfirmMergeAccountWrapper>
  );
};
