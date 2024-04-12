import { ReactElement, useCallback, useContext, useMemo } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { HomeScreenResources } from './HomeScreenResources';
import { HomeScreenState } from './HomeScreenState';
import {
  View,
  Text,
  Platform,
  Pressable,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useAnimationTargetAndRendered } from '../../../../shared/anim/useAnimationTargetAndRendered';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import {
  BezierAnimator,
  TrivialAnimator,
} from '../../../../shared/anim/AnimationLoop';
import { ease } from '../../../../shared/lib/Bezier';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { VisualGoal, VisualGoalState } from './components/VisualGoal';
import { styles } from './HomeScreenStyles';
import { OsehImageFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { StatusBar } from 'expo-status-bar';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { MyProfilePicture } from '../../../../shared/components/MyProfilePicture';
import { DAYS_OF_WEEK } from '../../../../shared/models/DayOfWeek';
import { SimpleBlurView } from '../../../../shared/components/SimpleBlurView';
import { convertLogicalWidthToPhysicalWidth } from '../../../../shared/images/DisplayRatioHelper';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { BottomNavBar } from '../../../bottomNav/BottomNavBar';
import { styles as bottomNavStyles } from '../../../bottomNav/BottomNavBarStyles';
import { Emotion } from '../../../../shared/models/Emotion';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import { useDynamicAnimationEngine } from '../../../../shared/anim/useDynamicAnimation';
import {
  useAttachDynamicEngineToTransition,
  useEntranceTransition,
  useOsehTransition,
  useSetTransitionReady,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import { DARK_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { createCancelablePromiseFromCallbacks } from '../../../../shared/lib/createCancelablePromiseFromCallbacks';

export type HomeScreenTransition =
  | { type: 'fade'; ms: number }
  | { type: 'none'; ms: number };

/**
 * Displays the home screen for the user
 */
export const HomeScreen = ({
  state,
  resources,
  tutorial,
}: FeatureComponentProps<HomeScreenState, HomeScreenResources> & {
  tutorial?: {
    step: ValueWithCallbacks<'explain_top' | 'explain_bottom'>;
    onNextStep: () => void;
  };
}): ReactElement => {
  const transition = useTransitionProp((): HomeScreenTransition => {
    if (tutorial === undefined) {
      const req = state.get().nextEnterTransition;
      if (req !== undefined) {
        return req;
      }
    }
    return { type: 'fade', ms: 700 };
  });
  useEntranceTransition(transition);

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

  const streakInfoVWC = useMappedValueWithCallbacks(state, (s) => s.streakInfo);
  const copyRawVWC = useMappedValuesWithCallbacks(
    [resources, nameVWC, streakInfoVWC],
    () => {
      const name = nameVWC.get();
      const r = resources.get();
      if (r.copy.type === 'success') {
        return r.copy.result;
      }

      if (r.copy.type === 'loading') {
        return {
          headline: '',
          subheadline: '',
        };
      }

      const currentDate = new Date();
      const greeting = (() => {
        const hour = currentDate.getHours();
        if (hour >= 3 && hour < 12) {
          return <>Good Morning</>;
        } else if (hour >= 12 && hour < 17) {
          return <>Good Afternoon</>;
        } else {
          return <>Good Evening</>;
        }
      })();

      const v = streakInfoVWC.get();

      return {
        headline: `${greeting}${name}! 👋`,
        subheadline:
          `You’ve meditated <strong>${
            v.type === 'success'
              ? numberToWord[v.result.daysOfWeek.length]
              : '?'
          }</strong> ` +
          `time${v.result?.daysOfWeek.length === 1 ? '' : 's'} this week. ` +
          (() => {
            if (v.type !== 'success') {
              return '';
            }
            const goal = v.result.goalDaysPerWeek;
            if (goal === null) {
              return '';
            }

            if (v.result.daysOfWeek.length >= goal) {
              return (
                ` You’ve met your goal of {goal.toLocaleString()} day` +
                `${goal === 1 ? '' : 's'} for this week!`
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
              return '';
            }

            return ` You can still make your goal of ${goal.toLocaleString()} days this week.`;
          })(),
      };
    }
  );
  const copyFmtdVWC = useMappedValueWithCallbacks(copyRawVWC, (copy) => ({
    headline: <>{copy.headline}</>,
    subheadline: (() => {
      // non-nested strong tags only

      const parts: ReactElement[] = [];
      const strong = Object.assign(
        {},
        styles.headerBody,
        styles.headerBodyStrong
      );
      const normal = styles.headerBody;

      let handled = 0;
      while (true) {
        let openAt = copy.subheadline.indexOf('<strong>', handled);
        if (openAt === -1) {
          break;
        }

        let closeAt = copy.subheadline.indexOf('</strong>', openAt + 7);
        if (closeAt === -1) {
          console.warn('failed to parse copy subheadline; no closing strong');
          break;
        }

        parts.push(
          <Text key={parts.length}>
            {copy.subheadline.slice(handled, openAt)}
          </Text>
        );
        parts.push(
          <Text style={strong} key={parts.length}>
            {copy.subheadline.slice(openAt + 8, closeAt)}
          </Text>
        );
        handled = closeAt + 9;
      }
      if (handled < copy.subheadline.length) {
        parts.push(
          <Text key={parts.length}>{copy.subheadline.slice(handled)}</Text>
        );
      }
      return <Text style={normal}>{parts}</Text>;
    })(),
  }));

  const backgroundImageVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.backgroundImage
  );
  const headerAndGoalRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const headerAndGoalStyleVWC = useMappedValueWithCallbacks(
    backgroundImageVWC,
    (bknd) => ({ width: bknd.displayWidth, height: bknd.displayHeight })
  );
  useStyleVWC(headerAndGoalRef, headerAndGoalStyleVWC);

  const headerStyleVWC = useMappedValueWithCallbacks(
    backgroundImageVWC,
    (bknd) => ({ width: Math.min(bknd.displayWidth, 438) })
  );
  const headerRef = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(headerRef, headerStyleVWC);

  const goalWrapperRef = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(goalWrapperRef, headerStyleVWC);

  const windowSizeVWC = useWindowSizeValueWithCallbacks();

  const botBarHeight = useBotBarHeight();
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
        67 /* bottom nav */ -
        botBarHeight
      );
    }
  );

  const emotionsHeightVWC = useWritableValueWithCallbacks<number>(() =>
    estimatedEmotionsHeightVWC.get()
  );

  const emotionsVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.emotions.result ?? [],
    {
      outputEqualityFn: (a, b) =>
        a.length === b.length && a.every((v, i) => v.word === b[i].word),
    }
  );

  const emotionRowHeightVWC = useWritableValueWithCallbacks(() => 60);
  const numberOfEmotionRowsVWC = useMappedValuesWithCallbacks(
    [emotionsHeightVWC, emotionRowHeightVWC],
    (h) =>
      Math.min(
        4,
        Math.floor(
          emotionsHeightVWC.get() /
            (emotionRowHeightVWC.get() + styles.emotions.gap)
        )
      )
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

  const emotionRowContentWidthsVWC = useWritableValueWithCallbacks<number[]>(
    () => Array(numberOfEmotionRowsVWC.get()).fill(0)
  );
  useValueWithCallbacksEffect(numberOfEmotionRowsVWC, (numRows) => {
    const oldData = emotionRowContentWidthsVWC.get();
    if (oldData.length === numRows) {
      return undefined;
    }
    const arr = [];
    for (let i = 0; i < numRows && i < oldData.length; i++) {
      arr.push(oldData[i]);
    }
    for (let i = oldData.length; i < numRows; i++) {
      arr.push(0);
    }
    setVWC(emotionRowContentWidthsVWC, arr);
    return undefined;
  });
  const emotionRowRefs = useWritableValueWithCallbacks<(ScrollView | null)[]>(
    () => Array(numberOfEmotionRowsVWC.get()).fill(null)
  );
  useValueWithCallbacksEffect(numberOfEmotionRowsVWC, (numRows) => {
    const oldData = emotionRowRefs.get();
    if (oldData.length === numRows) {
      return undefined;
    }
    setVWC(emotionRowRefs, Array(numRows).fill(null));
    return undefined;
  });

  const emotionContentInnerRefs = useWritableValueWithCallbacks<
    (View | null)[]
  >(() => Array(numberOfEmotionRowsVWC.get()).fill(null));
  useValueWithCallbacksEffect(numberOfEmotionRowsVWC, (numRows) => {
    const oldData = emotionContentInnerRefs.get();
    if (oldData.length === numRows) {
      return undefined;
    }
    setVWC(emotionContentInnerRefs, Array(numRows).fill(null));
    return undefined;
  });

  useValuesWithCallbacksEffect(
    [emotionRowContentWidthsVWC, emotionRowRefs, windowSizeVWC],
    useCallback(() => {
      const rows = emotionRowContentWidthsVWC.get();
      const refs = emotionRowRefs.get();
      const width = windowSizeVWC.get().width;
      if (rows.length !== refs.length) {
        return undefined;
      }

      for (let i = 0; i < rows.length; i++) {
        const ele = refs[i];
        if (ele === null) {
          continue;
        }
        const contentWidth = rows[i];
        if (contentWidth < width) {
          ele.scrollTo({ x: 0, animated: false });
          continue;
        }
        ele.scrollTo({ x: (contentWidth - width) / 2, animated: false });
      }
      return undefined;
    }, [emotionRowContentWidthsVWC, emotionRowRefs, windowSizeVWC])
  );

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

  useValueWithCallbacksEffect(streakInfoVWC, (streakInfo) => {
    const newValue = {
      filled: streakInfo.result?.daysOfWeek.length ?? 0,
      goal: streakInfo.result?.goalDaysPerWeek ?? 3,
    };

    if (newValue.goal !== visualGoalStateVWC.target.get().goal) {
      setVWC(
        visualGoalStateVWC.target,
        {
          filled: visualGoalStateVWC.target.get().filled,
          goal: newValue.goal,
        },
        () => false
      );
    }

    if (newValue.filled !== visualGoalStateVWC.target.get().filled) {
      let active = true;
      let timeout: NodeJS.Timeout | null = setTimeout(
        () => {
          if (!active) {
            return;
          }
          timeout = null;
          setVWC(visualGoalStateVWC.target, newValue, () => false);
        },
        Platform.select({
          ios: 500,
          default: 1500,
        })
      );
      return () => {
        active = false;
        if (timeout !== null) {
          clearTimeout(timeout);
          timeout = null;
        }
      };
    }

    return undefined;
  });

  const windowWidthVWC = useMappedValueWithCallbacks(
    windowSizeVWC,
    (v) => v.width
  );

  const bottomNavHeightVWC = useWritableValueWithCallbacks<number>(
    () => bottomNavStyles.container.minHeight
  );
  const overlayVWC = useWritableValueWithCallbacks<View | null>(() => null);
  const foregroundOpacityVWC = useWritableValueWithCallbacks<number>(() => {
    if (transition.animation.get().type === 'fade') {
      return 0;
    }
    return 1;
  });
  const tutorialOpacityVWC = useWritableValueWithCallbacks(() => 1);
  const overlayStyleVWC = useMappedValuesWithCallbacks(
    [
      ...(tutorial === undefined ? [] : [tutorial.step]),
      backgroundImageVWC,
      bottomNavHeightVWC,
      foregroundOpacityVWC,
      tutorialOpacityVWC,
    ],
    (): {
      top: number | undefined;
      bottom: number | undefined;
      height: number | undefined;
      opacity: number;
    } => {
      const step = tutorial?.step?.get();
      if (step === undefined) {
        return {
          top: undefined,
          bottom: undefined,
          height: undefined,
          opacity: 1,
        };
      }

      const imgHeight = backgroundImageVWC.get();
      const botNavHeight = bottomNavHeightVWC.get();
      const opacity = foregroundOpacityVWC.get() * tutorialOpacityVWC.get();

      if (step === 'explain_bottom') {
        return {
          top: 0,
          bottom: undefined,
          height: imgHeight.displayHeight,
          opacity,
        };
      } else {
        return {
          top: imgHeight.displayHeight,
          bottom: botNavHeight + botBarHeight,
          height: undefined,
          opacity,
        };
      }
    }
  );
  useStyleVWC(overlayVWC, overlayStyleVWC);

  const bkndImageSlideOutProgressVWC = useWritableValueWithCallbacks<number>(
    () => 0
  );
  const bottomNavSlideOutProgressVWC = useWritableValueWithCallbacks<number>(
    () => 0
  );
  const selectingEmotionVWC = useWritableValueWithCallbacks<Emotion | null>(
    () => null
  );
  const irrelevantOpacityVWC = useWritableValueWithCallbacks<number>(() => 1);
  const selectingEmotionOpacityVWC = useWritableValueWithCallbacks<number>(
    () => 1
  );

  const engine = useDynamicAnimationEngine();

  const handleEmotionClick = useCallback((emotion: Emotion) => {
    /* need at least 2s to consistently hide spinner */
    if (engine.playing.get()) {
      return;
    }
    state.get().setNextEnterTransition(undefined);
    setVWC(selectingEmotionVWC, emotion);

    const finish = resources.get().startGotoEmotion(emotion);
    engine.play([
      {
        id: 'irrelevantFadeOut',
        duration: 350,
        progressEase: { type: 'bezier', bezier: ease },
        onFrame: (progress) => {
          setVWC(irrelevantOpacityVWC, 1 - progress);
        },
      },
      {
        id: 'selectingSwapIn',
        duration: 350,
        progressEase: { type: 'bezier', bezier: ease },
        onFrame: (progress) => {
          setVWC(selectingEmotionOpacityVWC, 1 - progress);
        },
      },
      {
        id: 'headerSlideUp',
        duration: 350,
        progressEase: { type: 'bezier', bezier: ease },
        onFrame: (progress) => {
          setVWC(bkndImageSlideOutProgressVWC, progress);
        },
      },
      {
        id: 'bottomNavSlideOut',
        duration: 350,
        progressEase: { type: 'bezier', bezier: ease },
        onFrame: (progress) => {
          setVWC(bottomNavSlideOutProgressVWC, progress);
        },
      },
    ]);

    const onEnginePlayingChanged = async () => {
      const v = engine.playing.get();
      if (!v) {
        engine.playing.callbacks.remove(onEnginePlayingChanged);

        const loc = swapInEmotionLocationVWC.get();
        finish(
          loc === null
            ? undefined
            : {
                emotionStart: { ...loc },
              }
        );
      }
    };

    engine.playing.callbacks.add(onEnginePlayingChanged);
  }, []);

  const backgroundImageVisibleHeightVWC = useMappedValuesWithCallbacks(
    [backgroundImageVWC, bkndImageSlideOutProgressVWC],
    () =>
      backgroundImageVWC.get().displayHeight *
      (1 - bkndImageSlideOutProgressVWC.get())
  );

  const selectingEmotionLocationVWC = useWritableValueWithCallbacks<{
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null>(() => null);

  const swapInEmotionLocationVWC = useWritableValueWithCallbacks<{
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null>(() => null);

  useMappedValuesWithCallbacks(
    [selectingEmotionLocationVWC, selectingEmotionOpacityVWC],
    () => {
      const selOpacity = selectingEmotionOpacityVWC.get();
      if (selOpacity <= 0) {
        return;
      }

      const loc = selectingEmotionLocationVWC.get();
      if (loc !== null) {
        setVWC(swapInEmotionLocationVWC, {
          left: loc.left,
          top: loc.top,
          right: loc.right,
          bottom: loc.bottom,
        });
      }
    }
  );

  const backgroundWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const backgroundWrapperStyleVWC = useMappedValuesWithCallbacks(
    [backgroundImageVisibleHeightVWC, backgroundImageVWC],
    (): ViewStyle => ({
      height: backgroundImageVisibleHeightVWC.get(),
      width: backgroundImageVWC.get().displayWidth,
    })
  );
  useStyleVWC(backgroundWrapperRef, backgroundWrapperStyleVWC);

  const backgroundOverlayRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const backgroundOverlayStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, backgroundImageVisibleHeightVWC],
    () => {
      const size = windowSizeVWC.get();
      const imgVisibleHeight = backgroundImageVisibleHeightVWC.get();
      return {
        height: size.height - imgVisibleHeight,
        width: size.width,
      };
    }
  );
  useStyleVWC(backgroundOverlayRef, backgroundOverlayStyleVWC);

  const headerAndGoalOuterWrapperRef =
    useWritableValueWithCallbacks<View | null>(() => null);
  const headerAndGoalOuterWrapperStyleVWC = useMappedValueWithCallbacks(
    headerAndGoalStyleVWC,
    (s) => ({ width: s.width, height: s.height })
  );
  useStyleVWC(headerAndGoalOuterWrapperRef, headerAndGoalOuterWrapperStyleVWC);

  const headerAndGoalWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const headerAndGoalWrapperStyleVWC = useMappedValuesWithCallbacks(
    [headerAndGoalStyleVWC, backgroundImageVisibleHeightVWC],
    () => ({
      width: headerAndGoalStyleVWC.get().width,
      height: backgroundImageVisibleHeightVWC.get(),
    })
  );
  useStyleVWC(headerAndGoalWrapperRef, headerAndGoalWrapperStyleVWC);

  const bottomNavOuterWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const bottomNavOuterWrapperStyleVWC = useMappedValuesWithCallbacks(
    [bottomNavHeightVWC],
    () => ({
      height: bottomNavHeightVWC.get(),
    })
  );
  useStyleVWC(bottomNavOuterWrapperRef, bottomNavOuterWrapperStyleVWC);

  const bottomNavWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const bottomNavWrapperStyleVWC = useMappedValuesWithCallbacks(
    [bottomNavHeightVWC, bottomNavSlideOutProgressVWC],
    () => ({
      height:
        bottomNavHeightVWC.get() * (1 - bottomNavSlideOutProgressVWC.get()),
    })
  );
  useStyleVWC(bottomNavWrapperRef, bottomNavWrapperStyleVWC);

  const questionRef = useWritableValueWithCallbacks<View | null>(() => null);
  const questionStyleVWC = useMappedValueWithCallbacks(
    irrelevantOpacityVWC,
    (opacity) => ({ opacity })
  );
  useStyleVWC(questionRef, questionStyleVWC);

  const swapInEmotionWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const swapInEmotionWrapperStyleVWC = useMappedValueWithCallbacks(
    swapInEmotionLocationVWC,
    (loc) => ({
      left: loc?.left,
      top: loc?.top,
    }),
    {
      outputEqualityFn: (a, b) => a.left === b.left && a.top === b.top,
    }
  );
  useStyleVWC(swapInEmotionWrapperRef, swapInEmotionWrapperStyleVWC);

  const standardGradientOverlayOpacityVWC =
    useWritableValueWithCallbacks<number>(() => {
      if (transition.animation.get().type === 'fade') {
        return 1;
      }
      return 0;
    });
  useOsehTransition(
    transition,
    'fade',
    (cfg) => {
      const startOverlayOpacity = standardGradientOverlayOpacityVWC.get();
      const endOverlayOpacity = 0;
      const dOverlayOpacity = endOverlayOpacity - startOverlayOpacity;

      const startContentOpacity = foregroundOpacityVWC.get();
      const endContentOpacity = 1;
      const dContentOpacity = endContentOpacity - startContentOpacity;

      engine.play([
        {
          id: 'fade-out-overlay',
          duration: cfg.ms / 2,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(
              standardGradientOverlayOpacityVWC,
              startOverlayOpacity + dOverlayOpacity * progress
            );
          },
        },
        {
          id: 'fade-in-content',
          duration: cfg.ms / 2,
          delayUntil: {
            type: 'relativeToEnd',
            id: 'fade-out-overlay',
            after: 0,
          },
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(
              foregroundOpacityVWC,
              startContentOpacity + dContentOpacity * progress
            );
          },
        },
      ]);
    },
    (cfg) => {
      const startOverlayOpacity = standardGradientOverlayOpacityVWC.get();
      const endOverlayOpacity = 1;
      const dOverlayOpacity = endOverlayOpacity - startOverlayOpacity;

      engine.play([
        {
          id: 'fade-in-overlay',
          duration: cfg.ms / 2,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(
              standardGradientOverlayOpacityVWC,
              startOverlayOpacity + dOverlayOpacity * progress
            );
          },
        },
      ]);
    }
  );
  useAttachDynamicEngineToTransition(transition, engine);
  useSetTransitionReady(transition);

  const stdGradientOverlayRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const stdGradientOverlayStyleVWC = useMappedValuesWithCallbacks(
    [standardGradientOverlayOpacityVWC, windowSizeVWC],
    (): ViewStyle => {
      const opacity = standardGradientOverlayOpacityVWC.get();
      const size = windowSizeVWC.get();
      const isZero = opacity < 1e-3;
      return {
        display: isZero ? 'none' : 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        width: size.width,
        height: size.height,
        opacity,
      };
    }
  );
  useStyleVWC(stdGradientOverlayRef, stdGradientOverlayStyleVWC);

  const foregroundRef = useWritableValueWithCallbacks<View | null>(() => null);
  const foregroundStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, foregroundOpacityVWC],
    () => ({
      height: windowSizeVWC.get().height,
      opacity: foregroundOpacityVWC.get(),
    })
  );
  useStyleVWC(foregroundRef, foregroundStyleVWC);

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View
          style={Object.assign(
            {},
            styles.backgroundWrapper,
            backgroundWrapperStyleVWC.get()
          )}
          ref={(r) => setVWC(backgroundWrapperRef, r)}
        >
          <OsehImageFromStateValueWithCallbacks state={backgroundImageVWC} />
        </View>
        <View
          style={Object.assign(
            {},
            styles.backgroundOverlay,
            backgroundOverlayStyleVWC.get()
          )}
          ref={(r) => setVWC(backgroundOverlayRef, r)}
        >
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
      <View
        ref={(r) => setVWC(foregroundRef, r)}
        style={Object.assign({}, styles.foreground, foregroundStyleVWC.get())}
      >
        <View
          style={Object.assign(
            {},
            styles.headerAndGoalOuterWrapper,
            headerAndGoalOuterWrapperStyleVWC.get()
          )}
          ref={(r) => setVWC(headerAndGoalOuterWrapperRef, r)}
        >
          <View
            style={Object.assign(
              {},
              styles.headerAndGoalWrapper,
              headerAndGoalWrapperStyleVWC.get()
            )}
            ref={(r) => setVWC(headerAndGoalWrapperRef, r)}
          >
            <View
              style={Object.assign(
                {},
                styles.headerAndGoal,
                headerAndGoalStyleVWC.get()
              )}
              ref={(r) => setVWC(headerAndGoalRef, r)}
            >
              <View
                style={Object.assign({}, styles.header, headerStyleVWC.get())}
                ref={(r) => setVWC(headerRef, r)}
              >
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>
                    <RenderGuardedComponent
                      props={useMappedValueWithCallbacks(
                        copyFmtdVWC,
                        (c) => c.headline
                      )}
                      component={(v) => v}
                    />
                  </Text>
                  <Pressable
                    style={styles.headerProfilePicture}
                    onPress={() => resources.get().gotoAccount()}
                  >
                    <MyProfilePicture
                      displayWidth={32}
                      displayHeight={32}
                      imageHandler={state.get().imageHandler}
                      style={styles.headerProfilePictureImg}
                    />
                  </Pressable>
                </View>
                <RenderGuardedComponent
                  props={useMappedValueWithCallbacks(
                    copyFmtdVWC,
                    (c) => c.subheadline
                  )}
                  component={(v) => v}
                />
              </View>
              <View
                style={Object.assign(
                  {},
                  styles.goalWrapper,
                  headerStyleVWC.get()
                )}
                ref={(r) => setVWC(goalWrapperRef, r)}
              >
                <SimpleBlurView
                  style={styles.goal}
                  intensity={4}
                  experimentalBlurMethod="dimezisBlurView"
                  captureAllowed={useMappedValueWithCallbacks(
                    engine.playing,
                    (p) => !p
                  )}
                >
                  <View style={styles.goalInner}>
                    <View style={styles.goalVisual}>
                      <View style={styles.goalVisualBackground}>
                        <VisualGoal state={visualGoalStateVWC.rendered} />
                      </View>
                      <View style={styles.goalVisualForeground}>
                        <Text
                          style={styles.goalVisualText}
                          allowFontScaling={false}
                        >
                          <RenderGuardedComponent
                            props={streakInfoVWC}
                            component={(v) =>
                              v.type === 'success' ? (
                                <>{v.result.daysOfWeek.length}</>
                              ) : (
                                <>?</>
                              )
                            }
                          />
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        resources.get().gotoUpdateGoal();
                      }}
                      style={Object.assign(
                        {},
                        styles.goalSection,
                        styles.goalSectionGoal
                      )}
                    >
                      <Text style={styles.goalSectionTitle}>Goal</Text>
                      <Text style={styles.goalSectionValue}>
                        <RenderGuardedComponent
                          props={streakInfoVWC}
                          component={(v) =>
                            v.type === 'success' ? (
                              v.result.goalDaysPerWeek === null ? (
                                <>Unset</>
                              ) : (
                                <>
                                  {v.result.daysOfWeek.length} of{' '}
                                  {v.result.goalDaysPerWeek}
                                </>
                              )
                            ) : (
                              <>?</>
                            )
                          }
                        />
                      </Text>
                    </Pressable>
                    <View style={styles.goalSection}>
                      <Text style={styles.goalSectionTitle}>Streak</Text>
                      <Text style={styles.goalSectionValue}>
                        <RenderGuardedComponent
                          props={streakInfoVWC}
                          component={(v) =>
                            v.type === 'success' ? (
                              <>{v.result.streak}</>
                            ) : (
                              <>?</>
                            )
                          }
                        />
                      </Text>
                    </View>
                  </View>
                </SimpleBlurView>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.content}>
          <Text
            style={Object.assign({}, styles.question, questionStyleVWC.get())}
            ref={(r) => setVWC(questionRef, r)}
          >
            How do you want to feel today?
          </Text>
          <View
            style={styles.emotions}
            onLayout={(e) => {
              const height = e.nativeEvent?.layout?.height;
              if (height === undefined) {
                return;
              }
              setVWC(emotionsHeightVWC, height);
            }}
          >
            <RenderGuardedComponent
              props={useMappedValuesWithCallbacks(
                [emotionRowsVWC, windowWidthVWC],
                () => ({ r: emotionRowsVWC.get(), width: windowWidthVWC.get() })
              )}
              component={({ r, width }) => (
                <>
                  {r.map((row, idx) => (
                    <ScrollView
                      key={idx}
                      style={Object.assign({}, styles.emotionRow, { width })}
                      contentContainerStyle={Object.assign(
                        {},
                        styles.emotionRowContent,
                        Platform.select({
                          // android centerContent doesn't work correctly
                          android: { minWidth: width },
                          default: undefined,
                        })
                      )}
                      horizontal
                      centerContent
                      showsHorizontalScrollIndicator={false}
                      onLayout={(e) => {
                        const height = e.nativeEvent?.layout?.height;
                        if (
                          height !== undefined &&
                          height > emotionRowHeightVWC.get()
                        ) {
                          setVWC(emotionRowHeightVWC, height);
                        }
                      }}
                      onContentSizeChange={(w) => {
                        if (numberOfEmotionRowsVWC.get() <= idx) {
                          return;
                        }

                        if (typeof w !== 'number' || isNaN(w) || w <= 0) {
                          return;
                        }

                        const rows = emotionRowContentWidthsVWC.get();
                        if (rows.length <= idx) {
                          return;
                        }

                        if (
                          Math.abs(
                            convertLogicalWidthToPhysicalWidth(rows[idx]) -
                              convertLogicalWidthToPhysicalWidth(w)
                          ) < 1
                        ) {
                          return;
                        }
                        const newRows = rows.slice();
                        newRows[idx] = w;
                        setVWC(
                          emotionRowContentWidthsVWC,
                          newRows,
                          () => false
                        );
                      }}
                      ref={(r) => {
                        if (numberOfEmotionRowsVWC.get() <= idx) {
                          return;
                        }

                        const refs = emotionRowRefs.get();
                        const newRefs = refs.slice();
                        newRefs[idx] = r;
                        setVWC(emotionRowRefs, newRefs, () => false);
                      }}
                    >
                      <View
                        style={styles.emotionRowContentInner}
                        ref={(r) => {
                          if (numberOfEmotionRowsVWC.get() <= idx) {
                            return;
                          }

                          const refs = emotionContentInnerRefs.get();
                          const newRefs = refs.slice();
                          newRefs[idx] = r;
                          setVWC(emotionContentInnerRefs, newRefs, () => false);
                        }}
                        onLayout={(e) => {
                          const width = e.nativeEvent?.layout?.width;
                          if (
                            width === undefined ||
                            width <= 0 ||
                            isNaN(width)
                          ) {
                            return;
                          }

                          const rows = emotionRowContentWidthsVWC.get();
                          if (rows.length <= idx) {
                            return;
                          }
                          if (
                            Math.abs(
                              convertLogicalWidthToPhysicalWidth(rows[idx]) -
                                convertLogicalWidthToPhysicalWidth(width)
                            ) < 1
                          ) {
                            return;
                          }

                          const newRows = rows.slice();
                          newRows[idx] = width;
                          setVWC(
                            emotionRowContentWidthsVWC,
                            newRows,
                            () => false
                          );
                        }}
                      >
                        {row.map((emotion) => (
                          <EmotionButton
                            key={emotion.word}
                            emotion={emotion}
                            handleEmotionClick={handleEmotionClick}
                            selectingEmotionVWC={selectingEmotionVWC}
                            irrelevantOpacityVWC={irrelevantOpacityVWC}
                            selectingEmotionOpacityVWC={
                              selectingEmotionOpacityVWC
                            }
                            selectingEmotionLocationVWC={
                              selectingEmotionLocationVWC
                            }
                          />
                        ))}
                      </View>
                    </ScrollView>
                  ))}
                </>
              )}
            />
          </View>
        </View>
        <View
          style={Object.assign(
            {},
            styles.bottomNavOuterWrapper,
            bottomNavOuterWrapperStyleVWC.get()
          )}
          ref={(r) => setVWC(bottomNavOuterWrapperRef, r)}
        >
          <View
            style={Object.assign(
              {},
              styles.bottomNavWrapper,
              bottomNavWrapperStyleVWC.get()
            )}
            ref={(r) => setVWC(bottomNavWrapperRef, r)}
          >
            <View
              onLayout={(e) => {
                const height = e.nativeEvent?.layout?.height;
                if (height !== undefined && height !== null && height > 0) {
                  setVWC(bottomNavHeightVWC, height);
                }
              }}
            >
              <BottomNavBar
                active="home"
                clickHandlers={{
                  series: () => resources.get().gotoSeries(),
                  account: () => resources.get().gotoAccount(),
                }}
              />
            </View>
          </View>
        </View>
        <View style={{ width: 1, height: botBarHeight }} />
      </View>
      <RenderGuardedComponent
        props={selectingEmotionVWC}
        component={(v) =>
          v === null ? (
            <></>
          ) : (
            <View
              style={Object.assign(
                {},
                styles.selectEmotionSwapInWrapper,
                swapInEmotionWrapperStyleVWC.get()
              )}
              ref={(r) => setVWC(swapInEmotionWrapperRef, r)}
            >
              <Text style={styles.emotionButtonText}>{v.word}</Text>
            </View>
          )
        }
      />
      {tutorial !== undefined && (
        <View
          style={Object.assign({}, styles.overlay, overlayStyleVWC.get())}
          ref={(r) => setVWC(overlayVWC, r)}
        >
          <SimpleBlurView
            style={styles.overlayInner}
            intensity={20}
            tint="dark"
            androidTechnique={{ type: 'color', color: '#191c1db0' }}
          >
            <RenderGuardedComponent
              props={tutorial.step}
              component={(step) =>
                step === 'explain_top' ? (
                  <View style={[styles.tutorial, styles.tutorial1]}>
                    <Text style={styles.tutorialTitle}>
                      Celebrate your journey
                    </Text>
                    <Text style={styles.tutorialText}>
                      Track your progress and celebrate milestones &mdash;
                      we&rsquo;re here to cheer you on 🎉
                    </Text>
                    <View style={styles.tutorialControls}>
                      <Text style={styles.tutorialProgress}>1/2</Text>
                      <Pressable
                        style={styles.tutorialButton}
                        onPress={async () => {
                          engine.play([
                            {
                              id: 'fade-out',
                              duration: 350,
                              progressEase: { type: 'bezier', bezier: ease },
                              onFrame: (progress) => {
                                setVWC(tutorialOpacityVWC, 1 - progress);
                              },
                            },
                          ]);
                          const playingChanged =
                            createCancelablePromiseFromCallbacks(
                              engine.playing.callbacks
                            );
                          if (!engine.playing.get()) {
                            playingChanged.promise.catch(() => {});
                            playingChanged.cancel();
                          } else {
                            await playingChanged.promise.catch(() => {});
                          }
                          tutorial?.onNextStep();
                          engine.play([
                            {
                              id: 'fade-in',
                              duration: 350,
                              progressEase: { type: 'bezier', bezier: ease },
                              onFrame: (progress) => {
                                setVWC(tutorialOpacityVWC, progress);
                              },
                            },
                          ]);
                        }}
                      >
                        <Text style={styles.tutorialButtonText}>Next</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.tutorial, styles.tutorial2]}>
                    <Text style={styles.tutorialTitle}>
                      Your perfect class is waiting
                    </Text>
                    <Text style={styles.tutorialText}>
                      Select a mood and get a tailored class just for you.
                    </Text>
                    <View style={styles.tutorialControls}>
                      <Text style={styles.tutorialProgress}>2/2</Text>
                      <Pressable
                        style={styles.tutorialButton}
                        onPress={async () => {
                          engine.play([
                            {
                              id: 'fade-out',
                              duration: 350,
                              progressEase: { type: 'bezier', bezier: ease },
                              onFrame: (progress) => {
                                setVWC(tutorialOpacityVWC, 1 - progress);
                              },
                            },
                          ]);
                          const playingChanged =
                            createCancelablePromiseFromCallbacks(
                              engine.playing.callbacks
                            );
                          if (!engine.playing.get()) {
                            playingChanged.promise.catch(() => {});
                            playingChanged.cancel();
                          } else {
                            await playingChanged.promise.catch(() => {});
                          }
                          tutorial?.onNextStep();
                        }}
                      >
                        <Text style={styles.tutorialButtonText}>Done</Text>
                      </Pressable>
                    </View>
                  </View>
                )
              }
            />
          </SimpleBlurView>
        </View>
      )}
      <View
        style={stdGradientOverlayStyleVWC.get()}
        ref={(r) => setVWC(stdGradientOverlayRef, r)}
        pointerEvents="none"
      >
        <SvgLinearGradient state={DARK_BLACK_GRAY_GRADIENT_SVG} />
      </View>
      <StatusBar style="light" />
    </View>
  );
};

