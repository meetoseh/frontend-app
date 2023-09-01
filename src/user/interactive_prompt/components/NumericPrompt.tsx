import {
  MutableRefObject,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useStateCompat as useState } from "../../../shared/hooks/useStateCompat";
import { InteractiveNumericPrompt } from "../models/InteractivePrompt";
import { CountdownText } from "./CountdownText";
import { styles } from "./NumericPromptStyles";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../shared/lib/Callbacks";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";
import { PromptTitle } from "./PromptTitle";
import {
  CarouselInfo,
  useCarouselInfo,
} from "../../../shared/hooks/useCarouselInfo";
import { Carousel } from "../../../shared/components/Carousel";
import { ProfilePictures } from "./ProfilePictures";
import {
  VPFRRProps,
  VerticalPartlyFilledRoundedRect,
} from "../../../shared/anim/VerticalPartlyFilledRoundedRect";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { PromptProps } from "../models/PromptProps";
import { PromptSettings } from "../models/PromptSettings";
import { usePromptResources } from "../hooks/usePromptResources";
import { apiFetch } from "../../../shared/lib/apiFetch";
import { View, Text, TextInput, StyleProp, TextStyle } from "react-native";
import { CustomButtonProps } from "../../../shared/models/CustomButtonProps";
import { FilledPrimaryButton } from "../../../shared/components/FilledPrimaryButton";
import { LinkButton } from "../../../shared/components/LinkButton";

const optionWidthPx = 75;
const optionHeightPx = 75;
const optionGapPx = 20;
const inactiveOpacity = 0.4;
const activeOpacity = 1.0;

const optionUnfilledColor: [number, number, number, number] = [1, 1, 1, 0.5];
const optionFilledColor: [number, number, number, number] = [1, 1, 1, 1];

const settings: PromptSettings<InteractiveNumericPrompt, number | null> = {
  getSelectionFromIndex: (prompt, index) => {
    if (index === null) {
      return null;
    }

    let idx = -1;
    for (
      let val = prompt.prompt.min;
      val <= prompt.prompt.max;
      val += prompt.prompt.step
    ) {
      idx++;
      if (idx === index) {
        return val;
      }
    }

    return null;
  },
  getResponseDistributionFromStats: (prompt, stats) => {
    const numericActive = stats.numericActive ?? new Map<number, number>();

    const result: number[] = [];
    for (
      let i = prompt.prompt.min;
      i <= prompt.prompt.max;
      i += prompt.prompt.step
    ) {
      result.push(numericActive.get(i) ?? 0);
    }
    return result;
  },
  storeResponse: async (loginContext, prompt, time, response, index) => {
    if (index === null) {
      return;
    }

    await apiFetch(
      "/api/1/interactive_prompts/events/respond_numeric_prompt",
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          interactive_prompt_uid: prompt.uid,
          interactive_prompt_jwt: prompt.jwt,
          session_uid: prompt.sessionUid,
          prompt_time: time / 1000,
          data: {
            rating: response,
          },
        }),
        keepalive: true,
      },
      loginContext
    );
  },
};

