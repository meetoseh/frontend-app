import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { CheckFilled } from '../../../../../shared/components/icons/CheckFilled';
import { Streak } from '../../../../../shared/components/icons/Streak';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import { ValueWithCallbacks } from '../../../../../shared/lib/Callbacks';
import { OsehColors } from '../../../../../shared/OsehColors';
import { StreakInfo } from '../../../../journey/models/StreakInfo';
import { VisualGoal, VisualGoalState } from '../../home/components/VisualGoal';
import { styles } from './GoalPillV4Styles';
import { View, Pressable, Text } from 'react-native';

/**
 * The standard goal pill which visually indicates the users streak information
 */
export const GoalPill = ({
  streak,
  updateGoal,
}: {
  streak: ValueWithCallbacks<StreakInfo | null>;
  updateGoal: () => void;
}) => {
  return (
    <View style={styles.row}>
      <View style={Object.assign({}, styles.vstack, { width: 64, height: 64 })}>
        <View style={styles.vstackItem}>
          <VisualGoal
            state={useMappedValueWithCallbacks(
              streak,
              (streak): VisualGoalState => ({
                filled: streak?.daysOfWeek?.length ?? 0,
                goal: streak?.goalDaysPerWeek ?? 3,
              })
            )}
          />
        </View>
        <View style={styles.vstackItem}>
          <RenderGuardedComponent
            props={useMappedValueWithCallbacks(
              streak,
              (s) => s?.daysOfWeek?.length ?? 0
            )}
            component={(days) => (
              <Text style={styles.goalVisualText}>{days}</Text>
            )}
          />
        </View>
      </View>
      <HorizontalSpacer width={24} />
      <View style={styles.streakAndGoal}>
        <View style={styles.row}>
          <HorizontalSpacer width={24} />
          <View style={styles.column}>
            <VerticalSpacer height={12} />
            <View style={styles.row}>
              <Streak
                icon={{
                  height: 12,
                }}
                container={{
                  width: 16,
                  height: 17,
                }}
                startPadding={{
                  x: {
                    fraction: 0.5,
                  },
                  y: {
                    fraction: 0.5,
                  },
                }}
                color={OsehColors.v4.primary.smoke}
              />
              <HorizontalSpacer width={4} />
              <Text style={styles.sectionTitle}>Streak</Text>
            </View>
            <RenderGuardedComponent
              props={useMappedValueWithCallbacks(
                streak,
                (s) => s?.streak?.toLocaleString() ?? '?'
              )}
              component={(days) => (
                <Text style={styles.sectionValue}>
                  {days} day{days === '1' ? '' : 's'}
                </Text>
              )}
            />
            <VerticalSpacer height={12} />
          </View>
          <HorizontalSpacer width={36} />
          <Pressable
            onPress={() => {
              updateGoal();
            }}
            style={styles.column}
          >
            <VerticalSpacer height={12} />
            <View style={styles.row}>
              <CheckFilled
                icon={{
                  height: 12,
                }}
                container={{
                  width: 16,
                  height: 17,
                }}
                startPadding={{
                  x: {
                    fraction: 0.5,
                  },
                  y: {
                    fraction: 0.5,
                  },
                }}
                color={OsehColors.v4.primary.smoke}
              />
              <HorizontalSpacer width={4} />
              <Text style={styles.sectionTitle}>Goal</Text>
            </View>
            <RenderGuardedComponent
              props={streak}
              component={(streak) => (
                <Text style={styles.sectionValue}>
                  {streak === null || streak.goalDaysPerWeek === null
                    ? 'TBD'
                    : `${streak.daysOfWeek.length} of ${streak.goalDaysPerWeek}`}
                </Text>
              )}
            />
            <VerticalSpacer height={12} />
          </Pressable>
          <HorizontalSpacer width={24} />
        </View>
      </View>
    </View>
  );
};
