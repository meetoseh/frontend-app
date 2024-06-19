import { ReactElement, useCallback, useRef } from "react";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import { setVWC } from "../../../../shared/lib/setVWC";
import { styles } from "./EditTimeRangeStyles";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";
import { View, Text, StyleProp, TextStyle } from "react-native";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { TimePicker } from "../../../../shared/components/TimePicker";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import { useContentWidth } from "../../../../shared/lib/useContentWidth";

/**
 * Describes a time range, e.g., 8am-10am. To avoid ambiguity on days
 * where the time changes, we describe the time range as seconds from
 * the first midnight on the reference day.
 */
export type TimeRange = {
  /** The start of the time range in seconds from midnight */
  start: number;

  /** The end of the time range in seconds from midnight */
  end: number;
};

/**
 * Determines if two time ranges are semantically equivalent
 */
export const areRangesEqual = (a: TimeRange, b: TimeRange): boolean =>
  a.start === b.start && a.end === b.end;

export type EditTimeRangeProps = {
  /**
   * The values for the time range inputs. As the user inputs a new
   * time range, this value will be updated.
   */
  timeRange: WritableValueWithCallbacks<TimeRange>;

  /**
   * Whether the form should be disabled or not.
   */
  disabled: ValueWithCallbacks<boolean>;

  /**
   * Called when the user clicks the continue button.
   */
  onContinue: ValueWithCallbacks<() => void>;
};

/**
 * Renders a form to edit a time range. This is expected to be within a modal,
 * i.e., the page contains a larger form that contains a time range, and if the
 * user wants to edit the time they can tap the time range to open a modal
 * containing this form. Hence, this renders a continue button and assumes that
 * it is instant and can't fail.
 */
export const EditTimeRange = ({
  timeRange,
  disabled,
  onContinue,
}: EditTimeRangeProps): ReactElement => {
  const todayMidnight = useRef<Date>(null) as React.MutableRefObject<Date>;
  if (todayMidnight.current === null) {
    todayMidnight.current = new Date();
    todayMidnight.current.setHours(0, 0, 0, 0);
  }

  const rawTimeRange = useWritableValueWithCallbacks<TimeRange>(() => ({
    start: timeRange.get().start % 86400,
    end: timeRange.get().end % 86400,
  }));
  const rawStart = useMappedValueWithCallbacks(
    rawTimeRange,
    (raw) => raw.start
  );
  const rawEnd = useMappedValueWithCallbacks(rawTimeRange, (raw) => raw.end);

  useValueWithCallbacksEffect(rawTimeRange, (raw) => {
    if (raw.start <= raw.end) {
      setVWC(timeRange, { start: raw.start, end: raw.end }, areRangesEqual);
    } else {
      setVWC(
        timeRange,
        { start: raw.start, end: raw.end + 86400 },
        areRangesEqual
      );
    }
    return undefined;
  });

  const onFormSubmit = useCallback(() => {
    if (disabled.get()) {
      return;
    }

    onContinue.get()();
  }, [onContinue, disabled]);

  const onStartChange = useCallback(
    (newStart: number) => {
      setVWC(
        rawTimeRange,
        { ...rawTimeRange.get(), start: newStart },
        areRangesEqual
      );
    },
    [rawTimeRange]
  );

  const onEndChange = useCallback(
    (newEnd: number) => {
      setVWC(
        rawTimeRange,
        { ...rawTimeRange.get(), end: newEnd },
        areRangesEqual
      );
    },
    [rawTimeRange]
  );

  const continueTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  const contentWidth = useContentWidth();

  return (
    <View style={{ ...styles.container, width: contentWidth }}>
      <View style={styles.formItems}>
        <View style={styles.formItem}>
          <Text style={styles.formItemTitle}>Start Time</Text>
          <RenderGuardedComponent
            props={rawStart}
            component={(value) => (
              <TimePicker value={value} setValue={onStartChange} />
            )}
          />
        </View>
        <View style={styles.formItem}>
          <Text style={styles.formItemTitle}>End Time</Text>
          <RenderGuardedComponent
            props={rawEnd}
            component={(value) => (
              <TimePicker value={value} setValue={onEndChange} />
            )}
          />
        </View>
      </View>

      <View style={styles.submitContainer}>
        <RenderGuardedComponent
          props={disabled}
          component={(d) => (
            <FilledInvertedButton
              onPress={onFormSubmit}
              disabled={d}
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
