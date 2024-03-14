import { ReactElement, useCallback, useContext, useMemo } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { HomeScreenResources } from './HomeScreenResources';
import { HomeScreenState } from './HomeScreenState';
import { View, Text, StyleProp, ViewStyle, Platform } from 'react-native';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { Emotion } from '../pickEmotionJourney/Emotion';
import { useAnimationTargetAndRendered } from '../../../../shared/anim/useAnimationTargetAndRendered';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import {
  BezierAnimator,
  TrivialAnimator,
} from '../../../../shared/anim/AnimationLoop';
import { ease } from '../../../../shared/lib/Bezier';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { VisualGoalState } from './components/VisualGoal';
import { styles } from './HomeScreenStyles';
import { FullscreenView } from '../../../../shared/components/FullscreenView';
import { OsehImageFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { StatusBar } from 'expo-status-bar';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { MyProfilePicture } from '../../../../shared/components/MyProfilePicture';
import { DAYS_OF_WEEK } from '../../../../shared/models/DayOfWeek';
import { BlurView, BlurViewProps } from 'expo-blur';

/**
 * Displays the home screen for the user
 */
export const HomeScreen = ({
  state,
  resources,
}: FeatureComponentProps<
  HomeScreenState,
  HomeScreenResources
>): ReactElement => {
  const currentDate = useMemo(() => new Date(), []);
  const greeting = useMemo(() => {
    const hour = currentDate.getHours();
    if (hour >= 3 && hour < 12) {
      return <>Good Morning</>;
    } else if (hour >= 12 && hour < 17) {
      return <>Good Afternoon</>;
    } else {
      return <>Good Evening</>;
    }
  }, [currentDate]);
  const loginContextRaw = useContext(LoginContext);
  const nameVWC = useMappedValueWithCallbacks(
    loginContextRaw.value,
    (loginContextUnch) => {
      if (loginContextUnch.state !== 'logged-in') {
        return <></>;
      }
      const loginContext = loginContextUnch;
      const name = loginContext.userAttributes.givenName;
      if (
        name === null ||
        name.toLowerCase() === 'anonymous' ||
        name.toLowerCase() === 'there'
      ) {
        return <></>;
      }
      if (name.startsWith('Guest-')) {
        return <>, Guest</>;
      }
      return <>, {loginContext.userAttributes.givenName}</>;
    }
  );

  const backgroundImageVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.backgroundImage
  );
  const headerAndGoalDynamicStyle = useMappedValueWithCallbacks(
    backgroundImageVWC,
    (bknd) => ({ width: bknd.displayWidth, height: bknd.displayHeight })
  );

  const headerAndGoalRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  useValuesWithCallbacksEffect(
    [headerAndGoalRef, headerAndGoalDynamicStyle],
    () => {
      const ele = headerAndGoalRef.get();
      if (ele !== null) {
        ele.setNativeProps({ style: headerAndGoalDynamicStyle.get() });
      }
      return undefined;
    }
  );

  const headerDynamicStyle = useMappedValueWithCallbacks(
    backgroundImageVWC,
    (bknd) => ({ width: Math.min(bknd.displayWidth, 438) })
  );
  const headerRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([headerRef, headerDynamicStyle], () => {
    const ele = headerRef.get();
    if (ele !== null) {
      ele.setNativeProps({ style: headerDynamicStyle.get() });
    }
    return undefined;
  });

  const goalWrapperRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([goalWrapperRef, headerDynamicStyle], () => {
    const ele = goalWrapperRef.get();
    if (ele !== null) {
      ele.setNativeProps({ style: headerDynamicStyle.get() });
    }
    return undefined;
  });

  const windowSizeVWC = useWindowSizeValueWithCallbacks();

  const estimatedEmotionsHeightVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, backgroundImageVWC],
    () => {
      const windowSize = windowSizeVWC.get();
      const backgroundImage = backgroundImageVWC.get();

      return (
        windowSize.height -
        backgroundImage.displayHeight -
        28 /* question <-> bknd margin */ -
        24 /* question */ -
        28 /* question <-> emotion margin */ -
        24 /* emotion <-> bottom nav margin */ -
        67 /* bottom nav */
      );
    }
  );

  const emotionsHeightVWC = useWritableValueWithCallbacks<number>(() =>
    estimatedEmotionsHeightVWC.get()
  );

  const numberOfEmotionRowsVWC = useMappedValueWithCallbacks(
    emotionsHeightVWC,
    (h) => Math.min(4, Math.floor(h / 76))
  );
  const emotionsVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.emotions.result ?? [],
    {
      outputEqualityFn: (a, b) =>
        a.length === b.length && a.every((v, i) => v.word === b[i].word),
    }
  );
  const emotionRowsVWC = useMappedValuesWithCallbacks(
    [emotionsVWC, numberOfEmotionRowsVWC],
    (): Emotion[][] => {
      const emotions = emotionsVWC.get();
      const rows = numberOfEmotionRowsVWC.get();

      const numPerRow = Math.ceil(emotions.length / rows);
      if (numPerRow === 0) {
        return [];
      }

      const result: Emotion[][] = [];
      for (let i = 0; i < rows; i++) {
        result.push(emotions.slice(i * numPerRow, (i + 1) * numPerRow));
      }

      // iteratively fix jumps of 2 or more by moving emotions
      // from earlier rows to later rows; this has to end at
      // some point because each step moves an emotion from row
      // i to i+1, and this can only occur at most the number of
      // rows - 1 time per emotion, and there are finitely many
      // emotions. in practice, it usually does at most 1 iteration
      while (true) {
        let foundImprovement = false;
        for (let i = 0; i < rows - 1; i++) {
          if (result[i].length - result[i + 1].length > 1) {
            const toMove = result[i].pop()!;
            result[i + 1].unshift(toMove);
            foundImprovement = true;
          }
        }
        if (!foundImprovement) {
          break;
        }
      }

      return result;
    }
  );

  const streakInfoVWC = useMappedValueWithCallbacks(state, (s) => s.streakInfo);
  const visualGoalStateVWC = useAnimationTargetAndRendered<VisualGoalState>(
    () => ({
      filled: 0,
      goal: streakInfoVWC.get().result?.goalDaysPerWeek ?? 3,
    }),
    () => [
      new BezierAnimator(
        ease,
        350,
        (p) => p.filled,
        (p, v) => (p.filled = v)
      ),
      new TrivialAnimator('goal'),
    ]
  );

  const handleEmotionClick = useCallback((emotion: Emotion) => {
    resources.get().startGotoEmotion(emotion)();
  }, []);

  useValueWithCallbacksEffect(streakInfoVWC, (streakInfo) => {
    setVWC(
      visualGoalStateVWC.target,
      {
        filled: streakInfo.result?.daysOfWeek.length ?? 0,
        goal: streakInfo.result?.goalDaysPerWeek ?? 3,
      },
      (a, b) => a.filled === b.filled && a.goal === b.goal
    );
    return undefined;
  });

  return (
    <FullscreenView style={styles.container}>
      <View style={styles.background}>
        <OsehImageFromStateValueWithCallbacks state={backgroundImageVWC} />
        <View style={styles.backgroundOverlay}>
          <SvgLinearGradient
            state={{
              stop1: {
                color: [1, 1, 1, 1],
                offset: 0,
              },
              stop2: {
                color: [20, 25, 28, 1],
                offset: 1,
              },
              x1: 0.5,
              y1: 0,
              x2: 0.5,
              y2: 1,
            }}
          />
        </View>
      </View>
      <View style={styles.foreground}>
        <View
          style={styles.headerAndGoal}
          ref={(r) => setVWC(headerAndGoalRef, r)}
        >
          <View style={styles.header} ref={(r) => setVWC(headerRef, r)}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                {greeting}
                <RenderGuardedComponent props={nameVWC} component={(v) => v} />!
                👋
              </Text>
              <View style={styles.headerProfilePicture}>
                <MyProfilePicture
                  displayWidth={32}
                  displayHeight={32}
                  imageHandler={resources.get().imageHandler}
                  style={styles.headerProfilePictureImg}
                />
              </View>
            </View>
            <Text style={styles.headerBody}>
              <RenderGuardedComponent
                props={streakInfoVWC}
                component={(v) => (
                  <>
                    You’ve meditated{' '}
                    <Text style={styles.headerBodyStrong}>
                      {v.type === 'success'
                        ? numberToWord[v.result.daysOfWeek.length]
                        : '?'}
                    </Text>{' '}
                    time{v.result?.daysOfWeek.length === 1 ? '' : 's'} this
                    week.
                    {(() => {
                      if (v.type !== 'success') {
                        return;
                      }
                      const goal = v.result.goalDaysPerWeek;
                      if (goal === null) {
                        return;
                      }

                      if (v.result.daysOfWeek.length >= goal) {
                        return (
                          <>
                            {' '}
                            You’ve met your goal of {goal.toLocaleString()} day
                            {goal === 1 ? '' : 's'} for this week!
                          </>
                        );
                      }

                      const currentDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
                      let daysRemainingInWeek = 7 - currentDayOfWeek;
                      const currentDayOfWeekName =
                        DAYS_OF_WEEK[(currentDayOfWeek + 6) % 7];
                      if (v.result.daysOfWeek.includes(currentDayOfWeekName)) {
                        daysRemainingInWeek--;
                      }
                      const requiredDays = goal - v.result.daysOfWeek.length;
                      if (requiredDays > daysRemainingInWeek) {
                        return;
                      }

                      return (
                        <>
                          {' '}
                          You can still make your goal of{' '}
                          {goal.toLocaleString()} days this week.
                        </>
                      );
                    })()}
                  </>
                )}
              />
            </Text>
          </View>
          <View
            style={styles.goalWrapper}
            ref={(r) => setVWC(goalWrapperRef, r)}
          >
            <BlurView
              style={{ width: 200, height: 50 }}
              experimentalBlurMethod="dimezisBlurView"
            ></BlurView>
          </View>
        </View>
      </View>
      <StatusBar style="light" />
    </FullscreenView>
  );
};

const numberToWord: Record<number, string> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
};
