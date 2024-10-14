import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { OsehStyles } from '../../../../../shared/OsehStyles';
import { ScreenContext } from '../../../hooks/useScreenContext';
import { Arrow } from '../icons/Arrow';
import { JournalEntryItemTextualPartJourney } from '../lib/JournalChatState';
import { JournalCardTopBackgroundImage } from './JournalCardTopBackgroundImage';
import { styles } from './JournalChatJourneyCardStyles';
import { View, Text } from 'react-native';

export type JournalChatJourneyCardProps = {
  ctx: ScreenContext;
  journeyPart: JournalEntryItemTextualPartJourney;
};

/**
 * Renders a card for a journey within a journal chat. This looks clickable,
 * and should generally be wrapped in a button.
 */
export const JournalChatJourneyCard = (props: JournalChatJourneyCardProps) => {
  return (
    <View style={OsehStyles.layout.column}>
      <RenderGuardedComponent
        props={props.ctx.contentWidth}
        component={(cw) => (
          <View
            style={[
              OsehStyles.layout.stacking.container,
              { height: 120, width: cw },
            ]}
          >
            <JournalCardTopBackgroundImage
              uid={props.journeyPart.details.darkened_background.uid}
              jwt={props.journeyPart.details.darkened_background.jwt}
              ctx={props.ctx}
            />
            <View
              style={[
                OsehStyles.layout.stacking.child,
                OsehStyles.layout.column,
              ]}
            >
              {props.journeyPart.details.access === 'paid-requires-upgrade' && (
                <>
                  <VerticalSpacer height={0} maxHeight={16} flexGrow={1} />
                  <View style={OsehStyles.layout.row}>
                    <HorizontalSpacer width={0} flexGrow={1} />
                    <View style={styles.topForegroundPaid}>
                      <Text
                        style={[
                          OsehStyles.typography.detail1,
                          OsehStyles.colors.v4.primary.light,
                        ]}
                      >
                        Free Trial
                      </Text>
                    </View>
                    <HorizontalSpacer width={0} maxWidth={16} flexGrow={1} />
                  </View>
                </>
              )}
              <VerticalSpacer height={0} flexGrow={1} />
              <View style={OsehStyles.layout.row}>
                <HorizontalSpacer width={16} />
                <Text
                  style={[
                    OsehStyles.typography.title,
                    OsehStyles.colors.v4.primary.light,
                  ]}
                >
                  {props.journeyPart.details.title}
                </Text>
              </View>
              <VerticalSpacer height={2} />
              <View style={OsehStyles.layout.row}>
                <HorizontalSpacer width={16} />
                <Text
                  style={[
                    OsehStyles.typography.detail1,
                    OsehStyles.colors.v4.primary.light,
                  ]}
                >
                  {props.journeyPart.details.instructor.name}
                </Text>
              </View>
              <VerticalSpacer height={16} />
            </View>
          </View>
        )}
      />
      <View style={[styles.bottom, OsehStyles.layout.row]}>
        <Text
          style={[
            OsehStyles.typography.detail1,
            OsehStyles.colors.v4.primary.grey,
          ]}
        >
          {(() => {
            const inSeconds = props.journeyPart.details.duration_seconds;
            const minutes = Math.floor(inSeconds / 60);
            const seconds = Math.floor(inSeconds) % 60;

            return (
              <>
                {minutes}:{seconds < 10 ? '0' : ''}
                {seconds}
              </>
            );
          })()}
        </Text>
        <HorizontalSpacer width={0} flexGrow={1} />
        <Arrow />
      </View>
    </View>
  );
};
