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
import { JournalEntryViewJournalCard } from '../journal_chat/components/JournalEntryViewJournalCard';
import { View, Text } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { setVWC } from '../../../../shared/lib/setVWC';
import { JournalChatParts } from '../journal_chat/components/JournalChatParts';
import { JournalChatSpinners } from '../journal_chat/components/JournalChatSpinners';

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
        <VerticalSpacer height={40} />
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
        <VerticalSpacer height={24} />
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

            return (
              <ContentContainer contentWidthVWC={ctx.contentWidth}>
                <JournalChatParts
                  ctx={ctx}
                  refreshChat={resources.refreshJournalEntry}
                  chat={chat}
                  onGotoJourney={(_part, _partIndex, e) => {
                    e.preventDefault();
                  }}
                  partFilter={(part, _partIndex) => part.type !== 'summary'}
                  textualSubPartFilter={(
                    part,
                    partIndex,
                    _subPart,
                    _subPartIndex
                  ) =>
                    part.display_author === 'self' ||
                    (part.type === 'chat' && partIndex === 0) ||
                    part.type === 'reflection-question'
                  }
                />
                {chat.transient !== null && chat.transient !== undefined ? (
                  <VerticalSpacer height={32} />
                ) : null}
                <JournalChatSpinners ctx={ctx} chat={chat} />
              </ContentContainer>
            );
          }}
        />
        <VerticalSpacer height={16} flexGrow={1} />
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
