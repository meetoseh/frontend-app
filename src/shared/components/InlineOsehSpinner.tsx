import { MutableRefObject, useCallback, useRef } from "react";
import { Callbacks, useWritableValueWithCallbacks } from "../lib/Callbacks";
import { useForwardBackwardEffect } from "../hooks/useForwardBackwardEffect";
import { adaptValueWithCallbacksAsVariableStrategyProps } from "../lib/adaptValueWithCallbacksAsVariableStrategyProps";
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from "../anim/VariableStrategyProps";
import { useMappedValueWithCallbacks } from "../hooks/useMappedValueWithCallbacks";
import { RenderGuardedComponent } from "./RenderGuardedComponent";
import AnimatedLottieView from "lottie-react-native";

type InlineOsehSpinnerProps = {
  size: VariableStrategyProps<{ width: number } | { height: number }>;
  variant?: "black" | "white" | "primary";
};

/**
 * Shows the oseh brandmark in a configurable size. The brandmark is nearly
 * square, but not quite. To avoid accidentally squishing it, you can specify
 * either a width or a height, and the other dimension will be calculated.
 */
export const InlineOsehSpinner = ({
  size: sizeVariableStrategy,
  variant = "white",
}: InlineOsehSpinnerProps) => {
  const sizeVWC =
    useVariableStrategyPropsAsValueWithCallbacks(sizeVariableStrategy);
  const playerVWC = useWritableValueWithCallbacks<
    AnimatedLottieView | undefined
  >(() => undefined);
  const playerCallbackScheduled = useRef<boolean>(false);
  const setPlayerRef = useCallback(
    (player: AnimatedLottieView) => {
      playerVWC.set(player);
      if (!playerCallbackScheduled.current) {
        playerCallbackScheduled.current = true;
        setTimeout(() => {
          playerCallbackScheduled.current = false;
          playerVWC.callbacks.call(undefined);
        }, 0);
      }
    },
    [playerVWC]
  );

  const animationFinished = useRef<Callbacks<boolean>>() as MutableRefObject<
    Callbacks<boolean>
  >;
  if (animationFinished.current === undefined) {
    animationFinished.current = new Callbacks<boolean>();
  }
  const onAnimationFinishWrapper = useCallback((isCanceled: boolean) => {
    animationFinished.current.call(isCanceled);
  }, []);

  const { playerStyle: playerStyleVWC } = useForwardBackwardEffect({
    enabled: { type: "react-rerender", props: true },
    player: adaptValueWithCallbacksAsVariableStrategyProps(playerVWC),
    onAnimationFinished: animationFinished.current,
    animationPoints: {
      type: "react-rerender",
      props: { in: INPOINT, out: OUTPOINT },
    },
    size: adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(
        sizeVWC,
        (s) => ({ ...s, aspectRatio: NATURAL_ASPECT_RATIO }),
        {
          inputEqualityFn: (a: any, b: any) =>
            a.width === b.width && a.height === b.height,
        }
      )
    ),
    holdTime: { type: "react-rerender", props: HOLD_TIME_MS },
  });

  return (
    <RenderGuardedComponent
      props={playerStyleVWC}
      component={(playerStyle) => (
        <AnimatedLottieView
          key={variant}
          autoPlay={false}
          autoSize={false}
          loop={false}
          ref={setPlayerRef}
          style={playerStyle}
          onAnimationFinish={onAnimationFinishWrapper}
          source={
            {
              black: require("./assets/spinner-black.json"),
              white: require("./assets/spinner-white.json"),
              primary: require("./assets/spinner-primary.json"),
            }[variant]
          }
        />
      )}
    />
  );
};

const HOLD_TIME_MS = { forward: 750, backward: 500 };
const NATURAL_ASPECT_RATIO = 1341 / 1080;
/** The initial frame of the brandmark animation, aka the in point, aka "ip" */
const INPOINT = 0;
/** The final frame of the brandmark animation; aka the out point, aka "op" */
const OUTPOINT = 44;
