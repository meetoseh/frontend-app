import { ReactElement, useEffect, useRef } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { GotoEmotionResources } from './GotoEmotionResources';
import { GotoEmotionState } from './GotoEmotionState';
import {
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { styles } from './GotoEmotionStyles';
import { STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { StatusBar } from 'expo-status-bar';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import Back from './assets/Back';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ProfilePictures } from '../../../interactive_prompt/components/ProfilePictures';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { useDynamicAnimationEngine } from '../../../../shared/anim/useDynamicAnimation';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import {
  Bezier,
  ease,
  easeInOutBack,
  easeOutBack,
} from '../../../../shared/lib/Bezier';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';

/**
 * Allows the user to start a class within a given emotion, or go back to
 * their home screen.
 */
export const GotoEmotion = ({
  state,
  resources,
}: FeatureComponentProps<
  GotoEmotionState,
  GotoEmotionResources
>): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();

  const startedAnim = useRef(false);
  const backButtonOpacityVWC = useWritableValueWithCallbacks(() => 0);
  const titleOpacityVWC = useWritableValueWithCallbacks(() => 0);
  const realEmotionOpacityVWC = useWritableValueWithCallbacks(() => 0);
  const socialProofOpacityVWC = useWritableValueWithCallbacks(() => 0);
  const oneMinuteButtonOpacityVWC = useWritableValueWithCallbacks(() => 0);
  const longerClassButtonOpacityVWC = useWritableValueWithCallbacks(() => 0);
  const holdoverEmotionWordOpacityVWC = useWritableValueWithCallbacks(() => 1);
  const holdoverEmotionMoveProgressVWC = useWritableValueWithCallbacks(() => 0);
  const engine = useDynamicAnimationEngine();

  useEffect(() => {
    if (startedAnim.current) {
      return;
    }
    startedAnim.current = true;

    const show = state.get().show;
    if (show?.animationHints === undefined) {
      setVWC(holdoverEmotionMoveProgressVWC, 1);
      setVWC(holdoverEmotionWordOpacityVWC, 0);
      engine.play([
        {
          id: 'fadeIn',
          duration: 350,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(backButtonOpacityVWC, progress);
            setVWC(oneMinuteButtonOpacityVWC, progress);
            setVWC(longerClassButtonOpacityVWC, progress);
            setVWC(titleOpacityVWC, progress);
            setVWC(realEmotionOpacityVWC, progress);
            setVWC(socialProofOpacityVWC, progress);
          },
        },
      ]);
      return;
    }

    engine.play([
      {
        id: 'move',
        duration: 1500,
        progressEase: {
          type: 'bezier',
          bezier: easeOutBack,
        },
        onFrame: (progress) => {
          setVWC(holdoverEmotionMoveProgressVWC, progress);
        },
      },
      {
        id: 'fadeIn',
        duration: 500,
        delayUntil: { type: 'relativeToEnd', id: 'move', after: 0 },
        progressEase: { type: 'bezier', bezier: ease },
        onFrame: (progress) => {
          setVWC(backButtonOpacityVWC, progress);
          setVWC(oneMinuteButtonOpacityVWC, progress);
          setVWC(longerClassButtonOpacityVWC, progress);
          setVWC(titleOpacityVWC, progress);
          setVWC(realEmotionOpacityVWC, progress);
          setVWC(socialProofOpacityVWC, progress);
          setVWC(holdoverEmotionWordOpacityVWC, 1 - progress);
        },
      },
    ]);
  });

  const backButtonRef = useWritableValueWithCallbacks<View | null>(() => null);
  const backButtonStyleVWC = useMappedValueWithCallbacks(
    backButtonOpacityVWC,
    (opacity) => ({ opacity })
  );
  useStyleVWC(backButtonRef, backButtonStyleVWC);

  const titleRef = useWritableValueWithCallbacks<View | null>(() => null);
  const titleStyleVWC = useMappedValueWithCallbacks(
    titleOpacityVWC,
    (opacity) => ({ opacity })
  );
  useStyleVWC(titleRef, titleStyleVWC);

  const realEmotionRef = useWritableValueWithCallbacks<View | null>(() => null);
  const realEmotionStyleVWC = useMappedValueWithCallbacks(
    realEmotionOpacityVWC,
    (opacity) => ({ opacity })
  );
  useStyleVWC(realEmotionRef, realEmotionStyleVWC);

  const realEmotionLocationVWC = useWritableValueWithCallbacks<{
    top: number;
    right: number;
    bottom: number;
    left: number;
  } | null>(() => null);
  useValueWithCallbacksEffect(realEmotionRef, (rUnch) => {
    if (rUnch === null) {
      return;
    }
    const r = rUnch;

    let active = true;
    requestAnimationFrame(testSize);

    return () => {
      active = false;
    };

    function testSize() {
      if (!active) {
        return;
      }

      if (startedAnim.current && !engine.playing.get()) {
        return;
      }

      r.measure(onMeasure);
    }

    function onMeasure(
      _x: number,
      _y: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number
    ) {
      if (!active) {
        return;
      }

      if (startedAnim.current && !engine.playing.get()) {
        return;
      }

      setVWC(
        realEmotionLocationVWC,
        {
          left: pageX,
          top: pageY,
          right: pageX + width,
          bottom: pageY + height,
        },
        (a, b) =>
          a === null || b === null
            ? a === b
            : a.left === b.left &&
              a.top === b.top &&
              a.right === b.right &&
              a.bottom === b.bottom
      );

      requestAnimationFrame(testSize);
    }
  });

  const socialProofRef = useWritableValueWithCallbacks<View | null>(() => null);
  const socialProofStyleVWC = useMappedValueWithCallbacks(
    socialProofOpacityVWC,
    (opacity) => ({ opacity })
  );
  useStyleVWC(socialProofRef, socialProofStyleVWC);

  const oneMinuteButtonRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const oneMinuteButtonStyleVWC = useMappedValueWithCallbacks(
    oneMinuteButtonOpacityVWC,
    (opacity) => ({ opacity })
  );
  useStyleVWC(oneMinuteButtonRef, oneMinuteButtonStyleVWC);

  const longerClassButtonRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const longerClassButtonStyleVWC = useMappedValueWithCallbacks(
    longerClassButtonOpacityVWC,
    (opacity) => ({ opacity })
  );
  useStyleVWC(longerClassButtonRef, longerClassButtonStyleVWC);

  const holdoverEmotionWordRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const holdoverEmotionWordStyleVWC = useMappedValuesWithCallbacks(
    [
      holdoverEmotionWordOpacityVWC,
      state,
      realEmotionLocationVWC,
      holdoverEmotionMoveProgressVWC,
    ],
    (): ViewStyle => {
      const hints = state.get().show?.animationHints;
      if (hints === undefined) {
        return { display: 'none' };
      }

      const opacity = holdoverEmotionWordOpacityVWC.get();

      const start = hints.emotionStart;

      const startPaddingHorizontal = 24;
      const endPaddingHorizontal = 8;

      const startPaddingVertical = 18;
      const endPaddingVertical = 8;
      const startMinHeight = 60;

      const endRect = realEmotionLocationVWC.get();
      if (endRect === null) {
        return {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
          left: start.left,
          top: start.top,
          minHeight: startMinHeight,
          paddingHorizontal: startPaddingHorizontal,
          paddingVertical: startPaddingVertical,
        };
      }

      const endMinHeight = 24;

      const endLeft = endRect.left;
      const endTop = endRect.top;

      const moveProg = holdoverEmotionMoveProgressVWC.get();
      const left = start.left + (endLeft - start.left) * moveProg;
      const top = start.top + (endTop - start.top) * moveProg;
      const paddingHorizontal =
        startPaddingHorizontal +
        (endPaddingHorizontal - startPaddingHorizontal) * moveProg;
      const paddingVertical =
        startPaddingVertical +
        (endPaddingVertical - startPaddingVertical) * moveProg;
      const minHeight =
        startMinHeight + (endMinHeight - startMinHeight) * moveProg;
      return {
        display: opacity === 0 ? 'none' : 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        left,
        top,
        paddingVertical,
        paddingHorizontal,
        minHeight,
      };
    }
  );
  useStyleVWC(holdoverEmotionWordRef, holdoverEmotionWordStyleVWC);

  const holdoverEmotionWordTextStyleVWC = useMappedValuesWithCallbacks(
    [state, holdoverEmotionMoveProgressVWC],
    (): TextStyle => {
      const hints = state.get().show?.animationHints;
      if (hints === undefined) {
        return {};
      }

      const startFontSize = 16;
      const endFontSize = 28;
      const moveProg = holdoverEmotionMoveProgressVWC.get();
      const fontSize = startFontSize + (endFontSize - startFontSize) * moveProg;
      return {
        fontSize,
      };
    }
  );

  const emotionWordVWC = useMappedValueWithCallbacks(
    state,
    (s) => s.show?.emotion.word ?? ''
  );

  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const containerStyleVWC = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size) => ({ width: size.width, height: size.height })
  );
  useStyleVWC(containerRef, containerStyleVWC);

  const topBarHeight = useTopBarHeight();

  const freeClassTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const premiumClassTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const contentWidth = useContentWidth();
  const bottomBarHeight = useBotBarHeight();

  return (
    <View
      style={Object.assign({}, styles.container, containerStyleVWC.get())}
      ref={(r) => setVWC(containerRef, r)}
    >
      <SvgLinearGradient state={STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG} />

      <View
        style={Object.assign(
          {},
          styles.backButtonContainer,
          {
            paddingTop: topBarHeight,
          },
          backButtonStyleVWC.get()
        )}
        ref={(r) => setVWC(backButtonRef, r)}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => resources.get().onBack()}
        >
          <Back />
        </Pressable>
      </View>
      <View style={styles.content}>
        <View
          style={Object.assign({}, styles.titleWrapper, titleStyleVWC.get())}
          ref={(r) => setVWC(titleRef, r)}
        >
          <Text style={styles.title}>You want to feel</Text>
        </View>
        <RenderGuardedComponent
          props={emotionWordVWC}
          component={(word) => (
            <View
              style={Object.assign(
                {},
                styles.emotionWrapper,
                realEmotionStyleVWC.get()
              )}
              ref={(r) => setVWC(realEmotionRef, r)}
            >
              <Text style={styles.emotion}>{word}</Text>
            </View>
          )}
        />
        <View
          style={Object.assign(
            {},
            styles.socialProof,
            socialProofStyleVWC.get()
          )}
          ref={(r) => setVWC(socialProofRef, r)}
        >
          <RenderGuardedComponent
            props={useMappedValueWithCallbacks(
              resources,
              (r) => r.freeEmotionJourney.result?.numVotes ?? 0
            )}
            component={(votes) => (
              <Text style={styles.socialProofMessage}>
                {votes.toLocaleString()} others also chose this today
              </Text>
            )}
          />
          <View style={styles.socialProofPictures}>
            <ProfilePictures
              profilePictures={useMappedValueWithCallbacks(resources, (r) => ({
                pictures: r.socialProofPictures,
                additionalUsers: 0,
              }))}
              hereSettings={{ type: 'none' }}
              center
              size={24}
            />
          </View>
        </View>
      </View>
      <View style={styles.buttons}>
        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(
            resources,
            (r) => r.freeEmotionJourney.type === 'loading'
          )}
          component={(spinner) => (
            <View
              style={Object.assign(
                {},
                styles.button,
                oneMinuteButtonStyleVWC.get()
              )}
              ref={(r) => setVWC(oneMinuteButtonRef, r)}
            >
              <FilledInvertedButton
                onPress={() => resources.get().onTakeFreeJourney()}
                setTextStyle={(s) => setVWC(freeClassTextStyleVWC, s)}
                width={contentWidth}
                spinner={spinner}
              >
                <RenderGuardedComponent
                  props={freeClassTextStyleVWC}
                  component={(style) => (
                    <Text style={style}>Take a 1-minute Class</Text>
                  )}
                />
              </FilledInvertedButton>
            </View>
          )}
        />

        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(resources, (r) => ({
            spinner: r.havePro.type === 'loading',
            show:
              r.havePro.type === 'loading' ||
              (r.havePro.type === 'success' && !r.havePro.result) ||
              (r.premiumEmotionJourney.type !== 'unavailable' &&
                r.premiumEmotionJourney.type !== 'load-prevented'),
          }))}
          component={({ show, spinner }) =>
            !show ? (
              <></>
            ) : (
              <View
                style={Object.assign(
                  {},
                  styles.button,
                  longerClassButtonStyleVWC.get()
                )}
                ref={(r) => setVWC(longerClassButtonRef, r)}
              >
                <FilledPremiumButton
                  onPress={() => resources.get().onTakePremiumJourney()}
                  setTextStyle={(s) => setVWC(premiumClassTextStyleVWC, s)}
                  width={contentWidth}
                  spinner={spinner}
                >
                  <RenderGuardedComponent
                    props={premiumClassTextStyleVWC}
                    component={(style) => (
                      <Text style={style}>Take a Longer Class</Text>
                    )}
                  />
                </FilledPremiumButton>
              </View>
            )
          }
        />
      </View>
      <View style={{ width: 1, height: bottomBarHeight }} />

      <RenderGuardedComponent
        props={emotionWordVWC}
        component={(word) => (
          <View
            style={Object.assign(
              {},
              styles.holdoverEmotionWord,
              holdoverEmotionWordStyleVWC.get()
            )}
            ref={(r) => setVWC(holdoverEmotionWordRef, r)}
          >
            <RenderGuardedComponent
              props={holdoverEmotionWordTextStyleVWC}
              component={(style) => {
                return (
                  <Text
                    style={Object.assign(
                      {},
                      styles.holdoverEmotionWordText,
                      style
                    )}
                  >
                    {word}
                  </Text>
                );
              }}
              applyInstantly
            />
          </View>
        )}
      />
      <StatusBar style="light" />
    </View>
  );
};
