import {
  ComponentProps,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { styles } from "./OsehTextInputStyles";
import { View, Text, TextInput, TextInputProps } from "react-native";

type OsehTextInputProps = {
  /**
   * The label for the text input, which also acts as its
   * placeholder.
   */
  label: string;

  /**
   * The current value of the text input
   */
  value: string;

  /**
   * Disables the input and fades it out
   */
  disabled: boolean;

  /**
   * Ignored when disabled - configures the style of the input
   */
  inputStyle: "white";

  /**
   * Called when the value of the input changes
   */
  onChange: (this: void, value: string) => void;

  /**
   * Additional props to forward to the text input
   */
  bonusTextInputProps?: TextInputProps;

  /**
   * The type of input. Generally only text-like inputs will work, like number,
   * though there are often better components for anything except text or email.
   *
   * @default 'text'
   */
  type?: string;

  /**
   * If specified, called with a function that can be used to focus the input
   */
  doFocus?: ((focuser: (this: void) => void) => void) | null;
};

/**
 * Describes a managed text input with a floating label and an error variant.
 */
export const OsehTextInput = ({
  label,
  value,
  disabled,
  inputStyle,
  bonusTextInputProps,
  onChange,
  type = "text",
  doFocus = null,
}: OsehTextInputProps): ReactElement => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        {...bonusTextInputProps}
      />
    </View>
  );
};
