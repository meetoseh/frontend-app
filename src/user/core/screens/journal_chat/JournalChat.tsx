import { Fragment, ReactElement, useEffect } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './JournalChatStyles';
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
import { screenOut } from '../../lib/screenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { JournalChatResources } from './JournalChatResources';
import { JournalChatMappedParams } from './JournalChatParams';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import {
  Pressable,
  View,
  Text,
  ScrollView,
  GestureResponderEvent,
} from 'react-native';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useKeyboardHeightValueWithCallbacks } from '../../../../shared/lib/useKeyboardHeightValueWithCallbacks';
import { trackClassTaken } from '../home/lib/trackClassTaken';
import { Back } from '../../../../shared/components/icons/Back';
import { OsehColors } from '../../../../shared/OsehColors';
import { Close } from '../../../../shared/components/icons/Close';
import { VoiceNoteStateMachine } from './lib/createVoiceNoteStateMachine';
import { JournalEntryItemTextualPartJourney } from './lib/JournalChatState';
import { VoiceOrTextInput } from '../../../../shared/components/voiceOrTextInput/VoiceOrTextInput';
import { JournalChatParts } from './components/JournalChatParts';
import { JournalChatSpinners } from './components/JournalChatSpinners';
import { OsehStyles } from '../../../../shared/OsehStyles';

const SUGGESTIONS = [
  { text: 'I have a lot of anxiety right now', width: 160 },
  { text: 'I feel scattered and need to focus', width: 160 },
  { text: 'I’m feeling disconnected', width: 130 },
  { text: 'I’m having trouble sleeping and need to calm my mind', width: 240 },
  { text: 'I’m feeling a bit down and need encouragement', width: 238 },
  { text: 'I’m feeling happy and want to cherish this moment', width: 220 },
];

const CHAT_AREA_TO_HINT_HEIGHT = 12;
const HINT_TO_SUGGESTIONS_HEIGHT = 16;
const SUGGESTIONS_TO_INPUT_HEIGHT = 16;
const INPUT_TO_BOTTOM_HEIGHT = 40;
const INPUT_TO_BOTTOM_WITH_KEYBOARD_HEIGHT = 16;

/**
 * Allows the user to talk with the system
 */
