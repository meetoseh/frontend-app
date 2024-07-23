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
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { screenOut } from '../../lib/screenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { JournalChatResources } from './JournalChatResources';
import { JournalChatMappedParams } from './JournalChatParams';
import { Close } from '../interactive_prompt_screen/icons/Close';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { SystemProfile } from './icons/SystemProfile';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { Submit } from './icons/Submit';
import { ScreenContext } from '../../hooks/useScreenContext';
import { OsehImageExportCropped } from '../../../../shared/images/OsehImageExportCropped';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { createChainedImageFromRef } from '../../lib/createChainedImageFromRef';
import { createValueWithCallbacksEffect } from '../../../../shared/hooks/createValueWithCallbacksEffect';
import { Arrow } from './icons/Arrow';
import { ThinkingDots } from '../../../../shared/components/ThinkingDots';
import { Pressable, TextInput, View, Text, ScrollView } from 'react-native';
import Back from '../../../../shared/components/icons/Back';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useKeyboardHeightValueWithCallbacks } from '../../../../shared/lib/useKeyboardHeightValueWithCallbacks';
import * as Colors from '../../../../styling/colors';

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
const SYSTEM_PIC_WIDTH = 30;
const SYSTEM_PIC_TO_CHAT_WIDTH = 16;

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

  const transitionState = useStandardTransitionsState(transition);
  const workingVWC = useWritableValueWithCallbacks(() => false);
  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (s) => s.width
  );

  const inputVWC = useWritableValueWithCallbacks<TextInput | null>(() => null);
  const inputHeightVWC = useWritableValueWithCallbacks<number>(() => 22);
  const rawInputValueVWC = useWritableValueWithCallbacks<string>(() => '');

  const submittedVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const onSubmit = () => {
    const value = rawInputValueVWC.get().trim();
    if (value === '') {
      return;
    }

    const ele = inputVWC.get();
    if (ele === null) {
      return;
    }

    if (submittedVWC.get()) {
      return;
    }

    ele.blur();
    setVWC(rawInputValueVWC, '');
    setVWC(submittedVWC, true);
    resources.trySubmitUserResponse(value);
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

  const suggestionsHeightVWC = useWritableValueWithCallbacks<number>(
    () => 56.34
  );
  const keyboardHeightVWC = useKeyboardHeightValueWithCallbacks();

  const suggestionsSizeVWC = useMappedValuesWithCallbacks(
    [ctx.contentWidth, suggestionsHeightVWC],
    () => ({
      width: ctx.contentWidth.get(),
      height: suggestionsHeightVWC.get(),
    })
  );

  const inputPropsVWC = useMappedValuesWithCallbacks(
    [inputHeightVWC, rawInputValueVWC, submittedVWC],
    () => ({
      text: rawInputValueVWC.get(),
      height: inputHeightVWC.get(),
      editable: !submittedVWC.get(),
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
              <Back />
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
              <Close />
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
                        <View style={styles.systemMessage}>
                          <SystemProfile />
                          <HorizontalSpacer width={SYSTEM_PIC_TO_CHAT_WIDTH} />
                          <View style={styles.systemMessageTextWrapper}>
                            <Text style={styles.systemMessageText}>
                              An error occurred. Try again or contact support at
                              hi@oseh.com
                            </Text>
                          </View>
                        </View>
                      );
                    }

                    const parts: ReactElement[] = [];
                    chat.data.forEach((part, partIndex) => {
                      if (part.type === 'chat') {
                        if (part.data.type !== 'textual') {
                          return;
                        }
                        if (parts.length > 0) {
                          parts.push(
                            <VerticalSpacer height={24} key={parts.length} />
                          );
                        }

                        const textPartElements: ReactElement[] = [];
                        part.data.parts.forEach((textPart) => {
                          if (textPartElements.length > 0) {
                            textPartElements.push(
                              <VerticalSpacer
                                height={24}
                                key={textPartElements.length}
                              />
                            );
                          }
                          if (textPart.type === 'paragraph') {
                            textPartElements.push(
                              <Text
                                key={textPartElements.length}
                                style={[
                                  part.display_author === 'self'
                                    ? styles.selfMessageText
                                    : styles.systemMessageText,
                                  styles.paragraph,
                                ]}
                              >
                                {textPart.value}
                              </Text>
                            );
                          } else if (textPart.type === 'journey') {
                            textPartElements.push(
                              <Pressable
                                key={textPartElements.length}
                                style={styles.journeyCard}
                                onPress={() => {
                                  const journalEntryUID =
                                    resources.journalEntryUID.get();
                                  if (journalEntryUID === null) {
                                    return;
                                  }

                                  const journalEntryJWT =
                                    resources.journalEntryJWT.get();
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
                                      endpoint:
                                        '/api/1/users/me/screens/pop_to_journal_chat_class',
                                      parameters: {
                                        journal_entry_uid: journalEntryUID,
                                        journal_entry_jwt: journalEntryJWT,
                                        entry_counter: partIndex + 1,
                                        journey_uid: textPart.uid,
                                        upgrade_slug:
                                          screen.parameters.upgradeTrigger,
                                      },
                                    }
                                  );
                                }}
                              >
                                <View style={styles.journeyCardTop}>
                                  <View style={styles.journeyCardTopBackground}>
                                    <JourneyCardTopBackgroundImage
                                      uid={
                                        textPart.details.darkened_background.uid
                                      }
                                      jwt={
                                        textPart.details.darkened_background.jwt
                                      }
                                      ctx={ctx}
                                    />
                                  </View>
                                  <View style={styles.journeyCardTopForeground}>
                                    {textPart.details.access ===
                                      'paid-requires-upgrade' && (
                                      <View
                                        style={
                                          styles.journeyCardTopForegroundPaid
                                        }
                                      >
                                        <Text
                                          style={
                                            styles.journeyCardTopForegroundPaidText
                                          }
                                        >
                                          Free Trial
                                        </Text>
                                      </View>
                                    )}
                                    <VerticalSpacer height={0} flexGrow={1} />
                                    <Text
                                      style={
                                        styles.journeyCardTopForegroundTitle
                                      }
                                    >
                                      {textPart.details.title}
                                    </Text>
                                    <VerticalSpacer height={2} />
                                    <Text
                                      style={
                                        styles.journeyCardTopForegroundInstructor
                                      }
                                    >
                                      {textPart.details.instructor.name}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.journeyCardBottom}>
                                  <Text style={styles.journeyCardInfo}>
                                    {(() => {
                                      const inSeconds =
                                        textPart.details.duration_seconds;
                                      const minutes = Math.floor(
                                        inSeconds / 60
                                      );
                                      const seconds =
                                        Math.floor(inSeconds) % 60;

                                      return (
                                        <Text>
                                          {minutes}:{seconds < 10 ? '0' : ''}
                                          {seconds}
                                        </Text>
                                      );
                                    })()}
                                  </Text>
                                  <HorizontalSpacer width={0} flexGrow={1} />
                                  <Arrow />
                                </View>
                              </Pressable>
                            );
                          }
                        });

                        if (part.display_author === 'self') {
                          parts.push(
                            <View style={styles.selfMessage} key={parts.length}>
                              <View style={styles.selfMessageTextWrapper}>
                                {textPartElements}
                              </View>
                            </View>
                          );
                        } else {
                          parts.push(
                            <View
                              style={styles.systemMessage}
                              key={parts.length}
                            >
                              <SystemProfile />
                              <HorizontalSpacer
                                width={SYSTEM_PIC_TO_CHAT_WIDTH}
                              />
                              <View style={styles.systemMessageTextWrapper}>
                                {textPartElements}
                              </View>
                            </View>
                          );
                        }
                      }
                    });

                    return (
                      <>
                        <VerticalSpacer height={32} flexGrow={0} />
                        {parts}
                        {chat.transient?.type?.startsWith('thinking') ? (
                          <>
                            <VerticalSpacer height={24} />
                            <ThinkingDots />
                            <VerticalSpacer height={24} />
                          </>
                        ) : undefined}
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

                              setVWC(
                                rawInputValueVWC,
                                rawInputValueVWC.get() + suggestion.text
                              );
                              ele.focus();
                            }}
                          >
                            <Text style={styles.suggestionText}>
                              {suggestion.text}
                            </Text>
                          </Pressable>
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
                  <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                      <RenderGuardedComponent
                        props={inputPropsVWC}
                        component={({ text, height, editable }) => (
                          <TextInput
                            style={Object.assign({}, styles.input, {
                              height: height,
                            })}
                            placeholderTextColor={Colors.GRAYSCALE_DISABLED}
                            multiline
                            placeholder="How are you feeling today?"
                            ref={(r) => setVWC(inputVWC, r)}
                            value={text}
                            editable={editable}
                            onChangeText={(t) => setVWC(rawInputValueVWC, t)}
                            onContentSizeChange={(e) => {
                              const height =
                                e?.nativeEvent?.contentSize?.height;
                              if (
                                height !== undefined &&
                                !isNaN(height) &&
                                height > 0
                              ) {
                                const old = inputHeightVWC.get();
                                if (
                                  old === height ||
                                  (old > height &&
                                    Math.abs(old - height) < 1e-3)
                                ) {
                                  return;
                                }
                                console.log(
                                  `got new input height: ${inputHeightVWC.get()} -> ${height}`
                                );
                                inputHeightVWC.set(height);
                                inputHeightVWC.callbacks.call(undefined);
                              }
                            }}
                          />
                        )}
                        applyInstantly
                      />
                    </View>
                    <HorizontalSpacer width={6} />
                    <Pressable
                      style={styles.submit}
                      onPress={() => {
                        onSubmit();
                      }}
                    >
                      <Submit />
                    </Pressable>
                  </View>
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

