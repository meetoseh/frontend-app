import { Fragment, ReactElement } from 'react';
import { ScreenContext } from '../../../hooks/useScreenContext';
import {
  JournalChatState,
  JournalEntryItemData,
  JournalEntryItemTextualPart,
  JournalEntryItemTextualPartJourney,
} from '../lib/JournalChatState';
import { styles } from './JournalChatPartsStyles';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { OsehStyles } from '../../../../../shared/OsehStyles';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { TagText } from '../../journal_entry_summary/components/TagText';
import { JournalChatJourneyCard } from './JournalChatJourneyCard';
import { TextPartVoiceNoteComponent } from './TextPartVoiceNoteComponent';
import { ContentContainer } from '../../../../../shared/components/ContentContainer';
import { JournalEntryViewJournalCard } from './JournalEntryViewJournalCard';
import {
  View,
  Text,
  Pressable,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';

export type JournalChatPartsProps = {
  /** The general screen context for e.g. the content width and login context */
  ctx: ScreenContext;
  /**
   * A function which can be used to try and get a newer chat reference. Return
   * null if the chat is no longer needed, undefined if it is needed but an
   * error occurred.
   */
  refreshChat: () => Promise<JournalChatState | null | undefined>;
  /**
   * The current journal chat state
   */
  chat: JournalChatState;
  /**
   * Called if the user clicks on one of the journey buttons
   */
  onGotoJourney: (
    part: JournalEntryItemTextualPartJourney,
    partIndex: number,
    e: GestureResponderEvent
  ) => void;

  /** If specified, if the part doesn't pass this predicate (via return true), it is skipped */
  partFilter?: (part: JournalEntryItemData, partIndex: number) => boolean;

  /**
   * If specified, if the subpart doesn't pass this predicate (via return true), it is skipped
   */
  textualSubPartFilter?: (
    part: JournalEntryItemData,
    partIndex: number,
    subpart: JournalEntryItemTextualPart,
    subpartIndex: number
  ) => boolean;
};

/**
 * Renders the messages within a journal chat.
 */
export const JournalChatParts = ({
  ctx,
  refreshChat,
  chat,
  onGotoJourney,
  partFilter,
  textualSubPartFilter,
}: JournalChatPartsProps) => {
  const parts: ReactElement[] = [];
  chat.data.forEach((part, partIndex) => {
    if (partFilter !== undefined && !partFilter(part, partIndex)) {
      return;
    }

    const subparts: ReactElement[] = [];
    if (part.data.type === 'summary') {
      subparts.push(
        <Fragment key={subparts.length}>
          <Text
            style={[
              OsehStyles.typography.titleSemibold,
              OsehStyles.colors.v4.primary.light,
            ]}
          >
            {part.data.title}
          </Text>
          <VerticalSpacer height={4} />
          <View>
            {part.data.tags.map((tag, tagIndex) => (
              <Fragment key={tagIndex}>
                {tagIndex > 0 && <HorizontalSpacer width={16} />}
                <View style={OsehStyles.layout.column}>
                  <VerticalSpacer height={16} />
                  <View style={styles.tag}>
                    <View style={OsehStyles.layout.column}>
                      <VerticalSpacer height={5} />
                      <View style={OsehStyles.layout.row}>
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
        </Fragment>
      );
    } else if (part.data.type === 'textual') {
      part.data.parts.forEach((subPart, subPartIndex) => {
        const realPart = ((key) => {
          if (
            textualSubPartFilter !== undefined &&
            !textualSubPartFilter(part, partIndex, subPart, subPartIndex)
          ) {
            return undefined;
          }

          if (subPart.type === 'paragraph') {
            return (
              <Text
                key={key}
                style={[
                  part.display_author === 'self' ||
                  (part.type === 'chat' && partIndex !== 0)
                    ? OsehStyles.typography.body
                    : OsehStyles.typography.titleSemibold,
                  OsehStyles.colors.v4.primary.light,
                ]}
              >
                {subPart.value}
              </Text>
            );
          } else if (subPart.type === 'journey') {
            return (
              <Pressable
                key={key}
                style={OsehStyles.unstyling.buttonAsColumn}
                onPress={(e) => onGotoJourney(subPart, partIndex, e)}
              >
                <JournalChatJourneyCard ctx={ctx} journeyPart={subPart} />
              </Pressable>
            );
          } else if (subPart.type === 'voice_note') {
            return (
              <TextPartVoiceNoteComponent
                key={key}
                ctx={ctx}
                refreshChat={refreshChat}
                part={subPart}
              />
            );
          }
        })(`${subparts.length}-${subPartIndex}`);
        if (realPart === undefined) {
          return;
        }
        if (subparts.length > 0) {
          subparts.push(<VerticalSpacer key={subparts.length} height={16} />);
        }
        subparts.push(realPart);
      });
    } else if (
      part.data.type === 'ui' &&
      part.data.conceptually.type === 'user_journey'
    ) {
      subparts.push(
        <ContentContainer
          key={subparts.length}
          contentWidthVWC={ctx.contentWidth}
        >
          <JournalEntryViewJournalCard
            uid={part.data.conceptually.journey_uid}
            chat={chat}
            ctx={ctx}
          />
        </ContentContainer>
      );
    }

    if (subparts.length > 0) {
      if (parts.length > 0) {
        parts.push(<VerticalSpacer key={parts.length} height={16} />);
      }

      const partStyles: ViewStyle[] = [];
      if (part.display_author === 'self') {
        partStyles.push(styles.author__self);
      } else if (part.display_author === 'other') {
        partStyles.push(styles.author__other);
      }

      if (part.type === 'ui') {
        partStyles.push(styles.type__ui);
      }
      parts.push(
        <View key={parts.length} style={partStyles}>
          {subparts}
        </View>
      );
    }
  });
  return <>{parts}</>;
};
