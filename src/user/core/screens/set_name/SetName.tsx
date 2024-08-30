import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './SetNameStyles';
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
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { useWorkingModal } from '../../../../shared/hooks/useWorkingModal';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { describeError } from '../../../../shared/lib/describeError';
import { BackContinue } from '../../../../shared/components/BackContinue';
import { SetNameResources } from './SetNameResources';
import { SetNameMappedParams } from './SetNameParams';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useKeyboardVisibleValueWithCallbacks } from '../../../../shared/lib/useKeyboardVisibleValueWithCallbacks';
import { Text } from 'react-native';
import { OsehTextInput } from '../../../../shared/forms/OsehTextInput';
import { ScreenConfigurableTrigger } from '../../models/ScreenConfigurableTrigger';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { adaptExitTransition } from '../../lib/adaptExitTransition';

/**
 * A basic screen where the user can configure their name
 */
export const SetName = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'set_name',
  SetNameResources,
  SetNameMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const savingVWC = useWritableValueWithCallbacks<boolean>(() => false);

  useErrorModal(modals, errorVWC, 'saving name');
  useWorkingModal(modals, savingVWC, 200);

  const serverNameVWC = useMappedValueWithCallbacks(
    ctx.login.value,
    (s): [string, string] => {
      if (s.state !== 'logged-in') {
        return ['', ''];
      }

      let given = s.userAttributes.givenName;
      if (
        given === undefined ||
        given === null ||
        given.toLocaleLowerCase().includes('anon')
      ) {
        given = '';
      }

      let family = s.userAttributes.familyName;
      if (
        family === undefined ||
        family === null ||
        family.toLocaleLowerCase().includes('anon')
      ) {
        family = '';
      }

      return [given, family];
    }
  );

  const givenNameVWC = useWritableValueWithCallbacks(() => '');
  const familyNameVWC = useWritableValueWithCallbacks(() => '');
  useValueWithCallbacksEffect(serverNameVWC, ([given, family]) => {
    setVWC(givenNameVWC, given);
    setVWC(familyNameVWC, family);
    return undefined;
  });

  /** If the user needs to save, a function to save, otherwise null */
  const prepareSave = (): (() => Promise<boolean>) | null => {
    const selected = [givenNameVWC.get().trim(), familyNameVWC.get().trim()];
    const server = serverNameVWC.get();
    if (server[0] === selected[0] && server[1] === selected[1]) {
      return null;
    }

    return async () => {
      if (savingVWC.get()) {
        return false;
      }

      const loginContextUnch = ctx.login.value.get();
      if (loginContextUnch.state !== 'logged-in') {
        return false;
      }
      const loginContext = loginContextUnch;

      setVWC(savingVWC, true);
      setVWC(errorVWC, null);
      try {
        const response = await apiFetch(
          '/api/1/users/me/attributes/name',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              given_name: selected[0],
              family_name: selected[1],
            }),
          },
          loginContext
        );
        if (!response.ok) {
          throw response;
        }
        const data: { given_name: string; family_name: string } =
          await response.json();
        ctx.login.setUserAttributes({
          ...loginContext.userAttributes,
          givenName: data.given_name,
          familyName: data.family_name,
          name: `${data.given_name} ${data.family_name}`.trim(),
        });
        return true;
      } catch (e) {
        setVWC(errorVWC, await describeError(e));
        return false;
      } finally {
        setVWC(savingVWC, false);
      }
    };
  };

  const tryExit = ({
    type,
    trigger,
    exit,
  }: {
    type: string;
    trigger: ScreenConfigurableTrigger;
    exit: StandardScreenTransition;
  }) => {
    screenWithWorking(workingVWC, async () => {
      const save = prepareSave();
      if (save === null) {
        trace({ type, draft: false });
        await configurableScreenOut(null, startPop, transition, exit, trigger);
        return;
      }

      trace({ type, draft: true, step: 'save' });
      setVWC(transition.animation, await adaptExitTransition(exit));
      const exitTransition = playExitTransition(transition);
      const result = await save();
      trace({ type, draft: false, step: 'save', result });
      if (result) {
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
      } else {
        await exitTransition.promise;
        await playEntranceTransition(transition).promise;
      }
    });
  };

  const keyboardVisibleVWC = useKeyboardVisibleValueWithCallbacks();

  const focusFamilyName = useWritableValueWithCallbacks<(() => void) | null>(
    () => null
  );

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
        <VerticalSpacer height={32} />
        <Text style={styles.top}>{screen.parameters.top}</Text>
        <RenderGuardedComponent
          props={keyboardVisibleVWC}
          component={(v) => (
            <VerticalSpacer height={v ? 32 : 0} flexGrow={v ? 0 : 1} />
          )}
        />
        <Text style={styles.title}>{screen.parameters.title}</Text>
        {screen.parameters.message === null ? null : (
          <>
            <VerticalSpacer height={16} />
            <Text style={styles.message}>{screen.parameters.message}</Text>
          </>
        )}
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={givenNameVWC}
          component={(givenName) => (
            <OsehTextInput
              type="text"
              defaultValue={givenName}
              onChange={(v) => setVWC(givenNameVWC, v)}
              label="First Name"
              disabled={false}
              inputStyle="white"
              bonusTextInputProps={{
                value: givenName,
                autoComplete: 'given-name',
                enterKeyHint: 'next',
                onSubmitEditing: () => {
                  trace({
                    type: 'given-name-on-submit',
                    result: 'focus-family-name',
                  });
                  focusFamilyName.get()?.();
                },
              }}
            />
          )}
          applyInstantly
        />
        <VerticalSpacer height={16} />
        <RenderGuardedComponent
          props={familyNameVWC}
          component={(familyName) => (
            <OsehTextInput
              type="text"
              defaultValue={familyName}
              onChange={(v) => setVWC(familyNameVWC, v)}
              label="Last Name"
              disabled={false}
              inputStyle="white"
              bonusTextInputProps={{
                value: familyName,
                autoComplete: 'family-name',
                enterKeyHint: 'done',
                onSubmitEditing: () => {
                  trace({ type: 'family-name-on-submit', result: 'save' });
                  tryExit({ ...screen.parameters.save, type: 'save' });
                },
              }}
              doFocus={(f) => setVWC(focusFamilyName, f)}
            />
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
          onBack={
            screen.parameters.back === null
              ? null
              : (
                  (back) => () =>
                    tryExit({ ...back, type: 'back' })
                )(screen.parameters.back)
          }
          onContinue={() =>
            tryExit({ ...screen.parameters.save, type: 'save' })
          }
          backText={screen.parameters.back?.text}
          continueText={screen.parameters.save.text}
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
