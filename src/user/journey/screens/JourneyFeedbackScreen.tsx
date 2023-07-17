import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { JourneyScreenProps } from "../models/JourneyScreenProps";
import { styles } from "./JourneyFeedbackScreenStyles";
import { LoginContext } from "../../../shared/contexts/LoginContext";
import {
  Callbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../shared/lib/Callbacks";
import { ease, easeInOut, easeOutBack } from "../../../shared/lib/Bezier";
import {
  BezierAnimation,
  animIsComplete,
  calculateAnimValue,
} from "../../../shared/lib/BezierAnimation";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { setVWC } from "../../../shared/lib/setVWC";
import { useValueWithCallbacksEffect } from "../../../shared/hooks/useValueWithCallbacksEffect";
import {
  BezierAnimator,
  BezierColorAnimator,
} from "../../../shared/anim/AnimationLoop";
import { useAnimatedValueWithCallbacks } from "../../../shared/anim/useAnimatedValueWithCallbacks";
import { apiFetch } from "../../../shared/lib/apiFetch";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";
import {
  View,
  Text,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";
import { CloseButton } from "../../../shared/components/CloseButton";
import { useTopBarHeight } from "../../../shared/hooks/useTopBarHeight";
import { StatusBar } from "expo-status-bar";
import {
  LinearGradientBackground,
  LinearGradientState,
} from "../../../shared/anim/LinearGradientBackground";
import { adaptValueWithCallbacksAsVariableStrategyProps } from "../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps";
import { GrayscaledView } from "../../../shared/components/GrayscaledView";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { CustomButtonProps } from "../../../shared/models/CustomButtonProps";
import { useStateCompat } from "../../../shared/hooks/useStateCompat";
import { FilledInvertedButton } from "../../../shared/components/FilledInvertedButton";
import { LinkButton } from "../../../shared/components/LinkButton";

/**
 * Asks the user for feedback about the journey so that we can curate the
 * content that they see.
 */
export const JourneyFeedbackScreen = ({
  journey,
  shared,
  setScreen,
}: JourneyScreenProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const responseVWC = useWritableValueWithCallbacks<number | null>(() => null);
  const emojiStatesVWCs = useMemo(
    () =>
      [0, 1, 2, 3].map(() =>
        createWritableValueWithCallbacks<FeedbackButtonState>({
          rotation: 0,
          scale: 1,
          ...getTarget(false),
        })
      ),
    []
  );

  // Manages the emoji rotation & scale when a response is selected
  useEffect(() => {
    let active = true;
    let canceled = new Callbacks<undefined>();
    let animations: {
      rotation: BezierAnimation[];
      scale: BezierAnimation[];
    } | null = null;
    let animating = false;

    startManaging();
    return () => {
      if (active) {
        active = false;
        canceled.call(undefined);
      }
    };

    function startManaging() {
      onResponseChanged();

      responseVWC.callbacks.add(onResponseChanged);

      canceled.add(() => {
        responseVWC.callbacks.remove(onResponseChanged);
      });
    }

    function onResponseChanged() {
      clearStyles();

      const response = responseVWC.get();
      if (response === null) {
        animations = null;
        return;
      }

      const scaleFirstDirection = (Math.random() > 0.5 ? 1 : -1) as 1 | -1;
      animations = {
        rotation: [
          {
            from: 0,
            to: 360 * (Math.random() > 0.5 ? 1 : -1),
            startedAt: null,
            ease: easeOutBack,
            duration: 1000,
          },
        ],
        scale: [
          {
            from: 1,
            to: 1 + 0.1 * scaleFirstDirection,
            startedAt: null,
            ease: ease,
            duration: 200,
          },
          {
            from: 1 + 0.1 * scaleFirstDirection,
            to: 1 - 0.1 * scaleFirstDirection,
            startedAt: null,
            ease: easeInOut,
            duration: 400,
          },
          {
            from: 1 - 0.1 * scaleFirstDirection,
            to: 1,
            startedAt: null,
            ease: ease,
            duration: 200,
          },
        ],
      };
      if (!animating) {
        animating = true;
        requestAnimationFrame(onFrame);
      }
    }

    function clearStyles() {
      emojiStatesVWCs.forEach((s, idx) => {
        setVWC(
          s,
          {
            ...s.get(),
            rotation: 0,
            scale: 1,
          },
          emojiStateEqualityFn
        );
      });
    }

    function onFrame(now: DOMHighResTimeStamp) {
      const response = responseVWC.get();
      if (!active || animations === null || response === null) {
        animating = false;
        return;
      }

      while (
        animations.rotation.length > 0 &&
        animIsComplete(animations.rotation[0], now)
      ) {
        animations.rotation.shift();
      }

      while (
        animations.scale.length > 0 &&
        animIsComplete(animations.scale[0], now)
      ) {
        animations.scale.shift();
      }

      if (animations.rotation.length === 0 && animations.scale.length === 0) {
        clearStyles();
        animating = false;
        return;
      }

      const rotation =
        animations.rotation.length === 0
          ? 0
          : calculateAnimValue(animations.rotation[0], now);
      const scale =
        animations.scale.length === 0
          ? 1
          : calculateAnimValue(animations.scale[0], now);
      setVWC(
        emojiStatesVWCs[response - 1],
        {
          ...emojiStatesVWCs[response - 1].get(),
          rotation,
          scale,
        },
        emojiStateEqualityFn
      );
      requestAnimationFrame(onFrame);
    }
  }, [emojiStatesVWCs, responseVWC]);

  useSimpleButtonAnimators(emojiStatesVWCs[0], responseVWC, 1);
  useSimpleButtonAnimators(emojiStatesVWCs[1], responseVWC, 2);
  useSimpleButtonAnimators(emojiStatesVWCs[2], responseVWC, 3);
  useSimpleButtonAnimators(emojiStatesVWCs[3], responseVWC, 4);

  const storeResponse = useCallback(async () => {
    const response = responseVWC.get();
    if (response === null || loginContext.state !== "logged-in") {
      return;
    }

    const resp = await apiFetch(
      "/api/1/journeys/feedback",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          journey_uid: journey.uid,
          journey_jwt: journey.jwt,
          version: "oseh_jf-otp_sKjKVHs8wbI",
          response: response,
          feedback: null,
        }),
        keepalive: true,
      },
      loginContext
    );

    if (!resp.ok) {
      console.warn("Failed to store feedback response", resp);
    }
  }, [loginContext, responseVWC, journey.uid, journey.jwt]);

  const onX = useCallback(() => {
    storeResponse();
    setScreen("post", true);
  }, [setScreen, storeResponse]);

  const onContinue = onX;

  const clickResponse = useMemo<(() => void)[]>(
    () =>
      [1, 2, 3, 4].map((i) => () => {
        setVWC(responseVWC, i);
      }),
    [responseVWC]
  );

  const screenSize = useWindowSize();
  const topBarHeight = useTopBarHeight();
  const responseButtonWidths =
    Math.min(screenSize.width, styles.content.maxWidth) - 64;

  return (
    <View style={styles.container}>
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={useMappedValueWithCallbacks(shared, (s) => s.darkenedImage)}
        style={{ ...styles.innerContainer, height: screenSize.height }}
      >
        <CloseButton onPress={onX} />
        <View
          style={{
            ...styles.content,
            paddingTop: styles.content.paddingTop + topBarHeight,
            width: screenSize.width,
          }}
        >
          <Text style={{ ...styles.title, width: responseButtonWidths }}>
            How did that feel?
          </Text>
          <View
            style={{
              ...styles.answers,
              width: responseButtonWidths,
            }}
          >
            <FeedbackButton
              onClick={clickResponse[0]}
              emoji={"😍"}
              text="Loved"
              state={emojiStatesVWCs[0]}
            />
            <View style={styles.answerSpacing} />
            <FeedbackButton
              onClick={clickResponse[1]}
              emoji={"😌"}
              text="Liked"
              state={emojiStatesVWCs[1]}
            />
            <View style={styles.answerSpacing} />
            <FeedbackButton
              onClick={clickResponse[2]}
              emoji={"😕"}
              text="Disliked"
              state={emojiStatesVWCs[2]}
            />
            <View style={styles.answerSpacing} />
            <FeedbackButton
              onClick={clickResponse[3]}
              emoji={"☹️"}
              text="Hated"
              state={emojiStatesVWCs[3]}
            />
          </View>
          <RenderGuardedComponent
            props={useMappedValueWithCallbacks(responseVWC, (r) => r !== null)}
            component={(haveResponse) => {
              const [textStyle, setTextStyle] = useStateCompat<
                StyleProp<TextStyle>
              >(() => ({}));
              const props: CustomButtonProps = {
                setTextStyle,
                fullWidth: true,
                marginTop: 60,
                onPress: onContinue,
              };

              if (haveResponse) {
                return (
                  <FilledInvertedButton {...props}>
                    <Text style={textStyle}>Continue</Text>
                  </FilledInvertedButton>
                );
              } else {
                return (
                  <LinkButton {...props}>
                    <Text style={textStyle}>Skip</Text>
                  </LinkButton>
                );
              }
            }}
          />
          <Text style={{ ...styles.infoText, width: responseButtonWidths }}>
            Your ratings will be used to personalize your experience
          </Text>
        </View>
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};

