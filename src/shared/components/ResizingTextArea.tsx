import { ReactElement, useEffect } from 'react';
import {
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
} from '../lib/Callbacks';
import { createValueWithCallbacksEffect } from '../hooks/createValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
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
import {
  useValueWithCallbacksLikeVWC,
  ValueWithCallbacksLike,
} from '../ValueWithCallbacksLike';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';

export type ResizingTextAreaProps = {
  /** The styling variant to use */
  variant: 'dark';
  /** The text shown when the textarea is not focused and they haven't written anything */
  placeholder: string;
  /** Configures a submit button in the textarea; null for no submit button */
  submit: ValueWithCallbacksLike<{
    icon: ReactElement;
    onClick: () => void;
  } | null>;
  /** The value of the textarea */
  value: ValueWithCallbacks<string>;
  /** Called when the user changes the value of the text area */
  onValueChanged: (v: string) => void;
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
    [heightVWC, editableVWC, props.value],
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

  const submitVWC = useValueWithCallbacksLikeVWC(props.submit);
  const submitIsNullVWC = useMappedValueWithCallbacks(
    submitVWC,
    (s) => s === null
  );

  return (
    <RenderGuardedComponent
      props={submitIsNullVWC}
      component={(submitIsNull) =>
        submitIsNull ? (
          <View style={styles.simpleWrapper}>
            <RenderGuardedComponent
              props={textInputProps}
              component={({ height, editable, text }) => (
                <TextInput
                  style={Object.assign({}, styles.textareaText, {
                    height: height,
                  })}
                  placeholderTextColor={OsehColors.v4.primary.grey}
                  multiline
                  placeholder={props.placeholder}
                  ref={(r) => setVWC(refVWC, r)}
                  value={text}
                  editable={editable}
                  onChangeText={props.onValueChanged}
                  onContentSizeChange={onContentSizeChange}
                />
              )}
              applyInstantly
            />
          </View>
        ) : (
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
                    onChangeText={props.onValueChanged}
                    onContentSizeChange={onContentSizeChange}
                  />
                )}
                applyInstantly
              />
            </Pressable>
            <HorizontalSpacer width={6} />
            <Pressable
              style={styles.submit}
              onPress={() => {
                submitVWC.get()?.onClick?.();
              }}
            >
              <RenderGuardedComponent
                props={submitVWC}
                component={(s) => (s === null ? <></> : s.icon)}
              />
            </Pressable>
          </View>
        )
      }
    />
  );
};
