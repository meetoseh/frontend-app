import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './ForkStyles';
import {
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { ForkResources } from './ForkResources';
import { ForkMappedParams } from './ForkParams';
import { RightCaret } from './icons/RightCaret';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { View, Text, Pressable } from 'react-native';
import { useAnimationTargetAndRendered } from '../../../../shared/anim/useAnimationTargetAndRendered';
import { BezierAnimator } from '../../../../shared/anim/AnimationLoop';
import { ease } from '../../../../shared/lib/Bezier';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';

/**
 * A basic fork screen with a header, message, and a series of choices
 */
export const Fork = ({
  ctx,
  screen,
  startPop,
  trace,
}: ScreenComponentProps<
  'fork',
  ForkResources,
  ForkMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <VerticalSpacer height={0} flexGrow={1} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={16} />
        <Text style={styles.message}>{screen.parameters.message}</Text>
        <VerticalSpacer height={32} />
        <View style={styles.options}>
          {screen.parameters.options.map((option, i) => (
            <Btn
              key={i}
              i={i}
              onPress={async () => {
                if (workingVWC.get()) {
                  return;
                }

                setVWC(workingVWC, true);
                const finishPop = startPop(
                  option.trigger === null
                    ? null
                    : {
                        slug: option.trigger,
                        parameters: {},
                      }
                );
                setVWC(transition.animation, option.exit);
                const exitTransitionCancelable = playExitTransition(transition);
                try {
                  trace({
                    type: 'fork_option_selected',
                    option,
                  });
                } finally {
                  await exitTransitionCancelable.promise;
                  finishPop();
                }
              }}
              text={option.text}
            />
          ))}
        </View>
        <VerticalSpacer height={0} flexGrow={1} />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};

type BtnState = {
  lightening: number;
};

const Btn = ({
  onPress,
  text,
  i,
}: {
  onPress: () => void;
  text: string;
  i: number;
}): ReactElement => {
  const pressingVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const state = useAnimationTargetAndRendered(
    () => ({ lightening: 0 }),
    [
      new BezierAnimator(
        ease,
        350,
        (p) => p.lightening,
        (p, v) => (p.lightening = v)
      ),
    ]
  );

  useValueWithCallbacksEffect(pressingVWC, (pressing) => {
    if (pressing) {
      setVWC(state.target, { lightening: 0.2 });
    } else {
      setVWC(state.target, { lightening: 0 });
    }
    return undefined;
  });

  const optionRef = useWritableValueWithCallbacks<View | null>(() => null);
  const optionStyleVWC = useMappedValueWithCallbacks(state.rendered, (s) =>
    Object.assign(
      {},
      styles.option,
      i === 0 ? undefined : styles.optionNotFirst,
      {
        backgroundColor: `rgba(255, 255, 255, ${s.lightening})`,
      }
    )
  );
  useStyleVWC(optionRef, optionStyleVWC);

  return (
    <Pressable
      style={optionStyleVWC.get()}
      ref={(r) => setVWC(optionRef, r)}
      onPress={onPress}
      onPressIn={() => setVWC(pressingVWC, true)}
      onPressOut={() => setVWC(pressingVWC, false)}
    >
      <Text style={styles.optionText}>{text}</Text>
      <RightCaret />
    </Pressable>
  );
};