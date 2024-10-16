import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './VerifyPhoneStyles';
import {
  playEntranceTransition,
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
import { VerifyPhoneResources } from './VerifyPhoneResources';
import { VerifyPhoneMappedParams } from './VerifyPhoneParams';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { BackContinue } from '../../../../shared/components/BackContinue';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { useBeforeTime } from '../../../../shared/hooks/useBeforeTime';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { AutoBold } from '../../../../shared/components/AutoBold';
import { Text } from 'react-native';
import { OsehTextInput } from '../../../../shared/forms/OsehTextInput';
import { useKeyboardVisibleValueWithCallbacks } from '../../../../shared/lib/useKeyboardVisibleValueWithCallbacks';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { adaptExitTransition } from '../../lib/adaptExitTransition';
import {
  chooseErrorFromStatus,
  DisplayableError,
} from '../../../../shared/lib/errors';

/**
 * Allows the user to verify a phone; triggers the back flow if the
 * code expires
 */
export const VerifyPhone = ({
  ctx,
  screen,
  trace,
  startPop,
}: ScreenComponentProps<
  'verify_phone',
  VerifyPhoneResources,
  VerifyPhoneMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const codeVWC = useWritableValueWithCallbacks(() => '');
  const errorVWC = useWritableValueWithCallbacks<DisplayableError | null>(
    () => null
  );

  const handleContinue = () =>
    screenWithWorking(workingVWC, async () => {
      if (codeVWC.get().length === 0) {
        return;
      }

      const loginContext = ctx.login.value.get();
      if (loginContext.state !== 'logged-in') {
        setVWC(
          errorVWC,
          new DisplayableError(
            'server-refresh-required',
            'verify phone',
            'not logged in'
          )
        );
        return;
      }

      setVWC(errorVWC, null);

      setVWC(
        transition.animation,
        await adaptExitTransition(screen.parameters.cta.exit)
      );
      const exitTransition = playExitTransition(transition);

      const code = codeVWC.get();
      trace({ type: 'verify', codeLength: code.length, step: 'start' });
      try {
        let response;
        try {
          response = await apiFetch(
            '/api/1/phones/verify/finish',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              body: JSON.stringify({
                uid: screen.parameters.verification.uid,
                code,
              }),
            },
            loginContext
          );
        } catch {
          throw new DisplayableError('connectivity', 'verify phone');
        }
        if (!response.ok) {
          throw chooseErrorFromStatus(response.status, 'verify phone');
        }
      } catch (e) {
        trace({ type: 'verify', step: 'error', error: `${e}` });
        setVWC(
          errorVWC,
          e instanceof DisplayableError
            ? e
            : new DisplayableError('client', 'verify phone', `${e}`)
        );
        await exitTransition.promise;
        await playEntranceTransition(transition).promise;
        return;
      }

      trace({ type: 'verify', step: 'success' });
      ctx.resources.reminderChannelsHandler.evictOrReplace(
        loginContext,
        (old) => {
          if (old === undefined) {
            return { type: 'make-request', data: undefined };
          }

          if (old.potentialChannels.has('sms')) {
            return { type: 'data', data: old };
          }

          // we can't know if it's unconfigured
          return { type: 'make-request', data: undefined };
        }
      );
      const trigger = screen.parameters.cta.trigger;
      const finishPop = startPop(
        trigger.type === 'pop'
          ? null
          : {
              slug: trigger.flow,
              parameters: trigger.parameters,
            },
        trigger.endpoint ?? undefined
      );
      await exitTransition.promise;
      finishPop();
    });

  const isVerificationUnexpiredVWC = useBeforeTime({
    type: 'react-rerender',
    props: screen.parameters.verification.expiresAt.getTime(),
  });

  useValueWithCallbacksEffect(isVerificationUnexpiredVWC, (isUnexpired) => {
    if (isUnexpired) {
      return undefined;
    }

    trace({ type: 'expired' });
    configurableScreenOut(
      workingVWC,
      startPop,
      transition,
      screen.parameters.back.exit,
      screen.parameters.back.trigger
    );
    return undefined;
  });

  useErrorModal(modals, errorVWC, { topBarHeightVWC: ctx.topBarHeight });

  const keyboardVisibleVWC = useKeyboardVisibleValueWithCallbacks();

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
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
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <RenderGuardedComponent
          props={keyboardVisibleVWC}
          component={(v) => (
            <VerticalSpacer height={v ? 32 : 0} flexGrow={v ? 0 : 1} />
          )}
        />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={16} />
        <AutoBold style={styles.message} message={screen.parameters.message} />
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks([codeVWC, workingVWC], () => ({
            code: codeVWC.get(),
            disabled: workingVWC.get(),
          }))}
          component={({ code, disabled }) => (
            <>
              <OsehTextInput
                type="number"
                defaultValue={code}
                onChange={(v) => setVWC(codeVWC, v)}
                disabled={disabled}
                label="Code"
                inputStyle="white"
                bonusTextInputProps={{
                  value: code,
                  autoFocus: true,
                  enterKeyHint: 'done',
                  keyboardType: 'number-pad',
                  autoComplete: 'one-time-code',
                  onSubmitEditing: () => handleContinue(),
                }}
              />
            </>
          )}
          applyInstantly
        />
        <RenderGuardedComponent
          props={keyboardVisibleVWC}
          component={(v) => (
            <VerticalSpacer height={v ? 32 : 0} flexGrow={v ? 0 : 1} />
          )}
        />
        <BackContinue
          onBack={() => {
            configurableScreenOut(
              workingVWC,
              startPop,
              transition,
              screen.parameters.back.exit,
              screen.parameters.back.trigger
            );
          }}
          onContinue={handleContinue}
          backText={screen.parameters.back.text}
          continueText={screen.parameters.cta.text}
        />
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
