import { ReactElement, useContext } from "react";
import { FeatureComponentProps } from "../../../models/Feature";
import { ConfirmMergeAccountResources } from "../ConfirmMergeAccountResources";
import { ConfirmMergeAccountState } from "../ConfirmMergeAccountState";
import { ConfirmMergeAccountWrapper } from "./ConfirmMergeAccountWrapper";
import { useWritableValueWithCallbacks } from "../../../../../shared/lib/Callbacks";
import { LoginContext } from "../../../../../shared/contexts/LoginContext";
import { styles } from "./styles";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";
import { ModalContext } from "../../../../../shared/contexts/ModalContext";
import { useErrorModal } from "../../../../../shared/hooks/useErrorModal";
import { useValueWithCallbacksEffect } from "../../../../../shared/hooks/useValueWithCallbacksEffect";
import { setVWC } from "../../../../../shared/lib/setVWC";
import { View, Text } from "react-native";
import { FilledInvertedButton } from "../../../../../shared/components/FilledInvertedButton";
import * as Linking from "expo-linking";
import { LinkButton } from "../../../../../shared/components/LinkButton";

export const ContactSupport = ({
  resources,
  state,
}: FeatureComponentProps<
  ConfirmMergeAccountState,
  ConfirmMergeAccountResources
>): ReactElement => {
  const loginContext = useContext(LoginContext);
  const modalContext = useContext(ModalContext);
  const givenName = loginContext.userAttributes?.givenName;
  const closeDisabled = useWritableValueWithCallbacks(() => false);
  const onDismiss = useWritableValueWithCallbacks(() => () => {});

  const error = useWritableValueWithCallbacks(() => state.get().error);
  useValueWithCallbacksEffect(state, (s) => {
    setVWC(error, s.error);
    return undefined;
  });

  useErrorModal(modalContext.modals, error, "merging accounts");

  return (
    <ConfirmMergeAccountWrapper
      state={state}
      resources={resources}
      closeDisabled={closeDisabled}
      onDismiss={onDismiss}
    >
      <Text style={styles.title}>
        {givenName ? <>{givenName},</> : <>Contact support</>}
      </Text>
      <Text style={styles.description}>
        Sorry, something went wrong when trying to merge your accounts. Please
        contact hi@oseh.com for assistance.
      </Text>
      <View style={styles.buttonContainer}>
        <RenderGuardedComponent
          props={closeDisabled}
          component={(disabled) => (
            <FilledInvertedButton
              onPress={() => {
                Linking.openURL(
                  "mailto:hi@oseh.com?subject=Error merging accounts"
                );
                onDismiss.get()();
              }}
              disabled={disabled}
              spinner={disabled}
            >
              Open Email
            </FilledInvertedButton>
          )}
        />
        <RenderGuardedComponent
          props={closeDisabled}
          component={(disabled) => (
            <LinkButton
              onPress={() => {
                onDismiss.get()();
              }}
              disabled={disabled}
            >
              Back to Safety
            </LinkButton>
          )}
        />
      </View>
    </ConfirmMergeAccountWrapper>
  );
};
