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
import { styles } from './JournalEntrySummaryStyles';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { Regenerate } from '../../../../shared/components/icons/Regenerate';
import { OsehColors } from '../../../../shared/OsehColors';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { Edit } from '../../../../shared/components/icons/Edit';
import { setVWC } from '../../../../shared/lib/setVWC';
import { JournalEntrySummaryResources } from './JournalEntrySummaryResources';
import { JournalEntrySummaryMappedParams } from './JournalEntrySummaryParams';
import { Close } from '../../../../shared/components/icons/Close';
import { Plus } from '../../../../shared/components/icons/Plus';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { TagText } from './components/TagText';
import { View, Text, TextInput, Pressable } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { useKeyboardHeightValueWithCallbacks } from '../../../../shared/lib/useKeyboardHeightValueWithCallbacks';

/**
 * Shows the journal entry summary and allows editing it
 */
export const JournalEntrySummary = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'journal_entry_summary',
  JournalEntrySummaryResources,
  JournalEntrySummaryMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const isErrorVWC = useMappedValueWithCallbacks(
    resources.summary,
    (q) => q === undefined
  );
  useValueWithCallbacksEffect(isErrorVWC, (isError) => {
    if (isError) {
      trace({ type: 'error', hint: 'summary is undefined' });
    }
    return undefined;
  });

  const isReadyToContinueVWC = useMappedValueWithCallbacks(
    resources.summary,
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
  const editedTitleVWC = useWritableValueWithCallbacks<string>(() => '');

  const editedTagsVWC = useWritableValueWithCallbacks<string[]>(() => []);
  const addingTagVWC = useWritableValueWithCallbacks(() => false);
  const editTagsAddTagValueVWC = useWritableValueWithCallbacks<string>(
    () => ''
  );

  const onAddTag = () => {
    const newTag = editTagsAddTagValueVWC.get().trim();
    if (newTag !== '') {
      editedTagsVWC.get().push(newTag);
      editedTagsVWC.callbacks.call(undefined);
    }

    setVWC(addingTagVWC, false);
    setVWC(editTagsAddTagValueVWC, '');
  };

  const onSubmitEdit = () => {
    if (!editingVWC.get()) {
      return;
    }

    const newTitle = (editedTitleVWC.get() ?? '').trim();
    const newTags = editedTagsVWC.get().slice();

    const existing = resources.summary.get();
    if (existing === null || existing === undefined) {
      return;
    }

    if (
      newTitle === '' ||
      (newTitle === existing.data.title &&
        newTags.length === existing.data.tags.length &&
        newTags.every((t, i) => t === existing.data.tags[i]))
    ) {
      setVWC(editingVWC, false);
      setVWC(editedTitleVWC, '');
      setVWC(editedTagsVWC, []);
      return;
    }

    resources.trySubmitEdit({
      type: 'summary',
      version: 'v1',
      title: newTitle,
      tags: newTags,
    });
    setVWC(editingVWC, false);
    setVWC(editedTitleVWC, '');
    setVWC(editedTagsVWC, []);
  };

  const editedTitleAndAddingVWC = useMappedValuesWithCallbacks(
    [editedTitleVWC, addingTagVWC],
    () => ({
      title: editedTitleVWC.get(),
      adding: addingTagVWC.get(),
    })
  );

  const keyboardHeightVWC = useKeyboardHeightValueWithCallbacks();

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
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
                  <RenderGuardedComponent
                    props={editedTitleAndAddingVWC}
                    component={({ title, adding }) =>
                      adding ? (
                        <Text style={styles.title}>{title}</Text>
                      ) : (
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.inputText}
                            placeholder="Title (3-4 words)"
                            value={title}
                            onChangeText={(v) => setVWC(editedTitleVWC, v)}
                            placeholderTextColor={OsehColors.v4.primary.grey}
                          />
                        </View>
                      )
                    }
                    applyInstantly
                  />
                </ContentContainer>
                <VerticalSpacer height={0} maxHeight={8} flexGrow={1} />
                <ContentContainer contentWidthVWC={ctx.contentWidth}>
                  <RenderGuardedComponent
                    props={editedTagsVWC}
                    component={(tags) => (
                      <View style={styles.rowWrap}>
                        {tags.map((tag, i) => (
                          <Fragment key={i}>
                            {i > 0 && <HorizontalSpacer width={16} />}
                            <View style={styles.column}>
                              <VerticalSpacer height={16} />
                              <View style={styles.tag}>
                                <View style={styles.column}>
                                  <View style={styles.row}>
                                    <HorizontalSpacer width={8} />
                                    <TagText tag={tag} />
                                    <HorizontalSpacer width={10} />
                                    <Pressable
                                      onPress={() => {
                                        editedTagsVWC.get().splice(i, 1);
                                        editedTagsVWC.callbacks.call(undefined);
                                      }}
                                    >
                                      <Close
                                        icon={{ width: 16 }}
                                        container={{ width: 24, height: 34 }}
                                        color={OsehColors.v4.primary.smoke}
                                        startPadding={{
                                          x: { fraction: 0 },
                                          y: { fraction: 0.5 },
                                        }}
                                      />
                                    </Pressable>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </Fragment>
                        ))}
                        <RenderGuardedComponent
                          props={addingTagVWC}
                          component={(adding) =>
                            adding ? (
                              <></>
                            ) : (
                              <>
                                {tags.length > 0 && (
                                  <HorizontalSpacer width={16} />
                                )}
                                <View style={styles.column}>
                                  <VerticalSpacer height={16} />
                                  <View style={styles.tag}>
                                    <Pressable
                                      onPress={() => {
                                        setVWC(addingTagVWC, true);
                                      }}
                                    >
                                      <Plus
                                        icon={{
                                          width: 24,
                                        }}
                                        container={{
                                          width: 36,
                                          height: 36,
                                        }}
                                        startPadding={{
                                          x: {
                                            fraction: 0.5,
                                          },
                                          y: {
                                            fraction: 0.5,
                                          },
                                        }}
                                        color={OsehColors.v4.primary.light}
                                      />
                                    </Pressable>
                                  </View>
                                </View>
                              </>
                            )
                          }
                        />
                      </View>
                    )}
                  />
                </ContentContainer>
                <RenderGuardedComponent
                  props={addingTagVWC}
                  component={(adding) =>
                    !adding ? (
                      <></>
                    ) : (
                      <>
                        <VerticalSpacer
                          height={0}
                          maxHeight={24}
                          flexGrow={1}
                        />
                        <ContentContainer contentWidthVWC={ctx.contentWidth}>
                          <View style={styles.inputWrapper}>
                            <RenderGuardedComponent
                              props={editTagsAddTagValueVWC}
                              component={(value) => (
                                <TextInput
                                  style={styles.inputText}
                                  placeholder="Enter your tag here"
                                  value={value}
                                  onChangeText={(v) =>
                                    setVWC(editTagsAddTagValueVWC, v)
                                  }
                                  placeholderTextColor={
                                    OsehColors.v4.primary.grey
                                  }
                                />
                              )}
                              applyInstantly
                            />
                          </View>
                        </ContentContainer>
                      </>
                    )
                  }
                />
                <VerticalSpacer height={0} maxHeight={32} flexGrow={1} />
                <ContentContainer contentWidthVWC={ctx.contentWidth}>
                  <TextStyleForwarder
                    component={(styleVWC) => (
                      <FilledInvertedButton
                        onPress={() => {
                          if (addingTagVWC.get()) {
                            onAddTag();
                          } else {
                            onSubmitEdit();
                          }
                        }}
                        setTextStyle={(s) => setVWC(styleVWC, s)}
                      >
                        <RenderGuardedComponent
                          props={styleVWC}
                          component={(s) => (
                            <RenderGuardedComponent
                              props={addingTagVWC}
                              component={(adding) =>
                                adding ? (
                                  <Text style={s}>Add Tag</Text>
                                ) : (
                                  <Text style={s}>Finish Editing</Text>
                                )
                              }
                            />
                          )}
                        />
                      </FilledInvertedButton>
                    )}
                  />
                </ContentContainer>
                <VerticalSpacer height={0} maxHeight={32} flexGrow={1} />
              </>
            ) : (
              <>
                <VerticalSpacer height={0} flexGrow={1} />
                <RenderGuardedComponent
                  props={resources.summary}
                  component={(summary) =>
                    summary === null ? (
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
                    ) : summary === undefined ? (
                      <ContentContainer contentWidthVWC={ctx.contentWidth}>
                        <Text style={styles.error}>
                          Something went wrong loading your summary. Try again
                          or contact support at hi@oseh.com
                        </Text>
                      </ContentContainer>
                    ) : (
                      <>
                        <ContentContainer contentWidthVWC={ctx.contentWidth}>
                          <Text style={styles.title}>{summary.data.title}</Text>
                        </ContentContainer>
                        <VerticalSpacer height={0} maxHeight={8} flexGrow={1} />
                        <ContentContainer contentWidthVWC={ctx.contentWidth}>
                          <View style={styles.rowWrap}>
                            {summary.data.tags.map((tag, i) => (
                              <Fragment key={i}>
                                {i > 0 && <HorizontalSpacer width={16} />}
                                <View style={styles.column}>
                                  <VerticalSpacer height={16} />
                                  <View style={styles.tag}>
                                    <View style={styles.column}>
                                      <VerticalSpacer height={5} />
                                      <View style={styles.row}>
                                        <HorizontalSpacer width={8} />
                                        <TagText tag={tag} />
                                        <HorizontalSpacer width={8} />
                                      </View>
                                      <VerticalSpacer height={5} />
                                    </View>
                                  </View>
                                </View>
                              </Fragment>
                            ))}
                          </View>
                        </ContentContainer>
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
                            const summary = resources.summary.get();
                            if (summary !== null && summary !== undefined) {
                              setVWC(editedTitleVWC, summary.data.title);
                              setVWC(editedTagsVWC, summary.data.tags.slice());
                              setVWC(addingTagVWC, false);
                              setVWC(editTagsAddTagValueVWC, '');
                              setVWC(editingVWC, true);
                            }
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
              </>
            )
          }
        />
        <RenderGuardedComponent
          props={keyboardHeightVWC}
          component={(h) =>
            h <= 0 ? (
              <RenderGuardedComponent
                props={ctx.topBarHeight}
                component={(h) => <VerticalSpacer height={h} />}
              />
            ) : (
              <VerticalSpacer height={h} />
            )
          }
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