type FeedbackButtonState = {
  /* 0-1 grayscale strength */
  grayscale: number;
  /* degrees */
  rotation: number;
  /* 0-1 scale */
  scale: number;
  /* 0-255 rgb, 0-1 opacity */
  gradient: {
    color1: [number, number, number, number];
    color2: [number, number, number, number];
  };
};

const emojiStateEqualityFn = (a: FeedbackButtonState, b: FeedbackButtonState) =>
  a.grayscale === b.grayscale &&
  a.rotation === b.rotation &&
  a.scale === b.scale;

type FeedbackButtonProps = {
  onClick: () => void;
  emoji: string;
  text: string;
  state: ValueWithCallbacks<FeedbackButtonState>;
};

const FeedbackButton = ({
  onClick,
  emoji,
  text,
  state: stateVWC,
}: FeedbackButtonProps): React.ReactElement => {
  const emojiRef = useRef<View>(null);
  const emojiStyle = useMappedValueWithCallbacks(stateVWC, (s): ViewStyle => {
    return {
      ...styles.answerEmojiContainer,
      transform: [{ rotate: `${s.rotation}deg` }, { scale: s.scale }],
    };
  });

  useValueWithCallbacksEffect(
    emojiStyle,
    useCallback((state) => {
      if (emojiRef.current === null) {
        return;
      }
      emojiRef.current.setNativeProps({ style: state });
      return undefined;
    }, [])
  );

  return (
    <Pressable onPress={onClick} style={styles.answerOuter}>
      <LinearGradientBackground
        state={adaptValueWithCallbacksAsVariableStrategyProps(
          useMappedValueWithCallbacks(
            stateVWC,
            (s): LinearGradientState => ({
              stops: [
                {
                  color: s.gradient.color1,
                  offset: 0.0249,
                },
                {
                  color: s.gradient.color2,
                  offset: 0.9719,
                },
              ],
              angleDegreesClockwiseFromTop: 95.08,
            })
          )
        )}
      >
        <View style={styles.answer}>
          <View style={emojiStyle.get()} ref={emojiRef}>
            <GrayscaledView
              strength={adaptValueWithCallbacksAsVariableStrategyProps(
                useMappedValueWithCallbacks(stateVWC, (s) => s.grayscale)
              )}
              child={{
                type: "react-rerender",
                props: useMemo(
                  () => <Text style={styles.answerEmojiText}>{emoji}</Text>,
                  [emoji]
                ),
              }}
            />
          </View>
          <Text style={styles.answerText}>{text}</Text>
        </View>
      </LinearGradientBackground>
    </Pressable>
  );
};

