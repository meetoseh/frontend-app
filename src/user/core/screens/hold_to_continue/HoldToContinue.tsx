import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
  WritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import {
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import { ScreenComponentProps } from '../../models/Screen';
import { HoldToContinueParamsParsed } from './HoldToContinueParams';
import { HoldToContinueResources } from './HoldToContinueResources';
import { styles } from './HoldToContinueStyles';
import { ReactElement, useEffect } from 'react';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { OsehImageFromState } from '../../../../shared/images/OsehImageFromState';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import { setVWC } from '../../../../shared/lib/setVWC';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { waitForValueWithCallbacksConditionCancelable } from '../../../../shared/lib/waitForValueWithCallbacksCondition';
import { createCancelableTimeout } from '../../../../shared/lib/createCancelableTimeout';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { constructCancelablePromise } from '../../../../shared/lib/CancelablePromiseConstructor';
import { waitForAnimationFrameCancelable } from '../../../../shared/lib/waitForAnimationFrameCancelable';
import { CancelablePromise } from '../../../../shared/lib/CancelablePromise';
import { ease } from '../../../../shared/lib/Bezier';
import { Pressable, View, ViewStyle, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * A more interesting version of a confirmation screen that has the user
 * hold a button for a certain amount of time before they can proceed. Includes
 * haptics and an animation while they are holding.
 */
export const HoldToContinue = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'hold_to_continue',
  HoldToContinueResources,
  HoldToContinueParamsParsed
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);
  const imageContainerVWC = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const imageTranslationVWC = useWritableValueWithCallbacks(() => ({
    x: 0,
    y: 0,
  }));
  const imageScaleVWC = useWritableValueWithCallbacks(() => 0.4);
  const imageContainerStyleVWC = useMappedValuesWithCallbacks(
    [imageTranslationVWC, imageScaleVWC],
    (): ViewStyle => ({
      ...styles.image,
      transform: [
        { scale: imageScaleVWC.get() },
        { translateX: imageTranslationVWC.get().x },
        { translateY: imageTranslationVWC.get().y },
      ],
    })
  );
  useStyleVWC(imageContainerVWC, imageContainerStyleVWC);

  const onContinue = () => {
    screenWithWorking(workingVWC, async () => {
      setVWC(imageTranslationVWC, { x: 0, y: 0 });
      setVWC(imageScaleVWC, 0.4);

      const finishPop = startPop(
        {
          slug:
            screen.parameters.trigger.type === 'flow'
              ? screen.parameters.trigger.flow
              : 'skip',
          parameters:
            screen.parameters.trigger.type === 'flow'
              ? screen.parameters.trigger.parameters
              : null,
        },
        screen.parameters.trigger.endpoint ?? undefined
      );

      const continueTimeMS = screen.parameters.continueVibration.reduce(
        (a, b) => a + b,
        0
      );
      setVWC(transition.animation, { type: 'fade', ms: continueTimeMS });
      const exitTransition = playExitTransition(transition);

      const startedAt = performance.now();
      const doneAt = startedAt + continueTimeMS;
      let now = startedAt;

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // failed haptics aren't a big deal
      }

      while (true) {
        if (now >= doneAt) {
          break;
        }

        const linearProgress = (now - startedAt) / continueTimeMS;
        const easedProgress = ease.y_x(linearProgress);
        setVWC(imageScaleVWC, 0.4 + 0.6 * easedProgress);
        now = await waitForAnimationFrameCancelable().promise;
      }

      await exitTransition.promise;
      finishPop();
    });
  };

  const buttonDownVWC = useWritableValueWithCallbacks(() => false);
  useEffect(() => {
    const activeVWC = createWritableValueWithCallbacks(true);
    handle();
    return () => {
      setVWC(activeVWC, false);
    };

    async function handle() {
      const notActive = waitForValueWithCallbacksConditionCancelable(
        activeVWC,
        (v) => !v
      );
      notActive.promise.catch(() => {});
      let working = waitForValueWithCallbacksConditionCancelable(
        workingVWC,
        (v) => v
      );
      working.promise.catch(() => {});
      try {
        while (true) {
          if (!activeVWC.get()) {
            return;
          }

          if (workingVWC.get() || working.done()) {
            const notWorking = waitForValueWithCallbacksConditionCancelable(
              workingVWC,
              (v) => !v
            );
            notWorking.promise.catch(() => {});
            await Promise.race([notWorking.promise, notActive.promise]);
            notWorking.cancel();
            working = waitForValueWithCallbacksConditionCancelable(
              workingVWC,
              (v) => v
            );
            working.promise.catch(() => {});
            continue;
          }

          setVWC(imageTranslationVWC, { x: 0, y: 0 });
          setVWC(imageScaleVWC, 0.4);

          const buttonDown = waitForValueWithCallbacksConditionCancelable(
            buttonDownVWC,
            (v) => v
          );
          buttonDown.promise.catch(() => {});
          await Promise.race([
            buttonDown.promise,
            notActive.promise,
            working.promise,
          ]);
          buttonDown.cancel();

          if (!buttonDownVWC.get()) {
            continue;
          }
          trace({ type: 'hold', step: 'start' });

          if (screen.parameters.holdTimeMS > 0) {
            const holdFinished = createCancelableTimeout(
              screen.parameters.holdTimeMS
            );
            holdFinished.promise.catch(() => {});
            const buttonUp = waitForValueWithCallbacksConditionCancelable(
              buttonDownVWC,
              (v) => !v
            );
            buttonUp.promise.catch(() => {});
            const shaker = createCancelableShaker(imageTranslationVWC);
            shaker.promise.catch(() => {});
            try {
              Haptics.selectionAsync();
            } catch (e) {
              // failed haptics aren't a big deal
            }
            await Promise.race([
              holdFinished.promise,
              buttonUp.promise,
              notActive.promise,
              working.promise,
            ]);
            buttonUp.cancel();
            holdFinished.cancel();
            shaker.cancel();

            if (!activeVWC.get() || !buttonDownVWC.get() || working.done()) {
              trace({ type: 'hold', step: 'cancel' });
              continue;
            }
          }

          trace({ type: 'hold', step: 'complete' });
          onContinue();
          return;
        }
      } finally {
        notActive.cancel();
        working.cancel();
      }
    }
  });

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar="light"
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
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} flexGrow={2} />}
        />
        <Pressable
          style={imageContainerStyleVWC.get()}
          ref={(r) => setVWC(imageContainerVWC, r)}
          onPressIn={() => {
            setVWC(buttonDownVWC, true);
          }}
          onPressOut={() => {
            setVWC(buttonDownVWC, false);
          }}
        >
          <RenderGuardedComponent
            props={resources.image}
            component={(image) => (
              <OsehImageFromState
                state={{
                  loading: image === null,
                  localUrl: image?.croppedUrl ?? null,
                  displayWidth: 200,
                  displayHeight: 200,
                  alt: '',
                  thumbhash: screen.parameters.image.thumbhash,
                }}
                pointerEvents="none"
              />
            )}
          />
        </Pressable>
        <Text style={styles.instructions}>
          {screen.parameters.instructions}
        </Text>
        <VerticalSpacer height={16} flexGrow={1} />
        <Text style={styles.title}>{screen.parameters.title}</Text>
        <VerticalSpacer height={16} />
        <Text style={styles.body}>{screen.parameters.body}</Text>
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h + 32} />}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};

