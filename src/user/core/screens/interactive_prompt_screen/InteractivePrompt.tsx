import { ReactElement, useRef } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { InteractivePromptResources } from './InteractivePromptResources';
import { InteractivePromptMappedParams } from './InteractivePromptParams';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { useReactManagedValueAsValueWithCallbacks } from '../../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { InteractivePromptRouter } from '../../../interactive_prompt/components/InteractivePromptRouter';
import { PromptTime } from '../../../interactive_prompt/hooks/usePromptTime';
import { styles } from './InteractivePromptStyles';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { setVWC } from '../../../../shared/lib/setVWC';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { Pressable, View } from 'react-native';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { Close } from '../../../../shared/components/icons/Close';
import { OsehColors } from '../../../../shared/OsehColors';

/**
 * An interactive prompt (one where everyones responses are shown as they
 * are input, after adjusting everyone to have "started" the prompt at the
 * same time) with an optional image background.
 */
export const InteractivePrompt = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'interactive_prompt',
  InteractivePromptResources,
  InteractivePromptMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);
  const workingVWC = useWritableValueWithCallbacks(() => false);
  const leavingCallbackRef = useRef<(() => void) | null>(null);

  const tracedResponseVWC = useWritableValueWithCallbacks<any | null>(
    () => null
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar
      modals
    >
      <GridImageBackground
        image={resources.background}
        thumbhash={useReactManagedValueAsValueWithCallbacks(
          screen.parameters.background?.thumbhash ?? null
        )}
        size={ctx.windowSizeImmediate}
      />
      <GridContentContainer
        contentWidthVWC={useMappedValueWithCallbacks(
          ctx.windowSizeImmediate,
          (v) => v.width
        )}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <InteractivePromptRouter
          onResponse={(r: any) => {
            if (!Object.is(tracedResponseVWC.get(), r)) {
              trace({ type: 'response', value: r });
              setVWC(tracedResponseVWC, r);
            }
          }}
          onFinished={async (
            _privileged: boolean,
            reason: 'time' | 'skip',
            time: PromptTime
          ) => {
            trace({ type: 'finished', reason, time });

            screenWithWorking(workingVWC, async () => {
              leavingCallbackRef.current?.();
              await configurableScreenOut(
                null,
                startPop,
                transition,
                screen.parameters.exit,
                screen.parameters.trigger
              );
            });
          }}
          countdown={
            screen.parameters.countdown === null
              ? undefined
              : {
                  titleText: screen.parameters.countdown,
                }
          }
          subtitle={screen.parameters.subtitle ?? undefined}
          prompt={screen.parameters.prompt}
          leavingCallback={leavingCallbackRef}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <GridContentContainer
        contentWidthVWC={useMappedValueWithCallbacks(
          ctx.windowSizeImmediate,
          (v) => v.width
        )}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        noPointerEvents
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <View style={styles.closeWrapper} pointerEvents="box-none">
          <Pressable
            onPress={() => {
              trace({ type: 'close' });
              screenWithWorking(workingVWC, async () => {
                leavingCallbackRef.current?.();
                await configurableScreenOut(
                  null,
                  startPop,
                  transition,
                  screen.parameters.exit,
                  screen.parameters.trigger
                );
              });
            }}
          >
            <Close
              icon={{
                width: 24,
              }}
              container={{
                width: 16 + 24 + 32,
                height: 16 + 24 + 32,
              }}
              startPadding={{
                x: {
                  fixed: 16,
                },
                y: {
                  fixed: 16,
                },
              }}
              color={OsehColors.v4.primary.light}
            />
          </Pressable>
        </View>
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
