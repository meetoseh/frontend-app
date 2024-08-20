import { Fragment, ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  createWritableValueWithCallbacks,
  downgradeTypedVWC,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { ScreenHeader } from '../../../../shared/components/ScreenHeader';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { InlineOsehSpinner } from '../../../../shared/components/InlineOsehSpinner';
import { styles } from './JournalReflectionResponseStyles';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { JournalReflectionResponseResources } from './JournalReflectionResponseResources';
import { JourneyReflectionResponseMappedParams } from './JournalReflectionResponseParams';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { Forward } from '../../../../shared/components/icons/Forward';
import { OsehColors } from '../../../../shared/OsehColors';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { describeError } from '../../../../shared/lib/describeError';
import { useWorkingModal } from '../../../../shared/hooks/useWorkingModal';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { createCancelableTimeout } from '../../../../shared/lib/createCancelableTimeout';
import { waitForValueWithCallbacksConditionCancelable } from '../../../../shared/lib/waitForValueWithCallbacksCondition';
import { View, Pressable, Text, TextInput } from 'react-native';
import { OutlineWhiteButton } from '../../../../shared/components/OutlineWhiteButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { useKeyboardHeightValueWithCallbacks } from '../../../../shared/lib/useKeyboardHeightValueWithCallbacks';
import {
  FlexGrowContentWidthTextArea,
  FlexGrowContentWidthTextAreaProps,
} from '../../../../shared/components/FlexGrowContentWidthTextArea';

/**
 * Shows the journal reflection question and gives a large amount of room for
 * the user to write their response.
 */
export const JournalReflectionResponse = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'journal_reflection_response',
  JournalReflectionResponseResources,
  JourneyReflectionResponseMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const isErrorVWC = useMappedValueWithCallbacks(
    resources.question,
    (q) => q === undefined
  );
  useValueWithCallbacksEffect(isErrorVWC, (isError) => {
    if (isError) {
      trace({ type: 'error', hint: 'question is undefined' });
    }
    return undefined;
  });

  const isReadyToContinueVWC = useMappedValueWithCallbacks(
    resources.question,
    (q) => q !== null && q !== undefined
  );
  useValueWithCallbacksEffect(isReadyToContinueVWC, (isReady) => {
    if (isReady) {
      trace({ type: 'ready' });
    }
    return undefined;
  });

  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (size) => size.width
  );

  const inputVWC = useWritableValueWithCallbacks<TextInput | null>(() => null);
  const responseVWC = useWritableValueWithCallbacks<string>(
    () => ''
  ) as FlexGrowContentWidthTextAreaProps['value'];
  const canonicalResponseVWC = useMappedValueWithCallbacks(
    downgradeTypedVWC(responseVWC),
    (r) =>
      r
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== '')
        .join('\n\n')
  );

  const editableVWC = useWritableValueWithCallbacks(() => true);
  useValueWithCallbacksEffect(inputVWC, (i) => {
    i?.focus();
    return undefined;
  });
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, errorVWC, 'saving response');

  const autoSavingVWC = useWritableValueWithCallbacks(() => false);
  useWorkingModal(modals, autoSavingVWC);

  useValueWithCallbacksEffect(resources.savedResponse, (r) => {
    if (
      r !== 'dne' &&
      r !== 'error' &&
      r !== 'loading' &&
      !autoSavingVWC.get()
    ) {
      responseVWC.set(r.value);
      responseVWC.callbacks.call({ updateInput: true });
    }
    return undefined;
  });

  useValuesWithCallbacksEffect(
    [canonicalResponseVWC, resources.savedResponse, editableVWC],
    () => {
      const canonicalResponse = canonicalResponseVWC.get();
      const savedResponse = resources.savedResponse.get();
      if (!editableVWC.get()) {
        return;
      }

      const isEmpty = canonicalResponse === '';
      const isDifferent =
        (savedResponse === 'dne' && !isEmpty) ||
        savedResponse === 'error' ||
        savedResponse === 'loading' ||
        (savedResponse !== 'dne' && savedResponse.value !== canonicalResponse);

      if (!isDifferent) {
        return undefined;
      }

      const active = createWritableValueWithCallbacks(true);
      saveAfterTimeout();
      return () => {
        setVWC(active, false);
      };

      async function saveAfterTimeout() {
        const canceled = waitForValueWithCallbacksConditionCancelable(
          active,
          (v) => !v
        );
        const timeout = createCancelableTimeout(3000);
        await Promise.race([canceled.promise, timeout.promise]);
        canceled.cancel();
        timeout.cancel();
        if (!active.get()) {
          return;
        }

        await screenWithWorking(workingVWC, async () => {
          const start = performance.now();
          setVWC(autoSavingVWC, true);
          setVWC(errorVWC, null);
          try {
            await resources.updateResponse(canonicalResponse);
          } catch (e) {
            const err = await describeError(e);
            setVWC(errorVWC, err);
          } finally {
            setVWC(autoSavingVWC, false);
            const timeTaken = performance.now() - start;
            console.info('Auto-saved response in', timeTaken, 'ms');
          }
        });
      }
    }
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
        gridSizeVWC={ctx.windowSizeImmediate}
        contentWidthVWC={windowWidthVWC}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        scrollable
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <ScreenHeader
          close={{
            variant: screen.parameters.close.variant,
            onClick: () => {
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.close.exit,
                screen.parameters.close.trigger,
                {
                  afterDone: () => {
                    trace({ type: 'close' });
                  },
                }
              );
            },
          }}
          text={screen.parameters.header}
          windowWidth={windowWidthVWC}
          contentWidth={ctx.contentWidth}
        />
        <VerticalSpacer height={24} />
        <RenderGuardedComponent
          props={resources.question}
          component={(question) =>
            question === null ? (
              <View style={styles.spinner}>
                <InlineOsehSpinner
                  size={{
                    type: 'react-rerender',
                    props: {
                      width: 64,
                    },
                  }}
                  variant="white-thin"
                />
              </View>
            ) : question === undefined ? (
              <ContentContainer contentWidthVWC={ctx.contentWidth}>
                <Text style={styles.questionError}>
                  Something went wrong loading your reflection question. Try
                  again or contact support at hi@oseh.com
                </Text>
              </ContentContainer>
            ) : (
              <>
                {question.paragraphs.map((q, i) => (
                  <Fragment key={i}>
                    {i > 0 && <VerticalSpacer height={16} />}
                    <ContentContainer contentWidthVWC={ctx.contentWidth}>
                      <Text style={styles.question}>{q}</Text>
                    </ContentContainer>
                  </Fragment>
                ))}
              </>
            )
          }
        />
        <VerticalSpacer height={16} />
        <FlexGrowContentWidthTextArea
          placeholder="Write anything"
          placeholderTextColor={OsehColors.v4.primary.grey}
          textStyle={styles.responseText}
          submit={null}
          value={responseVWC}
          editable={editableVWC}
          enterBehavior={'never-submit'}
          refVWC={inputVWC}
          contentWidth={ctx.contentWidth}
          screenWidth={windowWidthVWC}
        />
        <VerticalSpacer height={32} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <View style={styles.done}>
            <RenderGuardedComponent
              props={isReadyToContinueVWC}
              component={(isReady) => (
                <TextStyleForwarder
                  component={(styleVWC) => (
                    <OutlineWhiteButton
                      onPress={() => {
                        if (!isReady) {
                          return;
                        }
                        screenWithWorking(workingVWC, async () => {
                          const savedResponse = resources.savedResponse.get();
                          const canonicalResponse = canonicalResponseVWC.get();
                          const isEmpty = canonicalResponse === '';
                          const isDifferent =
                            (savedResponse === 'dne' && !isEmpty) ||
                            savedResponse === 'error' ||
                            savedResponse === 'loading' ||
                            (savedResponse !== 'dne' &&
                              savedResponse.value !== canonicalResponse);
                          trace({ type: 'cta', isEmpty, isDifferent });
                          if (!isDifferent) {
                            await configurableScreenOut(
                              null,
                              startPop,
                              transition,
                              screen.parameters.cta.exit,
                              screen.parameters.cta.trigger
                            );
                            return;
                          }

                          setVWC(errorVWC, null);
                          try {
                            await resources.updateResponse(canonicalResponse);
                          } catch (e) {
                            const err = await describeError(e);
                            setVWC(errorVWC, err);
                            return;
                          }
                          await configurableScreenOut(
                            null,
                            startPop,
                            transition,
                            screen.parameters.cta.exit,
                            screen.parameters.cta.trigger
                          );
                        });
                      }}
                      disabled={!isReady}
                      setTextStyle={(s) => setVWC(styleVWC, s)}
                      thin
                    >
                      <View style={styles.buttonInner}>
                        <RenderGuardedComponent
                          props={styleVWC}
                          component={(s) => (
                            <Text style={s}>{screen.parameters.cta.text}</Text>
                          )}
                        />
                        <HorizontalSpacer width={8} />
                        <RenderGuardedComponent
                          props={styleVWC}
                          component={(s) => (
                            <Forward
                              icon={{ width: 20 }}
                              container={{ width: 20, height: 20 }}
                              startPadding={{
                                x: { fraction: 0.5 },
                                y: { fraction: 0.5 },
                              }}
                              color={
                                (typeof s === 'object' &&
                                s !== null &&
                                !Array.isArray(s) &&
                                typeof s.color === 'string'
                                  ? s.color
                                  : undefined) ?? OsehColors.v4.primary.light
                              }
                            />
                          )}
                        />
                      </View>
                    </OutlineWhiteButton>
                  )}
                />
              )}
            />
          </View>
        </ContentContainer>
        <RenderGuardedComponent
          props={keyboardHeightVWC}
          component={(kh) => {
            if (kh <= 0) {
              return (
                <>
                  <VerticalSpacer height={32} />
                  <RenderGuardedComponent
                    props={ctx.botBarHeight}
                    component={(height) => <VerticalSpacer height={height} />}
                  />
                </>
              );
            }

            return <VerticalSpacer height={kh + 16} />;
          }}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