const createCancelableShaker = (
  translation: WritableValueWithCallbacks<{ x: number; y: number }>
): CancelablePromise<void> =>
  constructCancelablePromise({
    body: async (state, resolve, reject) => {
      const active = createWritableValueWithCallbacks(true);
      const onCancel = () => setVWC(active, false);
      state.cancelers.add(onCancel);
      if (state.finishing) {
        onCancel();
      }

      const canceled = waitForValueWithCallbacksConditionCancelable(
        active,
        (v) => !v
      );
      canceled.promise.catch(() => {});

      const cumulativeDrift: { x: number; y: number } = { x: 0, y: 0 };
      const driftSpeed = 0.1;
      try {
        let lastFrame = performance.now();
        let now = lastFrame;
        while (true) {
          if (!active.get()) {
            state.finishing = true;
            state.done = true;
            reject(new Error('canceled'));
            return;
          }

          const delta = now - lastFrame;
          let driftX =
            -cumulativeDrift.x * 0.1 * driftSpeed +
            (Math.random() * 2 - 1) * delta * driftSpeed;
          let driftY =
            -cumulativeDrift.y * 0.1 * driftSpeed +
            (Math.random() * 2 - 1) * delta * driftSpeed;

          if (driftX > 0 && cumulativeDrift.x + driftX > 20) {
            driftX = -driftX;
          } else if (driftX < 0 && cumulativeDrift.x + driftX < -20) {
            driftX = -driftX;
          }

          if (driftY > 0 && cumulativeDrift.y + driftY > 20) {
            driftY = -driftY;
          } else if (driftY < 0 && cumulativeDrift.y + driftY < -20) {
            driftY = -driftY;
          }

          const oldTranslation = translation.get();
          setVWC(
            translation,
            {
              x: oldTranslation.x + driftX,
              y: oldTranslation.y + driftY,
            },
            () => false
          );
          cumulativeDrift.x += driftX;
          cumulativeDrift.y += driftY;

          const nextFrame = waitForAnimationFrameCancelable();
          await Promise.race([canceled.promise, nextFrame.promise]);
          if (!active.get()) {
            nextFrame.cancel();
            continue;
          }

          lastFrame = now;
          now = await nextFrame.promise;
        }
      } finally {
        state.cancelers.remove(onCancel);
        canceled.cancel();
      }
    },
  });
