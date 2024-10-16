import { ReactElement, useEffect } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { FeedbackMappedParams } from './FeedbackParams';
import { FeedbackResources } from './FeedbackResources';
import * as Colors from '../../../../styling/colors';
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
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { styles } from './FeedbackStyles';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { setVWC } from '../../../../shared/lib/setVWC';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { adaptValueWithCallbacksAsSetState } from '../../../../shared/lib/adaptValueWithCallbacksAsSetState';
import { showYesNoModal } from '../../../../shared/lib/showYesNoModal';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { Checkbox } from '../../../../shared/components/Checkbox';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { useKeyboardHeightValueWithCallbacks } from '../../../../shared/lib/useKeyboardHeightValueWithCallbacks';
import { LinkButton } from '../../../../shared/components/LinkButton';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { Close } from '../../../../shared/components/icons/Close';
import { OsehColors } from '../../../../shared/OsehColors';
import { adaptExitTransition } from '../../lib/adaptExitTransition';
import {
  chooseErrorFromStatus,
  DisplayableError,
} from '../../../../shared/lib/errors';

/**
 * Presents the user the opportunity to give some free-form feedback
 */
export const Feedback = ({
  ctx,
  screen,
  startPop,
  trace,
}: ScreenComponentProps<
  'feedback',
  FeedbackResources,
  FeedbackMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const inputVWC = useWritableValueWithCallbacks<TextInput | null>(() => null);
  const inputHeightVWC = useWritableValueWithCallbacks<number>(() => 22);
  const rawInputValueVWC = useWritableValueWithCallbacks<string>(() => '');

  const anonymousVWC = useWritableValueWithCallbacks(() => true);
  useEffect(() => {
    setVWC(anonymousVWC, initialValue());

    function initialValue() {
      if (screen.parameters.anonymous === 'opt-in') {
        return false;
      } else if (screen.parameters.anonymous === 'opt-out') {
        return true;
      } else if (screen.parameters.anonymous === 'require') {
        return true;
      } else if (screen.parameters.anonymous === 'forbid') {
        return false;
      } else {
        trace({
          type: 'error',
          message: 'unknown anonymous parameter, initializing to true',
        });
        return true;
      }
    }
  }, [screen.parameters.anonymous]);

  const disabledVWC = useMappedValueWithCallbacks(
    rawInputValueVWC,
    (v) => v.trim() === ''
  );
  const submitErrorVWC = useWritableValueWithCallbacks<DisplayableError | null>(
    () => null
  );
  useErrorModal(modals, submitErrorVWC, { topBarHeightVWC: ctx.topBarHeight });

  const onSubmit = async () => {
    if (disabledVWC.get()) {
      return;
    }

    screenWithWorking(workingVWC, async () => {
      const value = rawInputValueVWC.get();
      const anonymous = anonymousVWC.get();
      trace({
        type: 'submit',
        anonymous,
      });

      const loginContextUnch = ctx.login.value.get();
      if (loginContextUnch.state !== 'logged-in') {
        trace({ type: 'submit-error', details: 'not logged in' });
        setVWC(
          submitErrorVWC,
          new DisplayableError(
            'server-refresh-required',
            'submit feedback',
            'not logged in'
          )
        );
        return;
      }
      const loginContext = loginContextUnch;

      setVWC(submitErrorVWC, null);

      setVWC(
        transition.animation,
        await adaptExitTransition(screen.parameters.exit)
      );
      const exitTransitionCancelable = playExitTransition(transition);

      try {
        let response;
        try {
          response = await apiFetch(
            '/api/1/general_feedback/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              body: JSON.stringify({
                anonymous: anonymousVWC.get(),
                feedback: value,
                slug: screen.parameters.slug,
              }),
            },
            loginContext
          );
        } catch {
          throw new DisplayableError('connectivity', 'submit feedback');
        }

        if (!response.ok) {
          throw chooseErrorFromStatus(response.status, 'submit feedback');
        }

        trace({ type: 'submit-success' });
        const trigger = screen.parameters.trigger;
        const finishPop = startPop(
          trigger.type === 'pop'
            ? null
            : {
                slug: trigger.flow,
                parameters: trigger.parameters,
              },
          trigger.endpoint ?? undefined
        );
        await exitTransitionCancelable.promise;
        finishPop();
      } catch (e) {
        trace({ type: 'submit-error', details: `${e}` });
        const desc =
          e instanceof DisplayableError
            ? e
            : new DisplayableError('client', 'submit feedback', `${e}`);
        setVWC(submitErrorVWC, desc);
        await exitTransitionCancelable.promise;
        playEntranceTransition(transition);
        return;
      }
    });
  };

  const inputPropsVWC = useMappedValuesWithCallbacks(
    [rawInputValueVWC, inputHeightVWC],
    () => ({
      text: rawInputValueVWC.get(),
      height: inputHeightVWC.get(),
    })
  );

  const keyboardHeightVWC = useKeyboardHeightValueWithCallbacks();

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
      statusBar="light"
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={useMappedValueWithCallbacks(
          ctx.windowSizeImmediate,
          (v) => v.width
        )}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <View style={styles.close}>
          <Pressable
            onPress={() => {
              screenWithWorking(workingVWC, async () => {
                const value = rawInputValueVWC.get();
                if (value.trim() === '') {
                  trace({ type: 'close', details: 'nothing-written' });
                  configurableScreenOut(
                    null,
                    startPop,
                    transition,
                    screen.parameters.exit,
                    screen.parameters.close
                  );
                  return;
                }

                trace({ type: 'close', details: 'confirming' });
                const confirmation = await showYesNoModal(modals, {
                  title: 'Discard feedback?',
                  body: 'What you have written will not be saved.',
                  cta1: 'Discard',
                  emphasize: 1,
                }).promise;
                if (!confirmation) {
                  trace({ type: 'close', details: 'cancel' });
                  return;
                }
                trace({ type: 'close', details: 'confirmed-discard' });
                configurableScreenOut(
                  null,
                  startPop,
                  transition,
                  screen.parameters.exit,
                  screen.parameters.close
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
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <Text style={styles.top}>{screen.parameters.top}</Text>
        </ContentContainer>
        <VerticalSpacer height={0} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <Text style={styles.header}>{screen.parameters.header}</Text>
        </ContentContainer>
        <VerticalSpacer height={0} maxHeight={16} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <Text style={styles.message}>{screen.parameters.message}</Text>
        </ContentContainer>
        <VerticalSpacer height={0} maxHeight={24} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <View style={styles.inputContainer}>
            <RenderGuardedComponent
              props={inputPropsVWC}
              component={({ text, height }) => (
                <TextInput
                  style={Object.assign({}, styles.input, {
                    height: height,
                  })}
                  multiline
                  placeholder={screen.parameters.placeholder}
                  placeholderTextColor={Colors.GRAYSCALE_DISABLED}
                  value={text}
                  ref={(r) => setVWC(inputVWC, r)}
                  onChangeText={(t) => setVWC(rawInputValueVWC, t)}
                  onContentSizeChange={(e) => {
                    const height = e?.nativeEvent?.contentSize?.height;
                    if (height !== undefined && !isNaN(height) && height > 0) {
                      const old = inputHeightVWC.get();
                      if (
                        old === height ||
                        (old > height && Math.abs(old - height) < 1e-3)
                      ) {
                        return;
                      }
                      inputHeightVWC.set(height);
                      inputHeightVWC.callbacks.call(undefined);
                    }
                  }}
                />
              )}
              applyInstantly
            />
          </View>
        </ContentContainer>
        {screen.parameters.details !== null && (
          <>
            <VerticalSpacer height={0} maxHeight={32} flexGrow={1} />
            <ContentContainer contentWidthVWC={ctx.contentWidth}>
              <Text style={styles.details}>{screen.parameters.details}</Text>
            </ContentContainer>
          </>
        )}
        {screen.parameters.anonymous === 'opt-in' ||
        screen.parameters.anonymous === 'opt-out' ? (
          <>
            <VerticalSpacer height={0} maxHeight={16} flexGrow={1} />
            <ContentContainer contentWidthVWC={ctx.contentWidth}>
              <RenderGuardedComponent
                props={anonymousVWC}
                component={(checked) => (
                  <Checkbox
                    value={checked}
                    setValue={adaptValueWithCallbacksAsSetState(anonymousVWC)}
                    label={screen.parameters.anonymousLabel}
                  />
                )}
              />
            </ContentContainer>
          </>
        ) : undefined}
        <VerticalSpacer height={0} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <RenderGuardedComponent
            props={disabledVWC}
            component={(disabled) => (
              <TextStyleForwarder
                component={(styleVWC) => (
                  <FilledInvertedButton
                    onPress={() => {
                      onSubmit();
                    }}
                    setTextStyle={(s) => setVWC(styleVWC, s)}
                    disabled={disabled}
                  >
                    <RenderGuardedComponent
                      props={styleVWC}
                      component={(s) => (
                        <Text style={s}>{screen.parameters.cta}</Text>
                      )}
                    />
                  </FilledInvertedButton>
                )}
              />
            )}
          />
        </ContentContainer>
        {screen.parameters.cta2 !== null && (
          <>
            <VerticalSpacer height={0} maxHeight={8} flexGrow={1} />
            <ContentContainer contentWidthVWC={ctx.contentWidth}>
              <TextStyleForwarder
                component={(styleVWC) => (
                  <LinkButton
                    onPress={() => {
                      screenWithWorking(workingVWC, async () => {
                        if (screen.parameters.cta2 === null) {
                          return;
                        }

                        const value = rawInputValueVWC.get();

                        if (value.trim() === '') {
                          trace({ type: 'cta2', details: 'nothing-written' });
                          configurableScreenOut(
                            null,
                            startPop,
                            transition,
                            screen.parameters.exit,
                            screen.parameters.cta2.trigger
                          );
                          return;
                        }

                        trace({ type: 'cta2', details: 'confirming' });
                        const confirmation = await showYesNoModal(modals, {
                          title: 'Discard feedback?',
                          body: 'What you have written will not be saved.',
                          cta1: 'Discard',
                          emphasize: 1,
                        }).promise;
                        if (!confirmation) {
                          trace({ type: 'cta2', details: 'cancel' });
                          return;
                        }
                        trace({ type: 'cta2', details: 'confirmed-discard' });
                        configurableScreenOut(
                          null,
                          startPop,
                          transition,
                          screen.parameters.exit,
                          screen.parameters.cta2.trigger
                        );
                      });
                    }}
                    setTextStyle={(s) => setVWC(styleVWC, s)}
                  >
                    <RenderGuardedComponent
                      props={styleVWC}
                      component={(s) => (
                        <Text style={s}>{screen.parameters.cta2?.text}</Text>
                      )}
                    />
                  </LinkButton>
                )}
              />
            </ContentContainer>
          </>
        )}
        <VerticalSpacer height={0} maxHeight={24} flexGrow={1} />
        <RenderGuardedComponent
          props={keyboardHeightVWC}
          component={(keyboardHeight) =>
            keyboardHeight === 0 ? (
              <RenderGuardedComponent
                props={ctx.botBarHeight}
                component={(h) => <VerticalSpacer height={h} />}
              />
            ) : (
              <VerticalSpacer height={keyboardHeight} />
            )
          }
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