const EmotionButton = ({
  emotion,
  handleEmotionClick,
  selectingEmotionVWC,
  irrelevantOpacityVWC,
  selectingEmotionOpacityVWC,
  selectingEmotionLocationVWC,
}: {
  emotion: Emotion;
  handleEmotionClick: (emotion: Emotion) => void;
  selectingEmotionVWC: ValueWithCallbacks<Emotion | null>;
  irrelevantOpacityVWC: ValueWithCallbacks<number>;
  selectingEmotionOpacityVWC: ValueWithCallbacks<number>;
  selectingEmotionLocationVWC: WritableValueWithCallbacks<{
    top: number;
    left: number;
    bottom: number;
    right: number;
  } | null>;
}): ReactElement => {
  const buttonRef = useWritableValueWithCallbacks<View | null>(() => null);
  const opacityVWC = useMappedValuesWithCallbacks(
    [selectingEmotionVWC, selectingEmotionOpacityVWC, irrelevantOpacityVWC],
    () => {
      const selecting = selectingEmotionVWC.get();
      if (selecting === null) {
        return 1;
      }

      return selecting.word === emotion.word
        ? selectingEmotionOpacityVWC.get()
        : irrelevantOpacityVWC.get();
    }
  );

  useValuesWithCallbacksEffect([buttonRef, selectingEmotionVWC], () => {
    if (selectingEmotionVWC.get()?.word !== emotion.word) {
      return undefined;
    }

    const ele = buttonRef.get();
    if (ele === null) {
      return;
    }

    let active = true;
    ele.measure((_x, _y, width, height, left, top) => {
      if (!active) {
        return;
      }
      setVWC(selectingEmotionLocationVWC, {
        left,
        top,
        right: left + width,
        bottom: top + height,
      });
    });

    return () => {
      active = false;
    };
  });

  const buttonStyleVWC = useMappedValueWithCallbacks(opacityVWC, (opacity) => ({
    opacity,
  }));
  useStyleVWC(buttonRef, buttonStyleVWC);

  return (
    <Pressable
      onPress={() => {
        handleEmotionClick(emotion);
      }}
      style={Object.assign({}, styles.emotionButton, buttonStyleVWC.get())}
      ref={(r) => setVWC(buttonRef, r)}
    >
      <Text style={styles.emotionButtonText}>{emotion.word}</Text>
    </Pressable>
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