type SimpleFeedbackButtonState = {
  grayscale: number;
  gradient: FeedbackButtonState["gradient"];
};

const getTarget = (selected: boolean): SimpleFeedbackButtonState => {
  return selected
    ? {
        grayscale: 0,
        gradient: {
          color1: [87, 184, 162, 1],
          color2: [0, 153, 153, 1],
        },
      }
    : {
        grayscale: 1,
        gradient: {
          color1: [68, 98, 102, 0.4],
          color2: [68, 98, 102, 0.4],
        },
      };
};

const useSimpleButtonAnimators = (
  stateVWC: WritableValueWithCallbacks<FeedbackButtonState>,
  responseVWC: ValueWithCallbacks<number | null>,
  response: number
) => {
  const target = useAnimatedValueWithCallbacks<SimpleFeedbackButtonState>(
    getTarget(responseVWC.get() === response),
    () => [
      new BezierAnimator(
        ease,
        350,
        (p) => p.grayscale,
        (p, v) => (p.grayscale = v)
      ),
      new BezierColorAnimator(
        ease,
        350,
        (p) => p.gradient.color1,
        (p, v) => (p.gradient.color1 = v)
      ),
      new BezierColorAnimator(
        ease,
        350,
        (p) => p.gradient.color2,
        (p, v) => (p.gradient.color2 = v)
      ),
    ],
    (p) => {
      setVWC(
        stateVWC,
        {
          ...stateVWC.get(),
          ...p,
        },
        emojiStateEqualityFn
      );
    }
  );

  useValueWithCallbacksEffect(
    responseVWC,
    useCallback(
      (selected) => {
        setVWC(
          target,
          getTarget(selected === response),
          (a, b) =>
            a.grayscale === b.grayscale &&
            a.gradient.color1.every((v, i) => v === b.gradient.color1[i]) &&
            a.gradient.color2.every((v, i) => v === b.gradient.color2[i])
        );
        return undefined;
      },
      [response, target]
    )
  );
};
