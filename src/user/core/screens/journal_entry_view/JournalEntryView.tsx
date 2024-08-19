import { ReactElement, useMemo } from 'react';
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
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { JournalEntryViewResources } from './JournalEntryViewResources';
import { JournalEntryViewMappedParams } from './JournalEntryViewParams';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { styles } from './JournalEntryViewStyles';
import { InlineOsehSpinner } from '../../../../shared/components/InlineOsehSpinner';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { ThinkingDots } from '../../../../shared/components/ThinkingDots';
import { JournalEntryViewJournalCard } from './components/JournalEntryViewJournalCard';
import { View, Text } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { setVWC } from '../../../../shared/lib/setVWC';

/**
 * Shows the journal reflection question and gives a large amount of room for
 * the user to write their response.
 */
export const JournalEntryView = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'journal_entry_view',
  JournalEntryViewResources,
  JournalEntryViewMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const isErrorVWC = useMappedValuesWithCallbacks(
    [resources.metadata, resources.chat],
    () =>
      resources.metadata.get() === undefined ||
      resources.chat.get() === undefined
  );
  useValueWithCallbacksEffect(isErrorVWC, (isError) => {
    if (isError) {
      trace({
        type: 'error',
        metadataUndefined: resources.metadata.get() === undefined,
        chatUndefined: resources.chat.get() === undefined,
      });
    }
    return undefined;
  });

  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (size) => size.width
  );

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
        <VerticalSpacer height={0} maxHeight={40} flexGrow={1} />
        <RenderGuardedComponent
          props={resources.metadata}
          component={(metadata) =>
            metadata === null ? (
              <View style={styles.spinner}>
                <InlineOsehSpinner
                  size={{ type: 'react-rerender', props: { width: 12 } }}
                  variant="white-thin"
                />
              </View>
            ) : (
              <ContentContainer contentWidthVWC={ctx.contentWidth}>
                <View style={styles.metadata}>
                  <Text style={styles.metadataText}>
                    {metadata === undefined
                      ? 'Error'
                      : metadata.canonicalAt.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                  </Text>
                  <HorizontalSpacer width={0} flexGrow={1} />
                  <Text style={styles.metadataText}>
                    {metadata === undefined
                      ? 'Error'
                      : metadata.canonicalAt.toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                  </Text>
                </View>
              </ContentContainer>
            )
          }
        />
        <VerticalSpacer height={0} maxHeight={24} flexGrow={1} />
        <RenderGuardedComponent
          props={resources.chat}
          component={(chat) => {
            if (chat === null) {
              return <ThinkingDots />;
            }
            if (chat === undefined) {
              return (
                <ContentContainer contentWidthVWC={ctx.contentWidth}>
                  <Text style={styles.error}>
                    Something went wrong loading this entry. Try again, or
                    contact support by emailing hi@oseh.com
                  </Text>
                </ContentContainer>
              );
            }

            const parts: ReactElement[] = [];
            chat.data.forEach((part) => {
              if (
                part.type === 'chat' &&
                part.display_author === 'self' &&
                part.data.type === 'textual'
              ) {
                if (parts.length > 0) {
                  parts.push(
                    <VerticalSpacer
                      height={0}
                      maxHeight={16}
                      flexGrow={1}
                      key={parts.length}
                    />
                  );
                }

                const textPartElements: ReactElement[] = [];
                part.data.parts.forEach((textPart) => {
                  if (textPart.type === 'paragraph') {
                    if (textPartElements.length > 0) {
                      textPartElements.push(
                        <VerticalSpacer
                          height={0}
                          maxHeight={24}
                          flexGrow={1}
                          key={textPartElements.length}
                        />
                      );
                    }

                    textPartElements.push(
                      <Text
                        key={textPartElements.length}
                        style={styles.paragraph}
                      >
                        {textPart.value}
                      </Text>
                    );
                  }
                });

                parts.push(
                  <ContentContainer
                    contentWidthVWC={ctx.contentWidth}
                    key={parts.length}
                  >
                    <View style={styles.selfMessage}>
                      <View style={styles.selfMessageText}>
                        {textPartElements}
                      </View>
                    </View>
                  </ContentContainer>
                );
              } else if (
                part.type === 'ui' &&
                part.data.type === 'ui' &&
                part.data.conceptually.type === 'user_journey'
              ) {
                if (parts.length > 0) {
                  parts.push(
                    <VerticalSpacer
                      height={0}
                      maxHeight={16}
                      flexGrow={1}
                      key={parts.length}
                    />
                  );
                }
                parts.push(
                  <ContentContainer
                    contentWidthVWC={ctx.contentWidth}
                    key={parts.length}
                  >
                    <JournalEntryViewJournalCard
                      uid={part.data.conceptually.journey_uid}
                      chat={chat}
                      ctx={ctx}
                    />
                  </ContentContainer>
                );
              } else if (
                part.type === 'reflection-question' &&
                part.data.type === 'textual'
              ) {
                part.data.parts.forEach((subPart, subPartIndex) => {
                  if (subPart.type !== 'paragraph') {
                    return;
                  }

                  if (parts.length > 0) {
                    parts.push(
                      <VerticalSpacer
                        height={0}
                        maxHeight={subPartIndex === 0 ? 16 : 12}
                        flexGrow={1}
                        key={parts.length}
                      />
                    );
                  }

                  parts.push(
                    <ContentContainer
                      contentWidthVWC={ctx.contentWidth}
                      key={parts.length}
                    >
                      <Text style={styles.reflectionQuestionText}>
                        {subPart.value}
                      </Text>
                    </ContentContainer>
                  );
                });
              } else if (
                part.type === 'reflection-response' &&
                part.data.type === 'textual'
              ) {
                part.data.parts.forEach((subPart, subPartIndex) => {
                  if (subPart.type !== 'paragraph') {
                    return;
                  }

                  if (parts.length > 0) {
                    parts.push(
                      <VerticalSpacer
                        height={0}
                        maxHeight={subPartIndex === 0 ? 16 : 12}
                        flexGrow={1}
                        key={parts.length}
                      />
                    );
                  }

                  parts.push(
                    <ContentContainer
                      contentWidthVWC={ctx.contentWidth}
                      key={parts.length}
                    >
                      <Text style={styles.reflectionResponseText}>
                        {subPart.value}
                      </Text>
                    </ContentContainer>
                  );
                });
              }
            });

            return (
              <>
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
        <VerticalSpacer height={0} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <TextStyleForwarder
            component={(styleVWC) => (
              <FilledInvertedButton
                onPress={() => {
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
                setTextStyle={(s) => setVWC(styleVWC, s)}
              >
                <RenderGuardedComponent
                  props={styleVWC}
                  component={(s) => (
                    <Text style={s}>{screen.parameters.cta.text}</Text>
                  )}
                />
              </FilledInvertedButton>
            )}
          />
        </ContentContainer>
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
