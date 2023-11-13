import { ReactElement, useEffect } from "react";
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../lib/Callbacks";
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from "../anim/VariableStrategyProps";
import { useMappedValueWithCallbacks } from "../hooks/useMappedValueWithCallbacks";
import { ease } from "../lib/Bezier";
import { setVWC } from "../lib/setVWC";
import { View } from "react-native";
import { colorToCSS, makeSVGNumber } from "../anim/svgUtils";
import { useAnimationTargetAndRendered } from "../anim/useAnimationTargetAndRendered";
import {
  BezierAnimator,
  BezierColorAnimator,
  TrivialAnimator,
} from "../anim/AnimationLoop";
import { useValuesWithCallbacksEffect } from "../hooks/useValuesWithCallbacksEffect";
import { RenderGuardedComponent } from "./RenderGuardedComponent";
import * as SVG from "react-native-svg";

type InlineOsehSpinnerVariant = "black" | "white" | "white-thin" | "primary";
type InlineOsehSpinnerProps = {
  size: VariableStrategyProps<{ width: number } | { height: number }>;
  variant?: InlineOsehSpinnerVariant;
};

const opacityAnimationTime = 200;
const dashAnimationTime = 1200;
const dashEase = ease;

const forwardDotTime = opacityAnimationTime - 50;
const forwardTime = dashAnimationTime + 700;
const backwardTime = dashAnimationTime - opacityAnimationTime;
const backwardDotTime = opacityAnimationTime + 500;
const paddingToCompensateForPoorSVGStrokesNearEdge = 4;

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
  const state = useWritableValueWithCallbacks<SpinnerState>(() => "dotVisible");

  useEffect(() => {
    setVWC(state, "dotVisible");
    let timeout: NodeJS.Timeout = setTimeout(onDotFinished, forwardDotTime);

    function onDotFinished() {
      setVWC(state, "visible");
      timeout = setTimeout(onForwardFinished, forwardTime);
    }

    function onForwardFinished() {
      setVWC(state, "dotVisible");
      timeout = setTimeout(onBackwardFinished, backwardTime);
    }

    function onBackwardFinished() {
      setVWC(state, "hidden");
      timeout = setTimeout(onBackwardDotFinished, backwardDotTime);
    }

    function onBackwardDotFinished() {
      setVWC(state, "dotVisible");
      timeout = setTimeout(onDotFinished, forwardDotTime);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [state]);

  return (
    <View>
      <Spinner size={sizeVWC} variant={variant} state={state} />
    </View>
  );
};

// spinner is essentially an FSM
type SpinnerState = "hidden" | "dotVisible" | "visible";
type SpinnerProps = {
  size: ValueWithCallbacks<{ width: number } | { height: number }>;
  variant: InlineOsehSpinnerVariant;
  state: ValueWithCallbacks<SpinnerState>;
};

type SpinnerAnimationState = {
  requestedSize: { width: number } | { height: number };
  strokeWidth: number;
  // rgba, 0-1 range for each
  strokeColor: [number, number, number, number];
  circle1LengthFraction: number;
  circle2LengthFraction: number;
};

type ComputedAnimationState = {
  realStrokeWidth: number;
  pointScaleFactor: number;
  viewboxPaddingX: number;
  viewboxPaddingY: number;
  size: { width: number; height: number };
  viewBox: { width: number; height: number };
  /* Required for react-native-svg: 
     https://github.com/software-mansion/react-native-svg/issues/1738 */
  path1Length: number;
  path2Length: number;
};

const variantStrokeColor = (
  variant: InlineOsehSpinnerVariant
): [number, number, number] => {
  if (variant === "black") {
    return [0, 0, 0];
  } else if (variant === "white" || variant === "white-thin") {
    return [1, 1, 1];
  } else if (variant === "primary") {
    return [0.2, 0.286, 0.298];
  }
  throw new Error(
    `Unknown inline oseh spinner variant for stroke color: ${variant}`
  );
};

const variantStrokeWidth = (variant: InlineOsehSpinnerVariant): number => {
  if (variant === "white-thin") {
    return 3;
  }
  return 5;
};

const widthBeforeStroke = 100;
const heightBeforeStroke = 94.4;

const computeViewboxForStrokeWidth = (
  strokeWidth: number
): { width: number; height: number } => {
  return {
    width: widthBeforeStroke + strokeWidth,
    height: heightBeforeStroke + strokeWidth,
  };
};

const getComputedState = (
  state: SpinnerAnimationState
): ComputedAnimationState => {
  const strokeWidth = state.strokeWidth;
  const viewBox = computeViewboxForStrokeWidth(strokeWidth);

  const requestedScale =
    "width" in state.requestedSize
      ? state.requestedSize.width / viewBox.width
      : state.requestedSize.height / viewBox.height;

  return {
    viewBox: {
      width:
        viewBox.width * requestedScale +
        paddingToCompensateForPoorSVGStrokesNearEdge * 2,
      height:
        viewBox.height * requestedScale +
        paddingToCompensateForPoorSVGStrokesNearEdge * 2,
    },
    size: {
      width:
        viewBox.width * requestedScale +
        paddingToCompensateForPoorSVGStrokesNearEdge * 2,
      height:
        viewBox.height * requestedScale +
        paddingToCompensateForPoorSVGStrokesNearEdge * 2,
    },
    viewboxPaddingX: paddingToCompensateForPoorSVGStrokesNearEdge,
    viewboxPaddingY: paddingToCompensateForPoorSVGStrokesNearEdge,
    realStrokeWidth: strokeWidth * requestedScale,
    pointScaleFactor: requestedScale,
    path1Length: computePathLength(CIRCLE_PATH, requestedScale),
    path2Length: computePathLength(ARC_PATH, requestedScale),
  };
};

const isComputedStateEqual = (
  a: ComputedAnimationState,
  b: ComputedAnimationState
): boolean => {
  return (
    a.realStrokeWidth === b.realStrokeWidth &&
    a.pointScaleFactor === b.pointScaleFactor &&
    a.viewboxPaddingX === b.viewboxPaddingX &&
    a.viewboxPaddingY === b.viewboxPaddingY &&
    a.size.width === b.size.width &&
    a.size.height === b.size.height &&
    a.viewBox.width === b.viewBox.width &&
    a.viewBox.height === b.viewBox.height &&
    a.path1Length === b.path1Length &&
    a.path2Length === b.path2Length
  );
};

const hiddenSpinnerAnimationState = (
  requestedSize: { width: number } | { height: number },
  variant: InlineOsehSpinnerVariant
): SpinnerAnimationState => {
  return {
    requestedSize,
    strokeWidth: variantStrokeWidth(variant),
    strokeColor: [...variantStrokeColor(variant), 0],
    circle1LengthFraction: MIN_STROKE_DASH_OFFSET,
    circle2LengthFraction: MIN_STROKE_DASH_OFFSET,
  };
};

const dotSpinnerAnimationState = (
  requestedSize: { width: number } | { height: number },
  variant: InlineOsehSpinnerVariant
): SpinnerAnimationState => {
  return {
    requestedSize,
    strokeWidth: variantStrokeWidth(variant),
    strokeColor: [...variantStrokeColor(variant), 1],
    circle1LengthFraction: MIN_STROKE_DASH_OFFSET,
    circle2LengthFraction: MIN_STROKE_DASH_OFFSET,
  };
};

const shownSpinnerAnimationState = (
  requestedSize: { width: number } | { height: number },
  variant: InlineOsehSpinnerVariant
): SpinnerAnimationState => {
  return {
    requestedSize,
    strokeWidth: variantStrokeWidth(variant),
    strokeColor: [...variantStrokeColor(variant), 1],
    circle1LengthFraction: 1,
    circle2LengthFraction: 1,
  };
};

type RawSvgPathPart = {
  operation: "A" | "C" | "M" | "Z";
  values: number[];
};

const renderShiftedScaledPoint = (
  x: number,
  y: number,
  dx: number,
  dy: number,
  s: number,
  out: string[]
): void => {
  const shiftedX = x + dx;
  const shiftedY = y + dy;
  out.push(makeSVGNumber(shiftedX * s));
  out.push(" ");
  out.push(makeSVGNumber(shiftedY * s));
};

const renderShiftedScaledRawSvgPathPart = (
  part: RawSvgPathPart,
  dx: number,
  dy: number,
  s: number,
  out: string[]
) => {
  out.push(part.operation);

  if (part.operation === "A") {
    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    out.push(makeSVGNumber(part.values[0] * s));
    out.push(" ");
    out.push(makeSVGNumber(part.values[1] * s));
    out.push(" ");
    for (let i = 2; i < part.values.length - 2; i++) {
      out.push(makeSVGNumber(part.values[i]));
      out.push(" ");
    }
    renderShiftedScaledPoint(
      part.values[part.values.length - 2],
      part.values[part.values.length - 1],
      dx,
      dy,
      s,
      out
    );
    return;
  }

  for (let i = 0; i < part.values.length; i += 2) {
    if (i !== 0) {
      out.push(" ");
    }
    renderShiftedScaledPoint(
      part.values[i],
      part.values[i + 1],
      dx,
      dy,
      s,
      out
    );
  }
};

type RawSvgPath = RawSvgPathPart[];

const renderShiftedScaledRawSvgPath = (
  path: RawSvgPath,
  dx: number,
  dy: number,
  s: number
): string => {
  const result: string[] = [];
  for (const part of path) {
    renderShiftedScaledRawSvgPathPart(part, dx, dy, s, result);
  }
  return result.join("");
};

/**
 * Computes the length of the given path after applying the scaling factor.
 * This only supports enough to calculate our circle path and arc path lengths
 */
const computePathLength = (path: RawSvgPath, s: number): number => {
  if (path === CIRCLE_PATH) {
    return 2 * Math.PI * 35.904 * s;
  } else if (path === ARC_PATH) {
    // used https://codepen.io/DariaIvK/full/gOpWYQE
    return 190.147 * s;
  }
  throw new Error("unsupported path");
};

const CIRCLE_PATH: RawSvgPath = [
  { operation: "M", values: [71.808, 58.453] },
  { operation: "A", values: [35.904, 35.904, 0, 0, 1, 35.904, 94.357] },
  { operation: "A", values: [35.904, 35.904, 0, 0, 1, 0, 58.453] },
  { operation: "A", values: [35.904, 35.904, 0, 0, 1, 35.904, 22.549] },
  { operation: "A", values: [35.904, 35.904, 0, 0, 1, 71.808, 58.453] },
  { operation: "Z", values: [] },
];

const ARC_PATH: RawSvgPath = [
  { operation: "M", values: [35.345, 59.578] },
  { operation: "C", values: [27.32, 49.625, 24.994, 36.236, 29.193, 24.16] },
  { operation: "C", values: [33.427, 12.236, 43.958, 3.288, 56.312, 0.755] },
  { operation: "C", values: [83.775, -4.818, 106.971, 21.429, 98.065, 47.999] },
  { operation: "C", values: [94.366, 59.036, 85.611, 67.638, 74.51, 71.143] },
  { operation: "C", values: [73.044, 71.609, 71.55, 71.983, 70.036, 72.262] },
];

const MIN_STROKE_DASH_OFFSET = 0.01;

const Spinner = ({
  size,
  variant,
  state: fsmState,
}: SpinnerProps): ReactElement => {
  const state = useAnimationTargetAndRendered(
    () => hiddenSpinnerAnimationState(size.get(), variant),
    () => [
      new TrivialAnimator("requestedSize"),
      new BezierAnimator(
        ease,
        350,
        (p) => p.strokeWidth,
        (p, v) => (p.strokeWidth = v)
      ),
      new BezierColorAnimator(
        ease,
        opacityAnimationTime,
        (p) => p.strokeColor,
        (p, v) => (p.strokeColor = v)
      ),
      new BezierAnimator(
        dashEase,
        dashAnimationTime,
        (p) => p.circle1LengthFraction,
        (p, v) => (p.circle1LengthFraction = v)
      ),
      new BezierAnimator(
        dashEase,
        dashAnimationTime,
        (p) => p.circle2LengthFraction,
        (p, v) => (p.circle2LengthFraction = v)
      ),
    ]
  );

  useValuesWithCallbacksEffect([size, fsmState], () => {
    const fsm = fsmState.get();
    if (fsm === "hidden") {
      setVWC(state.target, hiddenSpinnerAnimationState(size.get(), variant));
    } else if (fsm === "dotVisible") {
      setVWC(state.target, dotSpinnerAnimationState(size.get(), variant));
    } else {
      setVWC(state.target, shownSpinnerAnimationState(size.get(), variant));
    }

    return undefined;
  });

  const computed = useMappedValueWithCallbacks(
    state.rendered,
    (s) => getComputedState(s),
    {
      outputEqualityFn: isComputedStateEqual,
    }
  );

  const strokeInfo = useMappedValueWithCallbacks(
    state.rendered,
    (v) => ({
      strokeColor: v.strokeColor,
      circle1LengthFraction: v.circle1LengthFraction,
      circle2LengthFraction: v.circle2LengthFraction,
    }),
    {
      inputEqualityFn: () => false,
      outputEqualityFn: (a, b) =>
        a.strokeColor === b.strokeColor &&
        a.circle1LengthFraction === b.circle1LengthFraction &&
        a.circle2LengthFraction === b.circle2LengthFraction,
    }
  );

  return (
    <RenderGuardedComponent
      props={computed}
      component={(computed) => (
        <View
          style={{
            width: computed.size.width - computed.viewboxPaddingX * 2,
            height: computed.size.height - computed.viewboxPaddingX * 2,
            position: "relative",
            left: -computed.viewboxPaddingX,
            top: -computed.viewboxPaddingY,
            overflow: "visible",
          }}
        >
          <SVG.Svg
            width={makeSVGNumber(computed.size.width)}
            height={makeSVGNumber(computed.size.height)}
            viewBox={`0 0 ${makeSVGNumber(
              computed.viewBox.width
            )} ${makeSVGNumber(computed.viewBox.height)}`}
          >
            <SVG.Defs>
              <SVG.Circle x="5" y="5" r="500" id="test-circle" />
              <SVG.Path
                d={renderShiftedScaledRawSvgPath(
                  CIRCLE_PATH,
                  computed.realStrokeWidth / 2 + computed.viewboxPaddingX,
                  computed.realStrokeWidth / 2 + computed.viewboxPaddingY,
                  computed.pointScaleFactor
                )}
                fill="none"
                strokeLinecap="round"
                strokeMiterlimit="10"
                id="circle-path"
              />
              <SVG.Path
                d={renderShiftedScaledRawSvgPath(
                  ARC_PATH,
                  computed.realStrokeWidth / 2 + computed.viewboxPaddingX,
                  computed.realStrokeWidth / 2 + computed.viewboxPaddingY,
                  computed.pointScaleFactor
                )}
                fill="none"
                strokeLinecap="round"
                strokeMiterlimit="10"
                id="arc-path"
              />
            </SVG.Defs>
            <RenderGuardedComponent
              props={strokeInfo}
              component={(strokeInfo) => (
                <>
                  <SVG.Use
                    href="#circle-path"
                    stroke={colorToCSS(strokeInfo.strokeColor)}
                    strokeWidth={computed.realStrokeWidth}
                    strokeDasharray={computed.path1Length}
                    strokeDashoffset={
                      (1 - strokeInfo.circle1LengthFraction) *
                      computed.path1Length
                    }
                  />
                  <SVG.Use
                    href="#arc-path"
                    stroke={colorToCSS(strokeInfo.strokeColor)}
                    strokeWidth={computed.realStrokeWidth}
                    strokeDasharray={computed.path2Length}
                    strokeDashoffset={
                      (1 - strokeInfo.circle1LengthFraction) *
                      computed.path2Length
                    }
                  />
                </>
              )}
            />
          </SVG.Svg>
        </View>
      )}
    />
  );
};
