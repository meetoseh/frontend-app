import { ReactElement, useEffect, useMemo } from "react";
import { useStateCompat as useState } from "../../../shared/hooks/useStateCompat";
import { InteractiveWordPrompt } from "../models/InteractivePrompt";
import { CountdownText } from "./CountdownText";
import { styles } from "./WordPromptStyles";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
} from "../../../shared/lib/Callbacks";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";
import { ProfilePictures } from "./ProfilePictures";
import { PromptTitle } from "./PromptTitle";
import { HorizontalPartlyFilledRoundedRect } from "../../../shared/anim/HorizontalPartlyFilledRoundedRect";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { PromptProps } from "../models/PromptProps";
import { PromptSettings } from "../models/PromptSettings";
import { usePromptResources } from "../hooks/usePromptResources";
import { apiFetch } from "../../../shared/lib/apiFetch";
import { Pressable, View, Text, StyleProp, TextStyle } from "react-native";
import { FilledPrimaryButton } from "../../../shared/components/FilledPrimaryButton";
import { CustomButtonProps } from "../../../shared/models/CustomButtonProps";
import { LinkButton } from "../../../shared/components/LinkButton";
import { useUnwrappedValueWithCallbacks } from "../../../shared/hooks/useUnwrappedValueWithCallbacks";
import Checked from "../icons/Checked";

type WordPromptProps = PromptProps<InteractiveWordPrompt, string | null>;

const unfilledColor: [number, number, number, number] = [
  68 / 255,
  98 / 255,
  102 / 255,
  0.4,
];
const filledColor: [number, number, number, number] = [
  68 / 255,
  98 / 255,
  102 / 255,
  0.9,
];

const settings: PromptSettings<InteractiveWordPrompt, string | null> = {
  getSelectionFromIndex: (prompt, index) =>
    index ? (prompt.prompt.options ?? [])[index] ?? null : null,
  getResponseDistributionFromStats: (prompt, stats) =>
    stats.wordActive ?? prompt.prompt.options.map(() => 0),
  storeResponse: async (loginContext, prompt, time, response, index) => {
    if (index === null) {
      return;
    }

    await apiFetch(
      "/api/1/interactive_prompts/events/respond_word_prompt",
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          interactive_prompt_uid: prompt.uid,
          interactive_prompt_jwt: prompt.jwt,
          session_uid: prompt.sessionUid,
          prompt_time: time / 1000,
          data: {
            index,
          },
        }),
        keepalive: true,
      },
      loginContext
    );
  },
};

