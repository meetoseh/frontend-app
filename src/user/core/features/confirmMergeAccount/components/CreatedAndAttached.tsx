import { ReactElement, useContext } from "react";
import { FeatureComponentProps } from "../../../models/Feature";
import { ConfirmMergeAccountResources } from "../ConfirmMergeAccountResources";
import { ConfirmMergeAccountState } from "../ConfirmMergeAccountState";
import { useWritableValueWithCallbacks } from "../../../../../shared/lib/Callbacks";
import { ConfirmMergeAccountWrapper } from "./ConfirmMergeAccountWrapper";
import { LoginContext } from "../../../../../shared/contexts/LoginContext";
import { ListLoginOptions } from "./ListLoginOptions";
import { styles } from "./styles";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";
import { View, Text } from "react-native";
import { FilledInvertedButton } from "../../../../../shared/components/FilledInvertedButton";

export const CreatedAndAttached = ({
  resources,
  state,
}: FeatureComponentProps<
  ConfirmMergeAccountState,
  ConfirmMergeAccountResources
>): ReactElement => {
  const loginContext = useContext(LoginContext);
  const givenName = loginContext.userAttributes?.givenName;
  const closeDisabled = useWritableValueWithCallbacks(() => false);
  const onDismiss = useWritableValueWithCallbacks(() => () => {});

  return (
    <ConfirmMergeAccountWrapper
      state={state}
      resources={resources}
      closeDisabled={closeDisabled}
      onDismiss={onDismiss}
    >
      <Text style={styles.title}>All set{givenName && <>, {givenName}</>}</Text>
      <Text style={styles.description}>
        Your{" "}
        <ListLoginOptions
          state={state}
          resources={resources}
          onlyMerging
          nullText="new"
        />{" "}
        identity is now connected with Oseh.
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
