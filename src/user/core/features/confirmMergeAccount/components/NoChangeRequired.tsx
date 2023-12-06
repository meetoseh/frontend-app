import { ReactElement } from "react";
import { FeatureComponentProps } from "../../../models/Feature";
import { ConfirmMergeAccountResources } from "../ConfirmMergeAccountResources";
import { ConfirmMergeAccountState } from "../ConfirmMergeAccountState";
import { useWritableValueWithCallbacks } from "../../../../../shared/lib/Callbacks";
import { ConfirmMergeAccountWrapper } from "./ConfirmMergeAccountWrapper";
import { styles } from "./styles";
import { ListLoginOptions } from "./ListLoginOptions";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";
import { Text, View } from "react-native";
import { FilledInvertedButton } from "../../../../../shared/components/FilledInvertedButton";

export const NoChangeRequired = ({
  resources,
  state,
}: FeatureComponentProps<
  ConfirmMergeAccountState,
  ConfirmMergeAccountResources
>): ReactElement => {
  const closeDisabled = useWritableValueWithCallbacks(() => false);
  const onDismiss = useWritableValueWithCallbacks(() => () => {});

  return (
    <ConfirmMergeAccountWrapper
      state={state}
      resources={resources}
      closeDisabled={closeDisabled}
      onDismiss={onDismiss}
    >
      <Text style={styles.title}>Accounts Already Linked</Text>
      <Text style={styles.description}>
        Your accounts are already linked. You can continue to login with{" "}
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
