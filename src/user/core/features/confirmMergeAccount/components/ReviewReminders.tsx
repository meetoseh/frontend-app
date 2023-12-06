import { ReactElement } from "react";
import { FeatureComponentProps } from "../../../models/Feature";
import { ConfirmMergeAccountResources } from "../ConfirmMergeAccountResources";
import { ConfirmMergeAccountState } from "../ConfirmMergeAccountState";
import { useWritableValueWithCallbacks } from "../../../../../shared/lib/Callbacks";
import { ConfirmMergeAccountWrapper } from "./ConfirmMergeAccountWrapper";
import { styles } from "./styles";
import { RenderGuardedComponent } from "../../../../../shared/components/RenderGuardedComponent";
import { Text, View } from "react-native";
import { FilledInvertedButton } from "../../../../../shared/components/FilledInvertedButton";
import { LinkButton } from "../../../../../shared/components/LinkButton";

export const ReviewReminders = ({
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
      <Text style={styles.title}>
        Would you like to review your reminder settings?
      </Text>
      <Text style={styles.description}>
        Take a moment to review how and when you receive reminders
      </Text>
      <View style={styles.buttonContainer}>
        <RenderGuardedComponent
          props={closeDisabled}
          component={(disabled) => (
            <FilledInvertedButton
              onPress={() => {
                if (closeDisabled.get()) {
                  return;
                }

                resources
                  .get()
                  .session?.storeAction("goto_review_notifications", null);
                resources.get().session?.reset();
                resources.get().requestNotificationTimes();
                state.get().onReviewReminderSettingsPrompted();
              }}
              disabled={disabled}
              spinner={disabled}
            >
              Review Reminder Settings
            </FilledInvertedButton>
          )}
        />
        <LinkButton
          onPress={() => {
            if (closeDisabled.get()) {
              return;
            }

            onDismiss.get()();
            state.get().onReviewReminderSettingsPrompted();
          }}
        >
          Skip
        </LinkButton>
      </View>
    </ConfirmMergeAccountWrapper>
  );
};
