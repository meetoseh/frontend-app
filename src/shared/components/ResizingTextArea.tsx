import { ReactElement, useEffect } from 'react';
import {
  downgradeTypedVWC,
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  WritableValueWithTypedCallbacks,
} from '../lib/Callbacks';
import { createValueWithCallbacksEffect } from '../hooks/createValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import { styles } from './ResizingTextAreaStyles';
import { HorizontalSpacer } from './HorizontalSpacer';
import {
  View,
  Pressable,
  TextInput,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { OsehColors } from '../OsehColors';

export type ResizingTextAreaProps = {
  /** The styling variant to use */
  variant: 'dark';
  /** The text shown when the textarea is not focused and they haven't written anything */
  placeholder: string;
  /** Configures a submit button in the textarea; null for no submit button */
  submit: { icon: ReactElement; onClick: () => void } | null;
  /**
   * The value of the textarea. When the callback is invoked with
   * `{ updateInput: true }` or `undefined`, we set the value of the input. If it's
   * called with `{ updateInput: false }`, we don't set the value of the input.
   * Whenever this is set by this component, `{ updateInput: false }` is used.
   */
  value: WritableValueWithTypedCallbacks<
    string,
    { updateInput: boolean } | undefined
  >;
  /** We store the ref to the input here, if provided */
  refVWC?: WritableValueWithCallbacks<TextInput | null>;
  /** If the text area should be editable; undefined for always editable */
  editable?: ValueWithCallbacks<boolean> | boolean;
  /** Ignored; used only on the web */
  enterBehavior: 'never-submit' | 'submit-unless-shift' | 'submit-if-ctrl';
};

/** Suggested settings for the resizing text area icon */
export const RESIZING_TEXT_AREA_ICON_SETTINGS = {
  icon: { width: 24 },
  container: { width: 56, height: 48 },
  startPadding: { x: { fraction: 0.5 }, y: { fraction: 0.5 } },
} as const;

/**
 * Shows a text area that automatically resizes to match the content size
 * and optionally includes a submit icon button within the visual border.
 */
export const ResizingTextArea = (props: ResizingTextAreaProps) => {
  const refVWC = useWritableValueWithCallbacks<TextInput | null>(() => null);
  useEffect(() => {
    if (props.refVWC === undefined) {
      return;
    }
    const propRef = props.refVWC;
    return createValueWithCallbacksEffect(refVWC, (r) => {
      setVWC(propRef, r);
      return undefined;
    });
  }, [props.refVWC]);

  const heightVWC = useWritableValueWithCallbacks<number>(() => 22);
  const editableVWC = useWritableValueWithCallbacks<boolean>(() =>
    props.editable === undefined
      ? true
      : props.editable === true || props.editable === false
      ? props.editable
      : props.editable.get()
  );

  const textInputProps = useMappedValuesWithCallbacks(
    [heightVWC, editableVWC, downgradeTypedVWC(props.value)],
    () => ({
      height: heightVWC.get(),
      editable: editableVWC.get(),
      text: props.value.get(),
    })
  );

  const onContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const height = e?.nativeEvent?.contentSize?.height;
    if (height !== undefined && !isNaN(height) && height > 0) {
      const old = heightVWC.get();
      if (old === height || (old > height && Math.abs(old - height) < 1e-3)) {
        return;
      }
      heightVWC.set(height);
      heightVWC.callbacks.call(undefined);
    }
  };

  const onChangeText = (text: string) => {
    props.value.set(text);
    props.value.callbacks.call({ updateInput: false });
  };

  if (props.submit === null) {
    return (
      <View style={styles.simpleWrapper}>
        <RenderGuardedComponent
          props={textInputProps}
          component={({ height, editable, text }) => (
            <TextInput
              style={Object.assign({}, styles.simpleText, {
                height: height,
              })}
              placeholderTextColor={OsehColors.v4.primary.grey}
              multiline
              placeholder={props.placeholder}
              ref={(r) => setVWC(refVWC, r)}
              value={text}
              editable={editable}
              onChangeText={onChangeText}
              onContentSizeChange={onContentSizeChange}
            />
          )}
          applyInstantly
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.textareaWrapper}
        onPress={() => {
          const ref = refVWC.get();
          if (ref !== null) {
            ref.focus();
          }
        }}
      >
        <RenderGuardedComponent
          props={textInputProps}
          component={({ height, editable, text }) => (
            <TextInput
              style={Object.assign({}, styles.simpleText, {
                height: height,
              })}
              placeholderTextColor={OsehColors.v4.primary.grey}
              multiline
              placeholder={props.placeholder}
              ref={(r) => setVWC(refVWC, r)}
              value={text}
              editable={editable}
              onChangeText={onChangeText}
              onContentSizeChange={onContentSizeChange}
            />
          )}
          applyInstantly
        />
      </Pressable>
      <HorizontalSpacer width={6} />
      <Pressable style={styles.submit} onPress={props.submit.onClick}>
        {props.submit.icon}
      </Pressable>
    </View>
  );
};
