import { ReactElement } from 'react';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { Check } from '../../../../../shared/components/icons/Check';
import { HeartFilled } from '../../../../../shared/components/icons/HeartFilled';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import {
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { formatDurationClock } from '../../../../../shared/lib/networkResponseUtils';
import { OsehColors } from '../../../../../shared/OsehColors';
import { SearchPublicJourney } from '../lib/SearchPublicJourney';
import { styles } from './LibraryCardStyles';
import { useStyleVWC } from '../../../../../shared/hooks/useStyleVWC';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { View, Text, Pressable } from 'react-native';

export type LibraryCardParams = {
  /** The width for this component */
  width: ValueWithCallbacks<number>;
  /** The public journey to show */
  item: ValueWithCallbacks<SearchPublicJourney>;
  /** The function to call when this journey is clicked */
  onClick: () => void;
};

export const LibraryCard = ({
  item: itemVWC,
  width: widthVWC,
  onClick,
}: LibraryCardParams): ReactElement => {
  const titleVWC = useMappedValueWithCallbacks(itemVWC, (i) => i.title);
  const instructorNameVWC = useMappedValueWithCallbacks(
    itemVWC,
    (i) => i.instructor.name
  );
  const osehPlusBadgeVWC = useMappedValueWithCallbacks(
    itemVWC,
    () => itemVWC.get().requiresPro
  );
  const takenBadgeVWC = useMappedValueWithCallbacks(
    itemVWC,
    (i): 'heart' | 'check' | 'none' =>
      i.likedAt ? 'heart' : i.lastTakenAt ? 'check' : 'none'
  );
  const durationVWC = useMappedValueWithCallbacks(itemVWC, (i) =>
    formatDurationClock(i.durationSeconds, {
      minutes: true,
      seconds: true,
      milliseconds: false,
    })
  );

  const buttonRef = useWritableValueWithCallbacks<View | null>(() => null);
  const buttonStyleVWC = useMappedValueWithCallbacks(widthVWC, (w) => ({
    width: w,
  }));
  useStyleVWC(buttonRef, buttonStyleVWC);

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        onClick();
      }}
      ref={(r) => setVWC(buttonRef, r)}
    >
      <View style={styles.row}>
        <HorizontalSpacer width={16} />
        <View style={[styles.column, styles.growNoBasis]}>
          <VerticalSpacer height={16} />
          <RenderGuardedComponent
            props={titleVWC}
            component={(title) => <Text style={styles.title}>{title}</Text>}
          />
          <VerticalSpacer height={2} />
          <RenderGuardedComponent
            props={instructorNameVWC}
            component={(instructorName) => (
              <Text style={styles.instructor}>{instructorName}</Text>
            )}
          />
          <VerticalSpacer height={16} />
        </View>
        <RenderGuardedComponent
          props={osehPlusBadgeVWC}
          component={(pro) =>
            !pro ? (
              <></>
            ) : (
              <>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Oseh+</Text>
                </View>
                <HorizontalSpacer width={12} />
              </>
            )
          }
        />
        <RenderGuardedComponent
          props={takenBadgeVWC}
          component={(takenBadge) => (
            <>
              {takenBadge === 'check' && (
                <Check
                  icon={{
                    height: 20,
                  }}
                  container={{
                    width: 40,
                    height: 40,
                  }}
                  startPadding={{
                    x: {
                      fraction: 0.5,
                    },
                    y: {
                      /** looks more centered */
                      fixed: 8,
                    },
                  }}
                  color={OsehColors.v4.primary.light}
                />
              )}
              {takenBadge === 'heart' && (
                <HeartFilled
                  icon={{
                    width: 20,
                  }}
                  container={{
                    width: 40,
                    height: 40,
                  }}
                  startPadding={{
                    x: {
                      fraction: 0.5,
                    },
                    y: {
                      fraction: 0.5,
                    },
                  }}
                  color={OsehColors.v4.other.green}
                />
              )}
            </>
          )}
        />
        <RenderGuardedComponent
          props={durationVWC}
          component={(duration) => (
            <Text style={styles.duration}>{duration}</Text>
          )}
        />
        <HorizontalSpacer width={16} />
      </View>
    </Pressable>
  );
};
