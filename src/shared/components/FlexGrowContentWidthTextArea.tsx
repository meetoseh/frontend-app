import { Pressable, TextInput, TextStyle, View } from 'react-native';
import {
  downgradeTypedVWC,
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  WritableValueWithTypedCallbacks,
} from '../lib/Callbacks';
import { ReactElement, useEffect, useMemo } from 'react';
import { createValueWithCallbacksEffect } from '../hooks/createValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
import { styles } from './FlexGrowContentWidthTextAreaStyles';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { useStyleVWC } from '../hooks/useStyleVWC';

export type FlexGrowContentWidthTextAreaProps = {
  /**
   * The style to use for the text; we will force no vertical padding as it won't work
   * correctly regardless
   */
  textStyle: TextStyle;
  /** The color for placeholder text */
  placeholderTextColor: string;
  /** The text shown when the textarea is not focused and they haven't written anything */
  placeholder: string;
  /** unused on native */
  submit: { onClick: () => void } | null;
  /**
   * The value of the textarea. When the callback is invoked by this component
   * we set updateInput to false. Whenever its invoked by other components, it
   * should be set to true. Only used on the web.
   */
  value: WritableValueWithTypedCallbacks<
    string,
    { updateInput: boolean } | undefined
  >;
  /** We store the ref to the input here, if provided */
  refVWC?: WritableValueWithCallbacks<TextInput | null>;
  /** If the text area should be editable; undefined for always editable */
  editable?: ValueWithCallbacks<boolean> | boolean;
  /** the content width to use */
  contentWidth: ValueWithCallbacks<number>;
  /** the screen width to use */
  screenWidth: ValueWithCallbacks<number>;
  /** unused on native */
  enterBehavior: 'never-submit' | 'submit-unless-shift' | 'submit-if-ctrl';
};

/**
 * A minimally sized multiline text input which grows to fill the available
 * height. Specifically, this grows the same as
 * `<VerticalSpacer height={0} flexGrow={1} />`
 */
export const FlexGrowContentWidthTextArea = (
  props: FlexGrowContentWidthTextAreaProps
): ReactElement => {
  const containerHeightVWC = useWritableValueWithCallbacks<number>(() => 0);
  const inputVWC = useWritableValueWithCallbacks<TextInput | null>(() => null);

  useEffect(() => {
    if (props.refVWC === undefined) {
      return undefined;
    }

    const propRef = props.refVWC;
    return createValueWithCallbacksEffect(inputVWC, (i) => {
      setVWC(propRef, i);
      return undefined;
    });
  }, [inputVWC, props.refVWC]);

  const realTextStyleVWC = useMappedValuesWithCallbacks(
    [containerHeightVWC, props.contentWidth],
    (height): TextStyle =>
      Object.assign(
        {
          verticalAlign: 'top',
        },
        props.textStyle,
        {
          paddingVertical: 0,
          paddingTop: 0,
          paddingBottom: 0,
          position: 'absolute',
          top: 0,
          height: containerHeightVWC.get(),
          width: props.contentWidth.get(),
        }
      ),
    { inputEqualityFn: () => false }
  );

  const editableVWC = useWritableValueWithCallbacks<boolean>(() =>
    props.editable === undefined
      ? true
      : props.editable === true || props.editable === false
      ? props.editable
      : props.editable.get()
  );
  useEffect(() => {
    if (props.editable === undefined || props.editable === true) {
      setVWC(editableVWC, true);
      return;
    }

    if (props.editable === false) {
      setVWC(editableVWC, false);
      return;
    }

    const propEditable = props.editable;
    return createValueWithCallbacksEffect(propEditable, (e) => {
      setVWC(editableVWC, e);
      return undefined;
    });
  }, [props.editable]);

  const textInputProps = useMappedValuesWithCallbacks(
    [editableVWC, downgradeTypedVWC(props.value)],
    () => ({
      editable: editableVWC.get(),
      text: props.value.get(),
    })
  );

  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const containerStyleVWC = useMappedValueWithCallbacks(
    props.contentWidth,
    (contentWidth) =>
      Object.assign({}, styles.container, {
        width: contentWidth,
      })
  );
  useStyleVWC(containerRef, containerStyleVWC);

  return (
    <View
      style={containerStyleVWC.get()}
      ref={(r) => setVWC(containerRef, r)}
      onLayout={(e) => {
        const newHeight = e?.nativeEvent?.layout?.height;
        if (
          newHeight === undefined ||
          typeof newHeight !== 'number' ||
          isNaN(newHeight) ||
          !isFinite(newHeight) ||
          newHeight < 0
        ) {
          return;
        }

        setVWC(containerHeightVWC, newHeight);
      }}
    >
      <RenderGuardedComponent
        props={realTextStyleVWC}
        component={(textStyle) => (
          <RenderGuardedComponent
            props={textInputProps}
            component={({ text, editable }) => (
              <TextInput
                style={textStyle}
                value={text}
                editable={editable}
                placeholderTextColor={props.placeholderTextColor}
                placeholder={props.placeholder}
                multiline
                onChangeText={(text) => {
                  props.value.set(text);
                  props.value.callbacks.call({ updateInput: false });
                }}
              />
            )}
            applyInstantly
          />
        )}
      />
    </View>
  );
};
