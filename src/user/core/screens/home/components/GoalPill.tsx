import { View, Text, Pressable } from 'react-native';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import { ValueWithCallbacks } from '../../../../../shared/lib/Callbacks';
import { StreakInfo } from '../../../../journey/models/StreakInfo';
import { VisualGoal, VisualGoalState } from './VisualGoal';
import { styles } from './GoalPillStyles';
import { SimpleBlurView } from '../../../../../shared/components/SimpleBlurView';

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
    <View style={styles.goal}>
      <SimpleBlurView
        style={styles.goalBackground}
        intensity={4}
        experimentalBlurMethod="dimezisBlurView"
        androidTechnique={{
          type: 'color',
          color: '#0593914d',
        }}
      />
      <View style={styles.goalVisual}>
        <View style={styles.goalVisualBackground}>
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
        <View style={styles.goalVisualForeground}>
          <RenderGuardedComponent
            props={useMappedValueWithCallbacks(
              streak,
              (s) => s?.daysOfWeek?.length ?? 0
            )}
            component={(days) => (
              <View style={styles.goalVisualTextWrapper}>
                <Text style={styles.goalVisualTextInner}>{days}</Text>
              </View>
            )}
          />
        </View>
      </View>
      <Pressable
        style={[styles.goalSection, styles.goalSectionGoal]}
        onPress={() => {
          updateGoal();
        }}
      >
        <Text style={styles.goalSectionTitle}>Goal</Text>
        <RenderGuardedComponent
          props={streak}
          component={(streak) => (
            <Text style={styles.goalSectionValue}>
              {streak === null || streak.goalDaysPerWeek === null
                ? 'TBD'
                : `${streak.daysOfWeek.length} of ${streak.goalDaysPerWeek}`}
            </Text>
          )}
        />
      </Pressable>
      <View style={styles.goalSection}>
        <Text style={styles.goalSectionTitle}>Streak</Text>
        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(
            streak,
            (s) => s?.streak?.toLocaleString() ?? '?'
          )}
          component={(days) => (
            <Text style={styles.goalSectionValue}>
              {days} day{days === '1' ? '' : 's'}
            </Text>
          )}
        />
      </View>
    </View>
  );
};