export const NumericPrompt = (
  props: PromptProps<InteractiveNumericPrompt, number | null>
): ReactElement => {
  const resources = usePromptResources(props, settings);
  const hasSelectionVWC = useMappedValueWithCallbacks(
    resources.selectedIndex,
    (s) => s !== null
  );
  const screenSize = useWindowSize();

  const promptOptions = useMemo<number[]>(() => {
    const prompt = resources.prompt.prompt;
    const res: number[] = [];
    for (let i = prompt.min; i <= prompt.max; i += prompt.step) {
      res.push(i);
    }
    return res;
  }, [resources]);

  const panningVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const [carouselInfo, selectItemInCarousel, panCarouselTo] = useCarouselInfo({
    settings: {
      type: "react-rerender",
      props: {
        visibleWidth: Math.min(screenSize.width, 440),
        itemWidth: optionWidthPx,
        itemGap: optionGapPx,
        numItems: promptOptions.length,
        height: optionHeightPx,
      },
    },
    panning: {
      type: "callbacks",
      props: panningVWC.get,
      callbacks: panningVWC.callbacks,
    },
  });
  useCarouselSelectionForSelection(carouselInfo, resources.selectedIndex);

  const infos: WritableValueWithCallbacks<VPFRRProps>[] = useMemo(() => {
    return promptOptions.map((_, index) =>
      createWritableValueWithCallbacks<VPFRRProps>({
        filledHeight: 0,
        borderRadius: Math.min(optionWidthPx / 2, optionHeightPx / 2),
        unfilledColor: optionUnfilledColor,
        filledColor: optionFilledColor,
        opacity:
          resources.selectedIndex.get() === index
            ? activeOpacity
            : inactiveOpacity,
        border: { width: 2 },
      })
    );
  }, [resources, promptOptions]);

  // manages the opacity on the options
  useEffect(() => {
    let highlighted: number | null = null;
    resources.selectedIndex.callbacks.add(handleInfoEvent);
    handleInfoEvent();
    return () => {
      resources.selectedIndex.callbacks.remove(handleInfoEvent);
      removeHighlight();
    };

    function removeHighlight() {
      if (highlighted === null) {
        return;
      }
      infos[highlighted].set(
        Object.assign({}, infos[highlighted].get(), {
          opacity: inactiveOpacity,
        })
      );
      infos[highlighted].callbacks.call(undefined);
      highlighted = null;
    }

    function handleInfoEvent() {
      const sel = resources.selectedIndex.get();
      if (sel === highlighted) {
        return;
      }

      removeHighlight();
      if (sel === null) {
        return;
      }

      infos[sel].set(
        Object.assign({}, infos[sel].get(), { opacity: activeOpacity })
      );
      infos[sel].callbacks.call(undefined);
      highlighted = sel;
    }
  }, [resources, infos]);

  const statsAmountRef = useRef<TextInput>(null);
  // manages the height on the options and the value of statsAmountRef
  useEffect(() => {
    resources.clientPredictedResponseDistribution.callbacks.add(update);
    update();
    return () => {
      resources.clientPredictedResponseDistribution.callbacks.remove(update);
    };

    function update() {
      const newCorrectedStats =
        resources.clientPredictedResponseDistribution.get();

      const total = newCorrectedStats.reduce((a, b) => a + b, 0);
      const fractionals =
        total === 0
          ? newCorrectedStats.map(() => 0)
          : newCorrectedStats.map((n) => n / total);
      const average = promptOptions.reduce(
        (a, b, i) => a + b * fractionals[i],
        0
      );
      if (statsAmountRef.current !== null) {
        statsAmountRef.current.setNativeProps({
          text: `Average: ${average.toFixed(2)}`,
        });
      }

      fractionals.forEach((fractional, index) => {
        const old = infos[index].get();

        if (old.filledHeight !== fractional) {
          infos[index].set(
            Object.assign({}, old, { filledHeight: fractional })
          );
          infos[index].callbacks.call(undefined);
        }
      });
    }
  }, [resources, infos, promptOptions]);

  const optionRefs = useRef<(View | null)[]>() as MutableRefObject<
    (View | null)[]
  >;
  if (optionRefs.current === undefined) {
    optionRefs.current = [];
  }

  if (optionRefs.current.length !== promptOptions.length) {
    const newArr: (View | null)[] = [];
    for (
      let i = 0;
      i < optionRefs.current.length && i < promptOptions.length;
      i++
    ) {
      newArr.push(optionRefs.current[i]);
    }
    while (newArr.length < promptOptions.length) {
      newArr.push(null);
    }
    optionRefs.current = newArr;
  }

  const handleOptionTapped = useCallback(
    (optionIndex: number) => {
      const oldInfo = carouselInfo.get();
      if (
        oldInfo.selectedIndex === optionIndex ||
        oldInfo.panning ||
        oldInfo.inClickCooldown
      ) {
        return;
      }

      selectItemInCarousel(optionIndex);
    },
    [carouselInfo, selectItemInCarousel]
  );

  const handleCarouselTapped = useCallback(
    (tapPageX: number, tapPageY: number) => {
      let active = true;

      optionRefs.current.forEach((view, idx) => {
        if (!active) {
          return;
        }

        if (view === null) {
          return;
        }

        view.measure((x, y, width, height, pageX, pageY) => {
          if (!active) {
            return;
          }
          if (
            pageX <= tapPageX &&
            tapPageX <= pageX + width &&
            pageY <= tapPageY &&
            tapPageY <= pageY + height
          ) {
            active = false;
            handleOptionTapped(idx);
          }
        });
      });
    },
    [handleOptionTapped]
  );

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
      <View style={styles.prompt}>
        <PromptTitle
          text={resources.prompt.prompt.text}
          subtitle={props.subtitle}
          titleMaxWidth={props.titleMaxWidth}
        />
        <View style={styles.carouselContainer}>
          <Carousel
            info={carouselInfo}
            panning={panningVWC}
            panCarouselTo={panCarouselTo}
            handleCarouselTapped={handleCarouselTapped}
          >
            {promptOptions.map((option, optionIndex) => (
              <View
                key={option}
                ref={(ref) => {
                  if (optionRefs.current.length > optionIndex) {
                    optionRefs.current[optionIndex] = ref;
                  }
                }}
                style={{
                  ...styles.item,
                  ...(optionIndex !== 0 ? styles.itemNotFirstChild : {}),
                }}
              >
                <View style={styles.itemBackground}>
                  <VerticalPartlyFilledRoundedRect
                    props={{
                      type: "callbacks",
                      props: () => infos[optionIndex].get(),
                      callbacks: infos[optionIndex].callbacks,
                    }}
                    width={optionWidthPx}
                    height={optionHeightPx}
                  />
                </View>
                <View style={styles.itemForeground}>
                  <Text style={styles.itemForegroundText}>
                    {option.toString()}
                  </Text>
                </View>
              </View>
            ))}
          </Carousel>
        </View>
        <TextInput
          style={styles.statsAmount}
          ref={statsAmountRef}
          editable={false}
        />
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
          style={Object.assign({}, styles.profilePictures, {
            width: carouselInfo.get().computed.visibleWidth,
          })}
        >
          <ProfilePictures profilePictures={resources.profilePictures} />
        </View>
      </View>
    </>
  );
};

/**
 * Uses the carousel info as the current selected value for the numeric prompt
 */
const useCarouselSelectionForSelection = (
  carouselInfo: ValueWithCallbacks<CarouselInfo>,
  selection: WritableValueWithCallbacks<number | null>
) => {
  useEffect(() => {
    carouselInfo.callbacks.add(recheckSelection);
    recheckSelection();
    return () => {
      carouselInfo.callbacks.remove(recheckSelection);
    };

    function recheckSelection() {
      const correctSelectionIndex = carouselInfo.get().selectedIndex;

      if (selection.get() !== correctSelectionIndex) {
        selection.set(correctSelectionIndex);
        selection.callbacks.call(undefined);
      }
    }
  }, [carouselInfo, selection]);
};
