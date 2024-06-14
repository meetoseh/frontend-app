import { ReactElement, useCallback } from 'react';
import { styles } from './OsehTextInputStyles';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useReactManagedValueAsValueWithCallbacks } from '../hooks/useReactManagedValueAsValueWithCallbacks';
import { useWritableValueWithCallbacks } from '../lib/Callbacks';
import { setVWC } from '../lib/setVWC';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';

type OsehTextInputProps = {
  /**
   * The label for the text input, which also acts as its
   * placeholder.
   */
  label: string;

  /**
   * The initial value of the text input. Because managed text inputs
   * require synchronous updates, and we avoid synchronous updates to
   * stay compatible with react, we cannot use managed text inputs.
   */
  defaultValue?: string;

  /**
   * Disables the input and fades it out
   */
  disabled: boolean;

  /**
   * Ignored when disabled - configures the style of the input
   */
  inputStyle: 'white';

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
  defaultValue,
  disabled,
  inputStyle,
  bonusTextInputProps,
  onChange,
  type = 'text',
  doFocus = null,
}: OsehTextInputProps): ReactElement => {
  const onChangeVWC = useReactManagedValueAsValueWithCallbacks(onChange);
  const handleChange = useCallback(
    (text: string) => {
      onChangeVWC.get()(text);
    },
    [onChangeVWC]
  );

  const textInputRef = useWritableValueWithCallbacks<TextInput | null>(
    () => null
  );
  useValueWithCallbacksEffect(textInputRef, (raw) => {
    if (raw === null) {
      doFocus?.(() => {});
      return undefined;
    }

    const r = raw;
    doFocus?.(() => r.focus());
    return undefined;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={(r) => setVWC(textInputRef, r)}
        style={styles.input}
        defaultValue={defaultValue}
        onChangeText={handleChange}
        editable={!disabled}
        placeholder={label}
        placeholderTextColor={styles.placeholder.color}
        {...bonusTextInputProps}
      />
    </View>
  );
};
