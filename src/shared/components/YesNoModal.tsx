import { ReactElement, useCallback, useRef } from "react";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../lib/Callbacks";
import { setVWC } from "../lib/setVWC";
import { InlineOsehSpinner } from "./InlineOsehSpinner";
import { RenderGuardedComponent } from "./RenderGuardedComponent";
import { styles } from "./YesNoModalStyles";
import { useValueWithCallbacksEffect } from "../hooks/useValueWithCallbacksEffect";
import { useAnimatedValueWithCallbacks } from "../anim/useAnimatedValueWithCallbacks";
import { BezierAnimator } from "../anim/AnimationLoop";
import { ease } from "../lib/Bezier";
import { Pressable, View, Text, GestureResponderEvent } from "react-native";
import { useWindowSize } from "../hooks/useWindowSize";
import { useMappedValuesWithCallbacks } from "../hooks/useMappedValuesWithCallbacks";
import { useTimedValueWithCallbacks } from "../hooks/useTimedValue";

export type YesNoModalProps = {
  title: string;
  body: string;
  cta1: string;
  cta2?: string;
  emphasize: 1 | 2 | null;
  onClickOne: () => Promise<void>;
  onClickTwo?: () => Promise<void>;
  /**
   * Called after the modal has been dismissed and all animations
   * have been played, so the modal can be removed from the DOM
   */
  onDismiss: () => void;
  requestDismiss: WritableValueWithCallbacks<() => void>;
};

/**
 * Shows a simple yes/no modal, including the required wrapper to
 * fade out the background and allow dismissing by clicking outside
 */
export const YesNoModal = ({
  title,
  body,
  cta1,
  cta2,
  onClickOne,
  onClickTwo,
  onDismiss,
  requestDismiss,
  emphasize,
}: YesNoModalProps): ReactElement => {
  const executingOne = useWritableValueWithCallbacks(() => false);
  const executingTwo = useWritableValueWithCallbacks(() => false);
  const visible = useWritableValueWithCallbacks(() => true);
  const fadingOut = useWritableValueWithCallbacks(() => false);
  const clickthroughPrevention = useTimedValueWithCallbacks(true, false, 500);

  const startDismiss = useCallback(() => {
    setVWC(visible, false);
  }, [visible]);
  setVWC(requestDismiss, startDismiss, (a, b) => a === b);

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useValueWithCallbacksEffect(
    visible,
    useCallback(
      (v) => {
        if (v) {
          setVWC(fadingOut, false);
          return undefined;
        }

        setVWC(fadingOut, true);
        let timeout: NodeJS.Timeout | null = null;
        const onTimeout = () => {
          timeout = null;
          onDismissRef.current();
        };
        timeout = setTimeout(onTimeout, 350);
        return () => {
          if (timeout !== null) {
            clearTimeout(timeout);
          }
        };
      },
      [fadingOut]
    )
  );

  const handleClickOne = useCallback(() => {
    if (
      executingOne.get() ||
      executingTwo.get() ||
      clickthroughPrevention.get()
    ) {
      return;
    }

    setVWC(executingOne, true);
    onClickOne().finally(() => {
      setVWC(executingOne, false);
    });
  }, [executingOne, executingTwo, clickthroughPrevention, onClickOne]);

  const handleClickTwo = useCallback(() => {
    if (
      executingOne.get() ||
      executingTwo.get() ||
      clickthroughPrevention.get() ||
      onClickTwo === undefined
    ) {
      return;
    }

    setVWC(executingTwo, true);
    onClickTwo().finally(() => {
      setVWC(executingTwo, false);
    });
  }, [executingOne, executingTwo, clickthroughPrevention, onClickTwo]);

  return (
    <Inner
      title={title}
      body={body}
      cta1={cta1}
      cta2={cta2}
      emphasize={emphasize}
      onClickOne={handleClickOne}
      onClickTwo={handleClickTwo}
      onDismiss={startDismiss}
      fadingOut={fadingOut}
      executingOne={executingOne}
      executingTwo={executingTwo}
    />
  );
};

type InnerProps = {
  title: string;
  body: string;
  cta1: string;
  cta2?: string;
  emphasize: 1 | 2 | null;
  onClickOne: () => void;
  onClickTwo?: () => void;
  onDismiss: () => void;
  fadingOut: ValueWithCallbacks<boolean>;
  executingOne: ValueWithCallbacks<boolean>;
  executingTwo: ValueWithCallbacks<boolean>;
};

type AnimationState = {
  backgroundOpacity: number;
  foregroundOpacity: number;
  contentOffsetY: number;
};
const hiddenAnimationState = (): AnimationState => ({
  backgroundOpacity: 0,
  foregroundOpacity: 0,
  contentOffsetY: 50,
});
const shownAnimationState = (): AnimationState => ({
  backgroundOpacity: 0.9,
  foregroundOpacity: 1,
  contentOffsetY: 0,
});

