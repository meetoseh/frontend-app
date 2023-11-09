import { ReactElement, useCallback, useEffect, useRef } from "react";
import { styles } from "./TimePickerStyles";
import { Platform, Pressable, Text, View } from "react-native";
import { makeSecondsOffsetPretty } from "../../user/core/features/requestNotificationTime/formatUtils";
import { useWritableValueWithCallbacks } from "../lib/Callbacks";
import { setVWC } from "../lib/setVWC";
import { useValueWithCallbacksEffect } from "../hooks/useValueWithCallbacksEffect";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { RenderGuardedComponent } from "./RenderGuardedComponent";

type TimePickerProps = {
  /**
   * The current value of the time picker as seconds from midnight, 0-86400
   */
  value: number;

  /**
   * The function to call to set the time in seconds from midnight, 0-86400
   */
  setValue: (value: number) => void;

  /**
   * The variant of the picker style to use.
   * @default 'white'
   */
  variant?: "white";
};

const usingImperativeAPI =
  Platform.OS === "android" &&
  DateTimePickerAndroid !== null &&
  DateTimePickerAndroid !== undefined;

/**
 * Shows a tap-to-edit time picker, using the appropriate native time picker
 */
export const TimePicker = ({
  value,
  setValue,
}: TimePickerProps): ReactElement => {
  const containerRef = useRef<View>(null);
  const pressing = useWritableValueWithCallbacks(() => false);
  const editing = useWritableValueWithCallbacks(() => false);

  useValueWithCallbacksEffect(pressing, (down) => {
    const ref = containerRef.current;
    if (ref === null) {
      return undefined;
    }

    ref.setNativeProps({
      style: createContainerStyle(down),
    });
  });

  const handlePressIn = useCallback(() => {
    setVWC(pressing, true);
  }, [pressing]);

  const handlePressOut = useCallback(() => {
    setVWC(pressing, false);
  }, [pressing]);

  const handlePress = useCallback(() => {
    setVWC(editing, true);
  }, [editing]);

  const setValueUsingDate = useCallback(
    (d: Date) => {
      const newHours = d.getHours();
      const newMinutes = d.getMinutes();
      const newValue = newHours * 3600 + newMinutes * 60;
      setValue(newValue);
    },
    [setValue]
  );

  useValueWithCallbacksEffect(editing, (open) => {
    if (!usingImperativeAPI) {
      return;
    }

    if (open) {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value - hours * 3600) / 60);

      const currentValueAsDate = new Date();
      currentValueAsDate.setHours(hours, minutes, 0, 0);
      DateTimePickerAndroid.open({
        value: currentValueAsDate,
        mode: "time",
        onChange: (e, selected) => {
          if (selected !== undefined) {
            setValueUsingDate(selected);
          }
          setVWC(editing, false);
        },
      });

      return () => {
        DateTimePickerAndroid.dismiss("time");
      };
    }
  });

  const pickerValue = useWritableValueWithCallbacks(() => new Date());

  useEffect(() => {
    const d = new Date();

    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value - hours * 3600) / 60);

    d.setHours(hours, minutes, 0, 0);
    setVWC(pickerValue, d);
  }, [value, pickerValue]);

  if (usingImperativeAPI) {
    return (
      <Pressable
        style={createContainerStyle(pressing.get())}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        ref={containerRef}
      >
        <Text style={styles.label}>
          {makeSecondsOffsetPretty(value, {
            minutes: "always",
            spaceAmPm: true,
          })}
        </Text>
      </Pressable>
    );
  }

  return (
    <RenderGuardedComponent
      props={pickerValue}
      component={(v) => (
        /*
         * This component has a little padding on its left that we need to accommodate
         * for to make this component appear centered. We could use a negative margin
         * to remove it instead, but that's riskier if the value changes in the future
         */
        <View style={{ paddingRight: 9 }}>
          <DateTimePicker
            value={v}
            mode="time"
            themeVariant="dark"
            onChange={(e, selected) => {
              if (selected !== undefined) {
                setValueUsingDate(selected);
              }
            }}
          />
        </View>
      )}
    />
  );
};

const createContainerStyle = (pressing: boolean) => {
  return Object.assign(
    {},
    styles.container,
    pressing ? styles.pressingContainer : undefined
  );
};
