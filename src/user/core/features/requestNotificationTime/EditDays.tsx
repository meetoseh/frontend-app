import { ReactElement, useCallback } from "react";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import { styles } from "./EditDaysStyles";
import { DayOfWeek } from "./RequestNotificationTimeResources";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { setVWC } from "../../../../shared/lib/setVWC";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import { StyleProp, TextStyle, View, Text } from "react-native";
import { Checkbox } from "../../../../shared/components/Checkbox";

export type EditDaysProps = {
  /**
   * The days that are currently selected. If the user changes the days,
   * this value will be updated.
   */
  days: WritableValueWithCallbacks<Set<DayOfWeek>>;

  /**
   * If the form should be disabled or not.
   */
  disabled: ValueWithCallbacks<boolean>;

  /**
   * Called when the user clicks the continue button.
   */
  onContinue: ValueWithCallbacks<() => void>;
};

const daysOfWeek: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Renders a form to edit a set of days of the week. This is expected to be
 * within a modal, i.e., the page contains a larger form that contains a set of
 * days, and if the user wants to edit the days they can tap the days to open a
 * modal containing this form. Hence, this renders a continue button and assumes
 * that it is instant and can't fail.
 */
export const EditDays = ({
  days,
  disabled,
  onContinue,
}: EditDaysProps): ReactElement => {
  const checkedVWC = useMappedValueWithCallbacks(
    days,
    useCallback((daysV) => {
      const res = new Array<boolean>(daysOfWeek.length);
      for (let i = 0; i < res.length; i++) {
        res[i] = daysV.has(daysOfWeek[i]);
      }
      return res;
    }, []),
    {
      outputEqualityFn(a, b) {
        return a.length === b.length && a.every((v, i) => v === b[i]);
      },
    }
  );

  const onFormSubmit = useCallback(() => {
    if (disabled.get()) {
      return;
    }

    const checked = checkedVWC.get();
    const newDays = new Set<DayOfWeek>();
    for (let i = 0; i < checked.length; i++) {
      if (checked[i]) {
        newDays.add(daysOfWeek[i]);
      }
    }
    setVWC(days, newDays);

    onContinue.get()();
  }, [checkedVWC, onContinue, disabled, days]);

  const continueTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  return (
    <View style={styles.form}>
      <View style={styles.formItems}>
        <RenderGuardedComponent
          props={checkedVWC}
          component={(checked) => (
            <>
              {checked.map((c, i) => (
                <Checkbox
                  key={i}
                  checkboxStyle="whiteWide"
                  label={daysOfWeek[i]}
                  containerStyle={
                    i === 0
                      ? styles.formItem
                      : { ...styles.formItem, ...styles.formItemNotLastChild }
                  }
                  value={c}
                  setValue={(v) => {
                    const oldDays = days.get();
                    const newDays = new Set(oldDays);
                    if (v) {
                      newDays.add(daysOfWeek[i]);
                    } else {
                      newDays.delete(daysOfWeek[i]);
                    }
                    setVWC(days, newDays);
                  }}
                />
              ))}
            </>
          )}
        />
      </View>
      <View style={styles.submitContainer}>
        <RenderGuardedComponent
          props={disabled}
          component={(d) => (
            <FilledInvertedButton
              disabled={d}
              onPress={onFormSubmit}
              setTextStyle={(s) => {
                setVWC(continueTextStyle, s);
              }}
            >
              <RenderGuardedComponent
                props={continueTextStyle}
                component={(s) => <Text style={s}>Continue</Text>}
              />
            </FilledInvertedButton>
          )}
        />
      </View>
    </View>
  );
};