export const JournalChat = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'journal_chat',
  JournalChatResources,
  JournalChatMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  useEffect(() => {
    // version 73 or below used to create the journal entry client side; we no longer
    // do this, and once a client has updated we will skip the screen to get to a flow
    // which has the server initialize the entry
    if (screen.parameters.journalEntry === null) {
      screenOut(
        workingVWC,
        startPop,
        transition,
        screen.parameters.exit,
        'skip',
        {
          beforeDone: async () => {
            trace({ type: 'no_journal_entry' });
          },
        }
      );
    }
  });

  const transitionState = useStandardTransitionsState(transition);
  const workingVWC = useWritableValueWithCallbacks(() => false);
  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (s) => s.width
  );

  const inputVWC = useWritableValueWithCallbacks<{
    focus: () => void;
    blur: () => void;
  } | null>(() => null);
  const rawInputValueVWC = useWritableValueWithCallbacks<string>(
    () => screen.parameters.autofill
  );
  const inputTypeVWC = useWritableValueWithCallbacks<'text' | 'voice'>(
    () => 'text'
  );
  const fullInputValueVWC = useMappedValuesWithCallbacks(
    [inputTypeVWC, rawInputValueVWC],
    (): { type: 'text'; value: string } | { type: 'voice' } => {
      if (inputTypeVWC.get() === 'text') {
        return { type: 'text', value: rawInputValueVWC.get() };
      }
      return { type: 'voice' };
    }
  );

  const submittedVWC = useWritableValueWithCallbacks<boolean>(() => false);
  useValueWithCallbacksEffect(resources.chat, (chat) => {
    if (
      !submittedVWC.get() &&
      chat !== null &&
      chat !== undefined &&
      chat.data.length > 2
    ) {
      setVWC(submittedVWC, true);
    }
    return undefined;
  });

  const onSubmit = (
    v:
      | { type: 'text'; value: string }
      | { type: 'voice'; voiceNote: VoiceNoteStateMachine }
  ) => {
    if (submittedVWC.get()) {
      return;
    }

    if (v.type === 'text' && v.value.trim() === '') {
      return;
    }

    inputVWC.get()?.blur();
    setVWC(rawInputValueVWC, '');
    setVWC(inputTypeVWC, 'text');
    setVWC(submittedVWC, true);
    resources.trySubmitUserResponse(v);
  };

  const focusedVWC = useWritableValueWithCallbacks(() => false);
  useValueWithCallbacksEffect(inputVWC, (eleRaw) => {
    if (screen.parameters.focus !== 'input') {
      return undefined;
    }

    if (focusedVWC.get()) {
      return undefined;
    }

    if (eleRaw !== null) {
      eleRaw.focus();
      setVWC(focusedVWC, true);
    }
    return undefined;
  });

  const onClickJourneyCard = (
    part: JournalEntryItemTextualPartJourney,
    partIndex: number,
    e: GestureResponderEvent
  ) => {
    e.preventDefault();
    const journalEntryUID = resources.journalEntryUID.get();
    if (journalEntryUID === null) {
      return;
    }

    const journalEntryJWT = resources.journalEntryJWT.get();
    if (journalEntryJWT === null) {
      return;
    }

    screenOut(
      workingVWC,
      startPop,
      transition,
      screen.parameters.exit,
      screen.parameters.journeyTrigger,
      {
        endpoint: '/api/1/users/me/screens/pop_to_journal_chat_class',
        parameters: {
          journal_entry_uid: journalEntryUID,
          journal_entry_jwt: journalEntryJWT,
          entry_counter: partIndex + 1,
          journey_uid: part.uid,
          upgrade_slug: screen.parameters.upgradeTrigger,
        },
        afterDone:
          part.details.access !== 'paid-requires-upgrade'
            ? async () => {
                trackClassTaken(ctx);
              }
            : undefined,
      }
    );
  };

  const suggestionsHeightVWC = useWritableValueWithCallbacks<number>(
    () => 56.34
  );
  const keyboardHeightVWC = useKeyboardHeightValueWithCallbacks();

  const suggestionsSizeVWC = useMappedValuesWithCallbacks(
    [windowWidthVWC, suggestionsHeightVWC],
    () => ({
      width: windowWidthVWC.get(),
      height: suggestionsHeightVWC.get(),
    })
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar="light"
      modals={false}
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={windowWidthVWC}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(topBarHeight) => <VerticalSpacer height={topBarHeight} />}
        />
        <View style={styles.header}>
          {screen.parameters.back.type === 'back' ? (
            <Pressable
              style={styles.backWrapper}
              onPress={() => {
                if (screen.parameters.back.type !== 'back') {
                  return;
                }

                screenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.exit,
                  screen.parameters.back.trigger,
                  {
                    beforeDone: async () => {
                      trace({ type: 'back' });
                    },
                  }
                );
              }}
            >
              <Back
                icon={{ width: 20 }}
                container={{ width: 52, height: 53 }}
                startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          ) : (
            <HorizontalSpacer width={0} flexGrow={1} />
          )}
          <Text style={styles.headerText}>{screen.parameters.title}</Text>
          {screen.parameters.back.type === 'x' ? (
            <Pressable
              style={styles.xWrapper}
              onPress={() => {
                if (screen.parameters.back.type !== 'x') {
                  return;
                }

                screenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.exit,
                  screen.parameters.back.trigger,
                  {
                    beforeDone: async () => {
                      trace({ type: 'x' });
                    },
                  }
                );
              }}
            >
              <Close
                icon={{ width: 24 }}
                container={{ width: 56, height: 56 }}
                startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          ) : (
            <HorizontalSpacer width={0} flexGrow={1} />
          )}
        </View>
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [windowWidthVWC, ctx.contentWidth],
            () => ({
              width: windowWidthVWC.get(),
              innerWidth: ctx.contentWidth.get(),
            })
          )}
          component={({ width, innerWidth }) => (
            <ScrollView
              style={Object.assign({}, styles.chatAreaContainer, {
                width,
              })}
              contentContainerStyle={Object.assign({}, styles.chatAreaContent, {
                width,
              })}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  width: innerWidth,
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                }}
              >
                <RenderGuardedComponent
                  props={resources.chat}
                  component={(chat) => {
                    if (chat === null) {
                      return <></>;
                    }
                    if (chat === undefined) {
                      return (
                        <>
                          <VerticalSpacer height={32} flexGrow={0} />
                          <Text
                            style={[
                              OsehStyles.typography.body,
                              OsehStyles.colors.v4.experimental.lightError,
                            ]}
                          >
                            An error occurred. Try again or contact support at
                            hi@oseh.com
                          </Text>
                        </>
                      );
                    }

                    return (
                      <>
                        <VerticalSpacer height={32} flexGrow={0} />
                        <JournalChatParts
                          ctx={ctx}
                          refreshChat={resources.refreshJournalEntry}
                          onGotoJourney={onClickJourneyCard}
                          chat={chat}
                        />
                        <JournalChatSpinners ctx={ctx} chat={chat} />
                      </>
                    );
                  }}
                />
              </View>
            </ScrollView>
          )}
        />
        <RenderGuardedComponent
          props={submittedVWC}
          component={(submitted) =>
            submitted ? (
              <>
                <VerticalSpacer height={INPUT_TO_BOTTOM_HEIGHT} />
                <RenderGuardedComponent
                  props={ctx.botBarHeight}
                  component={(height) => <VerticalSpacer height={height} />}
                />
              </>
            ) : (
              <>
                <VerticalSpacer height={CHAT_AREA_TO_HINT_HEIGHT} />
                <Text style={styles.hint}>
                  Type a message below or tap a suggestion to get started
                </Text>
                <VerticalSpacer height={HINT_TO_SUGGESTIONS_HEIGHT} />
                <RenderGuardedComponent
                  props={suggestionsSizeVWC}
                  component={(size) => (
                    <ScrollView
                      style={Object.assign({}, styles.suggestions, size)}
                      contentContainerStyle={styles.suggestionsContent}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {SUGGESTIONS.map((suggestion, i) => (
                        <Fragment key={i}>
                          <HorizontalSpacer width={i === 0 ? 16 : 12} />
                          <View
                            style={Object.assign({}, styles.suggestionWrapper, {
                              width: suggestion.width,
                              flexBasis: suggestion.width,
                            })}
                          >
                            <Pressable
                              style={Object.assign({}, styles.suggestion, {
                                width: suggestion.width,
                                flexBasis: suggestion.width,
                              })}
                              onLayout={
                                i !== 0
                                  ? undefined
                                  : (e) => {
                                      const height =
                                        e?.nativeEvent?.layout?.height;
                                      if (
                                        height !== undefined &&
                                        !isNaN(height) &&
                                        height > 0
                                      ) {
                                        const old = suggestionsHeightVWC.get();
                                        if (
                                          old === height ||
                                          (old > height &&
                                            Math.abs(old - height) < 1e-3)
                                        ) {
                                          return;
                                        }
                                        suggestionsHeightVWC.set(height);
                                        suggestionsHeightVWC.callbacks.call(
                                          undefined
                                        );
                                      }
                                    }
                              }
                              onPress={() => {
                                const ele = inputVWC.get();
                                if (ele === null) {
                                  return;
                                }

                                setVWC(rawInputValueVWC, suggestion.text);
                                ele.focus();
                              }}
                            >
                              <Text style={styles.suggestionText}>
                                {suggestion.text}
                              </Text>
                            </Pressable>
                          </View>
                          <HorizontalSpacer
                            width={i === SUGGESTIONS.length - 1 ? 16 : 0}
                          />
                        </Fragment>
                      ))}
                    </ScrollView>
                  )}
                />
                <VerticalSpacer height={SUGGESTIONS_TO_INPUT_HEIGHT} />
                <ContentContainer contentWidthVWC={ctx.contentWidth}>
                  <VoiceOrTextInput
                    placeholder="Type your message"
                    onSubmit={onSubmit}
                    value={fullInputValueVWC}
                    onValueChanged={(v) => {
                      if (v.type === 'text') {
                        setVWC(rawInputValueVWC, v.value);
                        setVWC(inputTypeVWC, 'text');
                      } else {
                        setVWC(inputTypeVWC, 'voice');
                      }
                    }}
                    onFocuser={(f) => setVWC(inputVWC, f)}
                  />
                </ContentContainer>
                <RenderGuardedComponent
                  props={keyboardHeightVWC}
                  component={(kh) => {
                    if (kh <= 0) {
                      return (
                        <>
                          <VerticalSpacer height={INPUT_TO_BOTTOM_HEIGHT} />
                          <RenderGuardedComponent
                            props={ctx.botBarHeight}
                            component={(height) => (
                              <VerticalSpacer height={height} />
                            )}
                          />
                        </>
                      );
                    }

                    return (
                      <VerticalSpacer
                        height={kh + INPUT_TO_BOTTOM_WITH_KEYBOARD_HEIGHT}
                      />
                    );
                  }}
                />
              </>
            )
          }
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
