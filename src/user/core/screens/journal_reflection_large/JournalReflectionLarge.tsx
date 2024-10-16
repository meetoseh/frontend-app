import { Fragment, ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { JournalReflectionLargeMappedParams } from './JournalReflectionLargeParams';
import { JournalReflectionLargeResources } from './JournalReflectionLargeResources';
import {
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
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { ScreenHeader } from '../../../../shared/components/ScreenHeader';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { InlineOsehSpinner } from '../../../../shared/components/InlineOsehSpinner';
import { styles } from './JournalReflectionLargeStyles';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { Regenerate } from '../../../../shared/components/icons/Regenerate';
import { OsehColors } from '../../../../shared/OsehColors';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { Edit } from '../../../../shared/components/icons/Edit';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import {
  RESIZING_TEXT_AREA_ICON_SETTINGS,
  ResizingTextArea,
  ResizingTextAreaProps,
} from '../../../../shared/components/ResizingTextArea';
import { Send } from '../../../../shared/components/icons/Send';
import { TextInput, View, Text, Pressable } from 'react-native';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { useKeyboardHeightValueWithCallbacks } from '../../../../shared/lib/useKeyboardHeightValueWithCallbacks';

/**
 * Shows the journal reflection question in large text, allowing the user to
 * focus on regenerating or edit it before responding.
 */
export const JournalReflectionLarge = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'journal_reflection_large',
  JournalReflectionLargeResources,
  JournalReflectionLargeMappedParams
>): ReactElement => {
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

  const headerWithClose = (
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
  );

  const editingVWC = useWritableValueWithCallbacks(() => false);
  const editedValueVWC = useWritableValueWithCallbacks<string>(() => '');
  const editInputRefVWC = useWritableValueWithCallbacks<TextInput | null>(
    () => null
  );

  const onSubmitEdit = () => {
    if (!editingVWC.get()) {
      return;
    }

    const newValue = (editedValueVWC.get() ?? '').trim();

    if (
      newValue === '' ||
      newValue === (resources.question.get()?.paragraphs ?? []).join('\n\n')
    ) {
      setVWC(editingVWC, false);
      setVWC(editedValueVWC, '');
      return;
    }

    resources.trySubmitEdit(newValue);
    setVWC(editingVWC, false);
    setVWC(editedValueVWC, '');
  };

  useValuesWithCallbacksEffect([editingVWC, editInputRefVWC], () => {
    const inputRaw = editInputRefVWC.get();
    if (inputRaw === null) {
      return undefined;
    }
    const input = inputRaw;

    const editing = editingVWC.get();
    if (editing) {
      input.focus();
    } else {
      input.blur();
    }
    return undefined;
  });

  const keyboardHeightVWC = useKeyboardHeightValueWithCallbacks();

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar="light"
      modals={false}
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        gridSizeVWC={ctx.windowSizeImmediate}
        contentWidthVWC={windowWidthVWC}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(height) => <VerticalSpacer height={height} />}
        />
        {screen.parameters.close.onlyIfError ? (
          <RenderGuardedComponent
            props={isErrorVWC}
            component={(isError) =>
              !isError ? (
                <ScreenHeader
                  close={null}
                  text={screen.parameters.header}
                  windowWidth={windowWidthVWC}
                  contentWidth={ctx.contentWidth}
                />
              ) : (
                headerWithClose
              )
            }
          />
        ) : (
          headerWithClose
        )}
        <RenderGuardedComponent
          props={editingVWC}
          component={(editing) =>
            editing ? (
              <>
                <VerticalSpacer height={0} flexGrow={1} />
                <ContentContainer contentWidthVWC={ctx.contentWidth}>
                  <ResizingTextArea
                    variant="dark"
                    refVWC={editInputRefVWC}
                    value={editedValueVWC}
                    onValueChanged={(v) => setVWC(editedValueVWC, v)}
                    submit={{
                      value: {
                        icon: (
                          <Send
                            color={OsehColors.v4.primary.light}
                            color2={OsehColors.v4.primary.dark}
                            {...RESIZING_TEXT_AREA_ICON_SETTINGS}
                          />
                        ),
                        onClick: onSubmitEdit,
                      },
                    }}
                    placeholder="Type the question you want to answer"
                    enterBehavior="submit-unless-shift"
                  />
                </ContentContainer>
                <RenderGuardedComponent
                  props={keyboardHeightVWC}
                  component={(kh) => {
                    if (kh <= 0) {
                      return (
                        <>
                          <VerticalSpacer height={0} flexGrow={1} />
                          <RenderGuardedComponent
                            props={ctx.botBarHeight}
                            component={(height) => (
                              <VerticalSpacer height={height} />
                            )}
                          />
                        </>
                      );
                    }

                    return <VerticalSpacer height={kh + 16} />;
                  }}
                />
              </>
            ) : (
              <>
                <VerticalSpacer height={0} flexGrow={1} />
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
                          Something went wrong loading your reflection question.
                          Try again or contact support at hi@oseh.com
                        </Text>
                      </ContentContainer>
                    ) : (
                      <>
                        {question.paragraphs.map((q, i) => (
                          <Fragment key={i}>
                            {i > 0 && <VerticalSpacer height={16} />}
                            <ContentContainer
                              contentWidthVWC={ctx.contentWidth}
                            >
                              <Text style={styles.question}>{q}</Text>
                            </ContentContainer>
                          </Fragment>
                        ))}
                      </>
                    )
                  }
                />
                {screen.parameters.hint && (
                  <>
                    <VerticalSpacer height={0} maxHeight={64} flexGrow={2} />
                    <ContentContainer contentWidthVWC={ctx.contentWidth}>
                      <Text style={styles.hint}>{screen.parameters.hint}</Text>
                    </ContentContainer>
                  </>
                )}
                <VerticalSpacer height={0} flexGrow={1} />
                <ContentContainer contentWidthVWC={ctx.contentWidth}>
                  <RenderGuardedComponent
                    props={isReadyToContinueVWC}
                    component={(isReady) => (
                      <TextStyleForwarder
                        component={(styleVWC) => (
                          <FilledInvertedButton
                            onPress={() => {
                              if (!isReady) {
                                return;
                              }
                              configurableScreenOut(
                                workingVWC,
                                startPop,
                                transition,
                                screen.parameters.cta.exit,
                                screen.parameters.cta.trigger,
                                {
                                  afterDone: () => {
                                    trace({ type: 'cta' });
                                  },
                                }
                              );
                            }}
                            disabled={!isReady}
                            setTextStyle={(s) => setVWC(styleVWC, s)}
                          >
                            <RenderGuardedComponent
                              props={styleVWC}
                              component={(s) => (
                                <Text style={s}>
                                  {screen.parameters.cta.text}
                                </Text>
                              )}
                            />
                          </FilledInvertedButton>
                        )}
                      />
                    )}
                  />
                </ContentContainer>
                {screen.parameters.regenerate !== null ||
                screen.parameters.edit !== null ? (
                  <>
                    <VerticalSpacer height={12} />
                    <View style={styles.buttons}>
                      <HorizontalSpacer width={0} flexGrow={1} />
                      {screen.parameters.regenerate !== null && (
                        <Pressable
                          onPress={() => {
                            resources.tryRegenerate();
                          }}
                        >
                          <Regenerate
                            icon={{ width: 16 }}
                            container={{ width: 48, height: 48 }}
                            color={OsehColors.v4.primary.smoke}
                            startPadding={{
                              x: { fraction: 0.5 },
                              y: { fraction: 0.5 },
                            }}
                          />
                        </Pressable>
                      )}
                      {screen.parameters.regenerate !== null &&
                        screen.parameters.edit !== null && (
                          <HorizontalSpacer width={4} />
                        )}
                      {screen.parameters.edit !== null && (
                        <Pressable
                          onPress={() => {
                            setVWC(
                              editedValueVWC,
                              resources.question
                                .get()
                                ?.paragraphs?.join('\n\n') ?? ''
                            );
                            setVWC(editingVWC, true);
                          }}
                        >
                          <Edit
                            icon={{ width: 17 }}
                            container={{ width: 48, height: 48 }}
                            color={OsehColors.v4.primary.smoke}
                            startPadding={{
                              x: { fraction: 0.5 },
                              y: { fraction: 0.5 },
                            }}
                          />
                        </Pressable>
                      )}
                      <HorizontalSpacer width={0} flexGrow={1} />
                    </View>
                  </>
                ) : undefined}
                <VerticalSpacer height={32} />
                <RenderGuardedComponent
                  props={ctx.botBarHeight}
                  component={(height) => <VerticalSpacer height={height} />}
                />
              </>
            )
          }
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