const JourneyCardTopBackgroundImage = ({
  uid,
  jwt,
  ctx,
}: {
  uid: string;
  jwt: string;
  ctx: ScreenContext;
}): ReactElement => {
  const thumbhashVWC = useWritableValueWithCallbacks<string | null>(() => null);
  const imageVWC = useWritableValueWithCallbacks<OsehImageExportCropped | null>(
    () => null
  );

  useEffect(() => {
    const inner = createChainedImageFromRef({
      ctx,
      getRef: () => ({
        data: createWritableValueWithCallbacks({
          type: 'success',
          data: { uid, jwt },
          error: undefined,
          reportExpired: () => {},
        }),
        release: () => {},
      }),
      sizeMapper: (ws) => ({
        width: Math.min(ws.width - 24, 296),
        height: 120,
      }),
    });

    const cleanupThumbhashAttacher = createValueWithCallbacksEffect(
      inner.thumbhash,
      (th) => {
        setVWC(thumbhashVWC, th);
        return undefined;
      }
    );
    const cleanupImageAttacher = createValueWithCallbacksEffect(
      inner.image,
      (im) => {
        setVWC(imageVWC, im);
        return undefined;
      }
    );
    return () => {
      cleanupThumbhashAttacher();
      cleanupImageAttacher();
      inner.dispose();
      setVWC(imageVWC, null);
    };
  }, [uid, jwt, ctx, thumbhashVWC, imageVWC]);

  return (
    <GridImageBackground
      image={imageVWC}
      thumbhash={thumbhashVWC}
      size={useMappedValueWithCallbacks(ctx.contentWidth, (cw) => ({
        width: cw - SYSTEM_PIC_WIDTH - SYSTEM_PIC_TO_CHAT_WIDTH,
        height: 120,
      }))}
      borderRadius={{
        topLeft: 10,
        topRight: 10,
        bottomLeft: 0,
        bottomRight: 0,
      }}
    />
  );
};