export const WordPrompt = (props: WordPromptProps): ReactElement => {
  const resources = usePromptResources(props, settings);
  const hasSelectionVWC = useMappedValueWithCallbacks(
    resources.selectedIndex,
    (s) => s !== null
  );
  const screenSize = useWindowSize();

  const boundFilledWidthGetterSetters: WritableValueWithCallbacks<number>[] =
    useMemo(() => {
      return resources.prompt.prompt.options.map(() =>
        createWritableValueWithCallbacks<number>(0)
      );
    }, [resources]);

  useEffect(() => {
    resources.clientPredictedResponseDistribution.callbacks.add(updateWidths);
    updateWidths();
    return () => {
      resources.clientPredictedResponseDistribution.callbacks.remove(
        updateWidths
      );
    };

    function updateWidths() {
      const correctedStats =
        resources.clientPredictedResponseDistribution.get();
      const totalResponses = correctedStats.reduce((a, b) => a + b, 0);
      const fractionals =
        totalResponses === 0
          ? correctedStats.map(() => 0)
          : correctedStats.map((v) => v / totalResponses);
      fractionals.forEach((fractional, idx) => {
        const old = boundFilledWidthGetterSetters[idx].get();
        if (old === fractional) {
          return;
        }
        boundFilledWidthGetterSetters[idx].set(fractional);
        boundFilledWidthGetterSetters[idx].callbacks.call(undefined);
      });
    }
  }, [resources, boundFilledWidthGetterSetters]);

  const optionWidth = Math.min(390, Math.min(screenSize.width, 440) - 48);
  const finishEarly = props.finishEarly;

  return (
    <>
      {props.countdown && (
        <CountdownText
          promptTime={resources.time}
          prompt={resources.prompt}
          {...props.countdown}
        />
      )}
      <View
        style={{
          ...styles.prompt,
          ...(!props.countdown || !finishEarly || screenSize.height > 700
            ? {}
            : { marginTop: 12 }),
        }}
      >
        {/* we run out of space with countdown && finishEarly */}
        <PromptTitle
          text={resources.prompt.prompt.text}
          subtitle={props.subtitle}
          titleMaxWidth={props.titleMaxWidth}
        />
        <View style={styles.options}>
          {resources.prompt.prompt.options.map((option, idx) => {
            return (
              <View
                key={idx}
                style={{
                  ...styles.option,
                  ...(idx === 0 ? {} : styles.optionNotFirstChild),
                  width: optionWidth,
                  height: 54,
                }}
              >
                <View style={styles.optionBackground}>
                  <HorizontalPartlyFilledRoundedRect
                    props={{
                      type: "callbacks",
                      props: () => ({
                        filledWidth: boundFilledWidthGetterSetters[idx].get(),
                        unfilledColor: unfilledColor,
                        filledColor: filledColor,
                        opacity: 1.0,
                        borderRadius: 10,
                      }),
                      callbacks: boundFilledWidthGetterSetters[idx].callbacks,
                    }}
                    height={54}
                    width={optionWidth}
                  />
                </View>
                <Pressable
                  style={{
                    ...styles.optionForeground,
                    width: optionWidth,
                    height: 54,
                  }}
                  onPress={() => {
                    if (resources.selectedIndex.get() === idx) {
                      return;
                    }

                    resources.selectedIndex.set(idx);
                    resources.selectedIndex.callbacks.call(undefined);
                  }}
                >
                  <CheckmarkFromSelection
                    index={idx}
                    selection={resources.selectedIndex}
                  />
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        {finishEarly && (
          <View
            style={{
              ...styles.continueContainer,
              ...(props.countdown && screenSize.height <= 750
                ? {}
                : { paddingTop: 45, paddingBottom: 60 }),
            }}
          >
            <RenderGuardedComponent
              props={hasSelectionVWC}
              component={(hasSelection) => {
                const [textStyle, setTextStyle] = useState<
                  StyleProp<TextStyle>
                >({});
                const text = hasSelection
                  ? finishEarly === true
                    ? "Continue"
                    : finishEarly.cta
                  : "Skip";
                const props: CustomButtonProps = {
                  onPress: resources.onSkip,
                  setTextStyle,
                };

                if (hasSelection) {
                  return (
                    <FilledPrimaryButton {...props}>
                      <Text style={textStyle}>{text}</Text>
                    </FilledPrimaryButton>
                  );
                } else {
                  return (
                    <LinkButton {...props}>
                      <Text style={textStyle}>{text}</Text>
                    </LinkButton>
                  );
                }
              }}
            />
          </View>
        )}
        <View
          style={Object.assign(
            {},
            styles.profilePictures,
            { width: optionWidth },
            props.countdown || !finishEarly
              ? null
              : {
                  marginTop: 5,
                  marginBottom: 8,
                }
          )}
        >
          <ProfilePictures profilePictures={resources.profilePictures} />
        </View>
      </View>
    </>
  );
};

/**
 * Shows a checkmark which is checked if the selection matches the
 * given index, and unchecked otherwise, without triggering react
 * state updates.
 */
const CheckmarkFromSelection = ({
  index,
  selection,
}: {
  index: number;
  selection: ValueWithCallbacks<number | null>;
}): ReactElement => {
  const checked = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(selection, (s) => s === index, {
      inputEqualityFn: (a, b) => a === b,
      outputEqualityFn: Object.is,
    })
  );

  return (
    <View
      style={Object.assign(
        {},
        styles.checkmarkContainer,
        checked ? styles.checkmarkContainerChecked : undefined
      )}
    >
      {checked && <Checked />}
    </View>
  );
};