const Inner = ({
  title,
  body,
  cta1,
  cta2,
  emphasize,
  onClickOne,
  onClickTwo,
  onDismiss,
  fadingOut,
  executingOne,
  executingTwo,
}: InnerProps): ReactElement => {
  const windowSize = useWindowSize();
  const handleClickOne = useCallback(
    (e: GestureResponderEvent) => {
      e.stopPropagation();
      onClickOne();
    },
    [onClickOne]
  );

  const handleClickTwo = useCallback(
    (e: GestureResponderEvent) => {
      e.stopPropagation();
      onClickTwo?.();
    },
    [onClickTwo]
  );

  const rendered =
    useWritableValueWithCallbacks<AnimationState>(hiddenAnimationState);
  const containerRef = useRef<View>(null);
  const contentRef = useRef<View>(null);
  const target = useAnimatedValueWithCallbacks(
    hiddenAnimationState,
    () => [
      new BezierAnimator(
        ease,
        350,
        (p) => p.backgroundOpacity,
        (p, v) => (p.backgroundOpacity = v)
      ),
      new BezierAnimator(
        ease,
        350,
        (p) => p.foregroundOpacity,
        (p, v) => (p.foregroundOpacity = v)
      ),
      new BezierAnimator(
        ease,
        350,
        (p) => p.contentOffsetY,
        (p, v) => (p.contentOffsetY = v)
      ),
    ],
    (val) => {
      const container = containerRef.current;
      if (container !== null) {
        container.setNativeProps({
          style: {
            backgroundColor: `rgba(0, 0, 0, ${val.backgroundOpacity})`,
          },
        });
      }

      const content = contentRef.current;
      if (content !== null) {
        content.setNativeProps({
          style: {
            opacity: val.foregroundOpacity,
            top: val.contentOffsetY,
          },
        });
      }
    },
    rendered
  );

  useValueWithCallbacksEffect(fadingOut, (hidden) => {
    if (hidden) {
      setVWC(target, hiddenAnimationState());
    } else {
      setVWC(target, shownAnimationState());
    }
    return undefined;
  });

  const pressingOne = useWritableValueWithCallbacks(() => false);
  const pressingTwo = useWritableValueWithCallbacks(() => false);

  const buttonStates = useMappedValuesWithCallbacks(
    [executingOne, executingTwo, pressingOne, pressingTwo],
    () => ({
      one: executingOne.get(),
      two: executingTwo.get(),
      pressingOne: pressingOne.get(),
      pressingTwo: pressingTwo.get(),
    })
  );

  return (
    <Pressable
      style={{
        ...styles.container,
        backgroundColor: `rgba(0, 0, 0, ${rendered.get().backgroundOpacity})`,
      }}
      onPress={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }}
      ref={containerRef}
    >
      <Pressable
        style={{
          ...styles.content,
          opacity: rendered.get().foregroundOpacity,
          top: rendered.get().contentOffsetY,
          width: Math.min(309, windowSize.width - 24),
        }}
        onPress={(e) => {
          e.stopPropagation();
        }}
        ref={contentRef}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.buttons}>
          <RenderGuardedComponent
            props={buttonStates}
            component={({ one, two, pressingOne: pressing }) => {
              const textStyle = Object.assign(
                {},
                styles.buttonText,
                emphasize === 1 ? styles.emphasizedButtonText : undefined,
                two ? styles.disabledButtonText : undefined,
                emphasize === 1 && two
                  ? styles.disabledEmphasizedButtonText
                  : {}
              );
              return (
                <Pressable
                  style={Object.assign(
                    {},
                    styles.button,
                    emphasize === 1 ? styles.emphasizedButton : undefined,
                    pressing ? styles.pressedButton : undefined,
                    emphasize === 1 && pressing
                      ? styles.emphasizedPressedButton
                      : undefined,
                    two ? styles.disabledButton : undefined,
                    emphasize === 1 && two
                      ? styles.disabledEmphasizedButton
                      : undefined
                  )}
                  onPress={handleClickOne}
                  onPressIn={() => {
                    setVWC(pressingOne, true);
                  }}
                  onPressOut={() => {
                    setVWC(pressingOne, false);
                  }}
                >
                  {one && (
                    <View style={styles.spinnerContainer}>
                      <InlineOsehSpinner
                        size={{ type: "react-rerender", props: { height: 16 } }}
                        variant={emphasize === 1 ? "white" : "black"}
                      />
                    </View>
                  )}
                  {one && <Text style={textStyle}>Working...</Text>}
                  {!one && <Text style={textStyle}>{cta1}</Text>}
                </Pressable>
              );
            }}
          />
          {cta2 && (
            <RenderGuardedComponent
              props={buttonStates}
              component={({ one, two, pressingTwo: pressing }) => {
                const textStyle = Object.assign(
                  {},
                  styles.buttonText,
                  emphasize === 2 ? styles.emphasizedButtonText : undefined,
                  one ? styles.disabledButtonText : undefined,
                  one && emphasize === 2
                    ? styles.disabledEmphasizedButtonText
                    : {}
                );
                return (
                  <Pressable
                    style={Object.assign(
                      {},
                      styles.button,
                      emphasize === 2 ? styles.emphasizedButton : undefined,
                      pressing ? styles.pressedButton : undefined,
                      emphasize === 2 && pressing
                        ? styles.emphasizedPressedButton
                        : undefined,
                      one ? styles.disabledButton : undefined,
                      one && emphasize === 2
                        ? styles.disabledEmphasizedButton
                        : undefined
                    )}
                    onPress={handleClickTwo}
                    onPressIn={() => {
                      setVWC(pressingTwo, true);
                    }}
                    onPressOut={() => {
                      setVWC(pressingTwo, false);
                    }}
                  >
                    {two && (
                      <View style={styles.spinnerContainer}>
                        <InlineOsehSpinner
                          size={{
                            type: "react-rerender",
                            props: { height: 16 },
                          }}
                          variant={emphasize === 2 ? "white" : "black"}
                        />
                      </View>
                    )}
                    {two && <Text style={textStyle}>Working...</Text>}
                    {!two && <Text style={textStyle}>{cta2}</Text>}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Pressable>
    </Pressable>
  );
};
