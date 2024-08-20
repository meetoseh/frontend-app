import { Fragment, ReactElement, useMemo } from 'react';
import {
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { ScreenContext } from '../../../hooks/useScreenContext';
import { JournalEntry } from '../lib/JournalEntry';
import { styles } from './JournalEntryCardStyles';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import { useStyleVWC } from '../../../../../shared/hooks/useStyleVWC';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { JournalEntryViewJournalCard } from '../../journal_entry_view/components/JournalEntryViewJournalCard';
import { View, Text, Pressable } from 'react-native';
import { JournalEntryItemDataDataSummaryV1 } from '../../journal_chat/lib/JournalChatState';
import { TagText } from '../../journal_entry_summary/components/TagText';
import { Edit } from '../../../../../shared/components/icons/Edit';
import { OsehColors } from '../../../../../shared/OsehColors';

export type JournalEntryCardProps = {
  /** The journal entry to show */
  journalEntry: ValueWithCallbacks<JournalEntry>;

  /** The handler for when the card is clicked */
  onClick: () => void;

  /** The handler for when the edit button on the card is clicked */
  onEditClick: () => void;

  /** The screen context for resources etc */
  ctx: ScreenContext;
};

type AbridgedInfoVWC = {
  title: string;
  journey: { uid: string } | null;
  reflectionResponse: string | null;
  tags: string[];
};

/**
 * Displays a journal entry card as it would go on the My Journal page
 */
export const JournalEntryCard = ({
  journalEntry,
  onClick,
  onEditClick,
  ctx,
}: JournalEntryCardProps): ReactElement => {
  const cardStyleVWC = useMappedValueWithCallbacks(
    ctx.contentWidth,
    (contentWidth) => ({
      ...styles.card,
      width: contentWidth,
    })
  );
  const cardRefVWC = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(cardRefVWC, cardStyleVWC);

  const canonicalDateVWC = useMappedValueWithCallbacks(
    journalEntry,
    (je) => je.payload.canonicalAt,
    {
      outputEqualityFn: (a, b) => a.getTime() === b.getTime(),
    }
  );

  const innerContentWidthVWC = useMappedValueWithCallbacks(
    ctx.contentWidth,
    (contentWidth) => {
      return contentWidth - 32 /* padding */ - 2 /* border */;
    }
  );
  const innerScreenContext = useMemo(
    () => ({
      ...ctx,
      contentWidth: innerContentWidthVWC,
    }),
    [ctx, innerContentWidthVWC]
  );

  const abridgedVWC = useMappedValueWithCallbacks(
    journalEntry,
    (je): AbridgedInfoVWC | null => {
      let summary: JournalEntryItemDataDataSummaryV1 | null = null;
      let journey: { uid: string } | null = null;
      let reflectionResponse: string | null = null;

      for (const item of je.payload.items) {
        if (item.type === 'summary' && item.data.type === 'summary') {
          summary = item.data;
        } else if (
          item.type === 'ui' &&
          item.data.type === 'ui' &&
          item.data.conceptually.type === 'user_journey'
        ) {
          journey = { uid: item.data.conceptually.journey_uid };
        } else if (
          item.type === 'reflection-response' &&
          item.data.type === 'textual' &&
          item.data.parts.length > 0 &&
          item.data.parts[0].type === 'paragraph'
        ) {
          reflectionResponse = item.data.parts[0].value;
        }
      }

      if (summary !== null) {
        return {
          title: summary.title,
          journey,
          tags: summary.tags,
          reflectionResponse,
        };
      }

      return null;
    }
  );

  const editableVWC = useMappedValueWithCallbacks(
    journalEntry,
    (je): boolean => {
      for (const item of je.payload.items) {
        if (item.type === 'reflection-response') {
          return true;
        }
      }
      return false;
    }
  );

  const editIconButton = (
    <Pressable
      onPress={() => {
        onEditClick();
      }}
    >
      <Edit
        icon={{
          height: 18,
        }}
        container={{
          width: 40,
          height: 40,
        }}
        startPadding={{
          x: {
            fixed: 14,
          },
          y: {
            fixed: 14,
          },
        }}
        color={OsehColors.v4.primary.light}
      />
    </Pressable>
  );

  return (
    <View style={styles.centered}>
      <Pressable
        onPress={onClick}
        style={cardStyleVWC.get()}
        ref={(r) => setVWC(cardRefVWC, r)}
      >
        <VerticalSpacer height={16} />
        <View style={styles.row}>
          <HorizontalSpacer width={16} />
          <RenderGuardedComponent
            props={canonicalDateVWC}
            component={(date) => {
              return (
                <Text style={styles.dateTimeText}>
                  {date.toLocaleDateString()}
                </Text>
              );
            }}
          />
          <HorizontalSpacer width={0} flexGrow={1} />
          <RenderGuardedComponent
            props={canonicalDateVWC}
            component={(date) => {
              return (
                <Text style={styles.dateTimeText}>
                  {date.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              );
            }}
          />
          <HorizontalSpacer width={16} />
        </View>
        <RenderGuardedComponent
          props={abridgedVWC}
          component={(abridged) =>
            abridged === null ? (
              <>
                <VerticalSpacer height={20} />
                <RenderGuardedComponent
                  props={journalEntry}
                  component={(entry) => {
                    const items: ReactElement[] = [];

                    entry.payload.items.forEach((item) => {
                      if (
                        item.type === 'chat' &&
                        item.display_author === 'self' &&
                        item.data.type === 'textual'
                      ) {
                        for (const subPart of item.data.parts) {
                          if (subPart.type !== 'paragraph') {
                            continue;
                          }
                          if (items.length > 0) {
                            items.push(
                              <VerticalSpacer height={16} key={items.length} />
                            );
                          }
                          items.push(
                            <View style={styles.row} key={items.length}>
                              <HorizontalSpacer width={16} />
                              <Text style={styles.header}>{subPart.value}</Text>
                              <HorizontalSpacer width={16} />
                            </View>
                          );
                        }
                        return;
                      } else if (
                        item.type === 'ui' &&
                        item.data.type === 'ui' &&
                        item.data.conceptually.type === 'user_journey'
                      ) {
                        if (items.length > 0) {
                          items.push(
                            <VerticalSpacer height={16} key={items.length} />
                          );
                        }

                        items.push(
                          <View style={styles.row} key={items.length}>
                            <HorizontalSpacer width={0} flexGrow={1} />
                            <JournalEntryViewJournalCard
                              uid={item.data.conceptually.journey_uid}
                              chat={{
                                uid: entry.uid,
                                integrity: '',
                                data: entry.payload.items,
                                transient: undefined,
                              }}
                              ctx={innerScreenContext}
                            />
                            <HorizontalSpacer width={0} flexGrow={1} />
                          </View>
                        );
                      } else if (
                        item.type === 'reflection-response' &&
                        item.data.type === 'textual'
                      ) {
                        for (const subPart of item.data.parts) {
                          if (subPart.type !== 'paragraph') {
                            continue;
                          }
                          if (items.length > 0) {
                            items.push(
                              <VerticalSpacer height={16} key={items.length} />
                            );
                          }
                          items.push(
                            <View style={styles.row} key={items.length}>
                              <HorizontalSpacer width={16} />
                              <Text style={styles.body}>{subPart.value}</Text>
                              <HorizontalSpacer width={16} />
                            </View>
                          );
                        }
                        return;
                      } else if (
                        item.type === 'summary' &&
                        item.data.type === 'summary'
                      ) {
                        if (items.length > 0) {
                          items.push(
                            <VerticalSpacer height={16} key={items.length} />
                          );
                        }
                        items.push(
                          <View style={styles.row} key={items.length}>
                            <HorizontalSpacer width={16} />
                            <Text style={styles.header}>{item.data.title}</Text>
                            <HorizontalSpacer width={16} />
                          </View>
                        );

                        if (item.data.tags.length > 0) {
                          items.push(
                            <View style={styles.rowWrap} key={items.length}>
                              <HorizontalSpacer width={16} />
                              {item.data.tags.map((tag, i) => (
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
                              <HorizontalSpacer width={16} flexGrow={1} />
                            </View>
                          );
                        }
                      }
                    });

                    return <>{items}</>;
                  }}
                />
                <VerticalSpacer height={16} flexGrow={1} />
                <RenderGuardedComponent
                  props={editableVWC}
                  component={(editable) =>
                    !editable ? (
                      <></>
                    ) : (
                      <View style={styles.row}>
                        <HorizontalSpacer width={0} flexGrow={1} />
                        {editIconButton}
                        <HorizontalSpacer width={16} />
                      </View>
                    )
                  }
                />
                <VerticalSpacer height={16} />
              </>
            ) : (
              <>
                <VerticalSpacer height={20} />
                <View style={styles.row}>
                  <HorizontalSpacer width={16} />
                  <Text style={styles.header}>{abridged.title}</Text>
                  <HorizontalSpacer width={16} />
                </View>
                {abridged.journey !== null && (
                  <>
                    <VerticalSpacer height={16} />
                    <View style={styles.row}>
                      <HorizontalSpacer width={0} flexGrow={1} />
                      <RenderGuardedComponent
                        props={journalEntry}
                        component={(journalEntry) =>
                          abridged === null || abridged.journey === null ? (
                            <></>
                          ) : (
                            <JournalEntryViewJournalCard
                              uid={abridged.journey.uid}
                              chat={{
                                uid: journalEntry.uid,
                                integrity: '',
                                data: journalEntry.payload.items,
                                transient: undefined,
                              }}
                              ctx={innerScreenContext}
                            />
                          )
                        }
                      />
                      <HorizontalSpacer width={0} flexGrow={1} />
                    </View>
                  </>
                )}
                <VerticalSpacer height={16} />
                <View style={styles.row}>
                  <HorizontalSpacer width={16} />
                  <Text
                    style={styles.abridgedBody}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {abridged.reflectionResponse}
                  </Text>
                  <HorizontalSpacer width={16} />
                </View>
                <VerticalSpacer height={0} flexGrow={1} />
                <View style={styles.row}>
                  <HorizontalSpacer width={16} />
                  <View style={[styles.column, styles.growWithNoBasis]}>
                    <VerticalSpacer height={16} flexGrow={1} />
                    <View style={[styles.rowWrap, { gap: 16 }]}>
                      {abridged.tags.map((tag, i) => (
                        <View style={styles.tag} key={i}>
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
                      ))}
                    </View>
                    <VerticalSpacer height={0} flexGrow={1} />
                  </View>
                  <View style={styles.column}>
                    <VerticalSpacer height={10} flexGrow={1} />
                    {editIconButton}
                  </View>
                  <HorizontalSpacer width={16} />
                </View>
                <VerticalSpacer height={16} />
              </>
            )
          }
        />
      </Pressable>
    </View>
  );
};
