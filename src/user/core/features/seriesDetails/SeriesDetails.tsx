import { ReactElement, useCallback, useContext, useEffect } from 'react';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import {
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { FeatureComponentProps } from '../../models/Feature';
import { styles } from './SeriesDetailsStyles';
import { SeriesDetailsResources } from './SeriesDetailsResources';
import { SeriesDetailsState } from './SeriesDetailsState';
import { useUnwrappedValueWithCallbacks } from '../../../../shared/hooks/useUnwrappedValueWithCallbacks';
import { CourseJourney } from '../../../series/components/CourseJourney';
import { ModalsOutlet } from '../../../../shared/contexts/ModalContext';
import { useWorkingModal } from '../../../../shared/hooks/useWorkingModal';
import { MinimalCourseJourney } from '../../../favorites/lib/MinimalCourseJourney';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { journeyRefKeyMap } from '../../../journey/models/JourneyRef';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';
import { describeError } from '../../../../shared/lib/describeError';
import {
  Pressable,
  View,
  Text,
  StyleProp,
  TextStyle,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import FullHeartIcon from '../../../journey/icons/FullHeartIcon';
import EmptyHeartIcon from '../../../journey/icons/EmptyHeartIcon';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import Back from './assets/Back';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import { OutlineWhiteButton } from '../../../../shared/components/OutlineWhiteButton';
import { getPreviewableCourse } from '../../../series/lib/ExternalCourse';
import {
  DynamicAnimationEngineItemArg,
  useDynamicAnimationEngine,
} from '../../../../shared/anim/useDynamicAnimation';
import {
  playEntranceTransition,
  playExitTransition,
  useAttachDynamicEngineToTransition,
  useEntranceTransition,
  useOsehTransition,
  useSetTransitionReady,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import { ease } from '../../../../shared/lib/Bezier';
import { convertLogicalWidthToPhysicalWidth } from '../../../../shared/images/DisplayRatioHelper';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { OsehImageFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { debugView } from '../../../../shared/lib/debugView';
import { OpacityTransitionOverlay } from '../../../../shared/components/OpacityTransitionOverlay';

type SeriesDetailsTransition =
  | {
      type: 'swipe';
      /** If someone swipes to the left, then we enter from the right and exit to the left */
      direction: 'to-left' | 'to-right';
      ms: number;
    }
  | {
      type: 'fade';
      ms: number;
      individualFadeMS: number;
    }
  | {
      type: 'none';
      ms: number;
    };

export const SeriesDetails = ({
  state,
  resources,
}: FeatureComponentProps<SeriesDetailsState, SeriesDetailsResources>) => {
  const transition = useTransitionProp(
    (): SeriesDetailsTransition => ({
      type: 'fade',
      ms: 700,
      individualFadeMS: 350,
    })
  );
  useEntranceTransition(transition);

  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const modals = resources.get().modals;
  const loginContextRaw = useContext(LoginContext);

  const showing = useMappedValueWithCallbacks(state, (s) => s.show);
  const onCloseClick = useCallback(async () => {
    setVWC(transition.animation, {
      type: 'swipe',
      direction: 'to-right',
      ms: 350,
    });
    await playExitTransition(transition).promise;
    resources.get().goBack();
  }, [resources]);

  const hasEntitlementVWC = useMappedValueWithCallbacks(
    state,
    (s) => !!s.show?.hasEntitlement
  );

  const likedAtVWC = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(resources, (r) => r.courseLikeState.likedAt, {
      outputEqualityFn: Object.is,
    })
  );

  const goingToJourney = useWritableValueWithCallbacks(() => false);
  useWorkingModal(modals, goingToJourney, 700);

  const gotoJourneyError = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, gotoJourneyError, 'going to journey');

  const handleJourneyClick = useCallback(
    async (association: MinimalCourseJourney): Promise<void> => {
      const series = state.get().show;
      if (series === null || series === undefined || !series.hasEntitlement) {
        return;
      }

      const loginContextUnch = loginContextRaw.value.get();
      if (loginContextUnch.state !== 'logged-in') {
        return;
      }
      const loginContext = loginContextUnch;

      if (goingToJourney.get()) {
        return;
      }

      setVWC(goingToJourney, true);
      setVWC(gotoJourneyError, null);
      setVWC(transition.animation, {
        type: 'fade',
        ms: 700,
        individualFadeMS: 350,
      });
      const exitPromise = playExitTransition(transition);
      try {
        if (series.joinedAt === null) {
          const response = await apiFetch(
            '/api/1/courses/attach_via_jwt',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              body: JSON.stringify({
                course_uid: series.uid,
                course_jwt: series.jwt,
              }),
            },
            loginContext
          );
          if (!response.ok) {
            throw response;
          }
          await exitPromise.promise;
          state.get().setShow({ ...series, joinedAt: new Date() }, false);
        }
        const resp = await apiFetch(
          '/api/1/courses/start_journey',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              journey_uid: association.journey.uid,
              course_uid: series.uid,
              course_jwt: series.jwt,
            }),
          },
          loginContext
        );
        if (!resp.ok) {
          throw resp;
        }
        const data = await resp.json();
        const journey = convertUsingMapper(data, journeyRefKeyMap);
        await exitPromise.promise;
        resources.get().gotoJourney(journey, series);
      } catch (e) {
        const err = await describeError(e);
        await exitPromise.promise;
        setVWC(gotoJourneyError, err);
        await playEntranceTransition(transition).promise;
      } finally {
        setVWC(goingToJourney, false);
      }
    },
    [goingToJourney, gotoJourneyError, loginContextRaw.value, resources, state]
  );

  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  const contentStyleVWC = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size) => ({
      width: size.width,
      minHeight: size.height,
    })
  );
  useStyleVWC(contentRef, contentStyleVWC);
  const topBarHeight = useTopBarHeight();
  const botBarHeight = useBotBarHeight();
  const contentWidth = useContentWidth();
  const premiumButtonTextStyle = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  const previewableVWC = useMappedValueWithCallbacks(
    state,
    (s) =>
      s.show === null || s.show === undefined
        ? null
        : getPreviewableCourse(s.show),
    {
      inputEqualityFn: (a, b) => Object.is(a.show, b.show),
    }
  );

  const gotoPreviewTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  const engine = useDynamicAnimationEngine();
  const backgroundOpacityVWC = useWritableValueWithCallbacks<number>(() => 0);
  const foregroundLeftVWC = useWritableValueWithCallbacks(() => {
    const cfg = transition.animation.get();
    if (cfg.type !== 'swipe') {
      return 0;
    }
    if (cfg.direction === 'to-left') {
      return windowSizeVWC.get().width;
    } else {
      return -windowSizeVWC.get().width;
    }
  });
  const opacityInit = (): number => {
    const cfg = transition.animation.get();
    return cfg.type === 'fade' ? 0 : 1;
  };
  const closeOpacityVWC = useWritableValueWithCallbacks(opacityInit);
  const titleOpacityVWC = useWritableValueWithCallbacks(opacityInit);
  const instructorOpacityVWC = useWritableValueWithCallbacks(opacityInit);
  const descriptionOpacityVWC = useWritableValueWithCallbacks(opacityInit);
  const upgradeOpacityVWC = useWritableValueWithCallbacks(opacityInit);
  const numClassesOpacityVWC = useWritableValueWithCallbacks(opacityInit);
  const classOpacitiesVWC = useWritableValueWithCallbacks((): number[] => {
    const show = state.get().show;
    if (show === null || show === undefined) {
      return [];
    }

    const numClasses = Math.max(show.numJourneys, 1);
    const initialOpacity = opacityInit();
    return Array(numClasses).fill(initialOpacity);
  });
  const rewatchIntroOpacityVWC = useWritableValueWithCallbacks(opacityInit);

  useOsehTransition(
    transition,
    'swipe',
    (cfg) => {
      const startX = foregroundLeftVWC.get();
      const endX = 0;
      const dx = endX - startX;

      const crossFadeBkndStart = backgroundOpacityVWC.get();
      const crossFadeBkndDelta = 1 - crossFadeBkndStart;

      engine.play([
        {
          id: 'swipe-in',
          duration: cfg.ms,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(foregroundLeftVWC, startX + dx * progress);
            setVWC(
              backgroundOpacityVWC,
              crossFadeBkndStart + crossFadeBkndDelta * progress
            );
          },
        },
      ]);
    },
    (cfg) => {
      const startX = foregroundLeftVWC.get();
      const endX =
        cfg.direction === 'to-left'
          ? -windowSizeVWC.get().width
          : windowSizeVWC.get().width;
      const dx = endX - startX;
      const crossFadeBkndStart = backgroundOpacityVWC.get();
      const crossFadeBkndDelta = -crossFadeBkndStart;
      engine.play([
        {
          id: 'swipe-out',
          duration: cfg.ms,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(foregroundLeftVWC, startX + dx * progress);
            setVWC(
              backgroundOpacityVWC,
              crossFadeBkndStart + crossFadeBkndDelta * progress
            );
          },
        },
      ]);
    }
  );

  const makeFadeTransition = (
    forward: boolean
  ): ((cfg: SeriesDetailsTransition & { type: 'fade' }) => void) => {
    return (cfg) => {
      const classOpacities = ((): WritableValueWithCallbacks<number>[] => {
        const show = state.get().show;
        if (show === null || show === undefined) {
          return [];
        }

        const initialOpacities = classOpacitiesVWC.get();
        const result: WritableValueWithCallbacks<number>[] = [];
        Array(Math.max(show.numJourneys, 1))
          .fill(0)
          .forEach((_, i) => {
            const start =
              i > initialOpacities.length
                ? initialOpacities[initialOpacities.length - 1]
                : initialOpacities[i];
            const vwc = createWritableValueWithCallbacks(start);
            vwc.callbacks.add(() => {
              const myVal = vwc.get();
              const arr = classOpacitiesVWC.get();
              if (arr.length > i && arr[i] !== myVal) {
                arr[i] = myVal;
                classOpacitiesVWC.callbacks.call(undefined);
              }
            });
            result.push(vwc);
          });
        return result;
      })();

      const countingUpgrade =
        !state.get().show?.hasEntitlement &&
        state.get().show?.revenueCatEntitlement === 'pro';
      const countingRewatchInTime = !state.get().show?.hasEntitlement;

      const vwcAndIds: (
        | [string, WritableValueWithCallbacks<number>]
        | [string, WritableValueWithCallbacks<number>, boolean]
      )[] = [
        ['close', closeOpacityVWC],
        ['title', titleOpacityVWC],
        ['instructor', instructorOpacityVWC],
        ['description', descriptionOpacityVWC],
        ['upgrade', upgradeOpacityVWC, countingUpgrade],
        ['num-classes', numClassesOpacityVWC],
        ...classOpacities.map(
          (vwc, i): [string, WritableValueWithCallbacks<number>] => [
            `class-${i}`,
            vwc,
          ]
        ),
        ['rewatch', rewatchIntroOpacityVWC, countingRewatchInTime],
      ];

      if (!forward) {
        vwcAndIds.reverse();
      }

      const numFades = vwcAndIds
        .map((arr): number => (arr[2] ?? true ? 1 : 0))
        .reduce((tot, cur) => tot + cur, 0);
      const lastFadeStartsAt = Math.max(0, cfg.ms - cfg.individualFadeMS);
      const timeBetweenStarts = lastFadeStartsAt / (numFades - 1);

      let _ctr = 0;
      const makeNextFade = (
        id: string,
        vwc: WritableValueWithCallbacks<number>,
        counts: boolean
      ): DynamicAnimationEngineItemArg => {
        const fadeIndex = _ctr;
        if (counts) {
          _ctr++;
        }
        const start = vwc.get();
        const dx = forward ? 1 - start : -start;
        return {
          id,
          delayUntil: { type: 'ms', ms: timeBetweenStarts * fadeIndex },
          duration: cfg.individualFadeMS,
          progressEase: { type: 'bezier', bezier: ease },
          onFrame: (progress) => {
            setVWC(vwc, start + dx * progress);
          },
        };
      };

      engine.play([
        {
          id: 'fade-background',
          progressEase: { type: 'bezier', bezier: ease },
          duration: cfg.individualFadeMS,
          onFrame: (() => {
            const vwc = backgroundOpacityVWC;
            const start = vwc.get();
            const dx = forward ? 1 - start : -start;
            return (progress) => {
              setVWC(vwc, start + dx * progress);
            };
          })(),
        },
        ...vwcAndIds.map((arr) => makeNextFade(arr[0], arr[1], arr[2] ?? true)),
      ]);
    };
  };

  useOsehTransition(
    transition,
    'fade',
    makeFadeTransition(true),
    makeFadeTransition(false)
  );
  useAttachDynamicEngineToTransition(transition, engine);
  useSetTransitionReady(transition);

  const foregroundRef = useWritableValueWithCallbacks<View | null>(() => null);
  const foregroundStyleVWC = useMappedValuesWithCallbacks(
    [foregroundLeftVWC, windowSizeVWC],
    (): ViewStyle => {
      const size = windowSizeVWC.get();
      const left = foregroundLeftVWC.get();
      return {
        left: convertLogicalWidthToPhysicalWidth(Math.abs(left)) < 1 ? 0 : left,
        width: size.width,
        minHeight: size.height,
      };
    }
  );
  useStyleVWC(foregroundRef, foregroundStyleVWC);

  const closeButtonRef = useWritableValueWithCallbacks<View | null>(() => null);
  const closeButtonStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, closeOpacityVWC],
    () => {
      const size = windowSizeVWC.get();
      const opacity = closeOpacityVWC.get();
      return {
        paddingLeft:
          styles.closeButton.paddingLeft + (size.width - contentWidth) / 2,
        opacity: opacity >= 0.999 ? 1 : opacity,
      };
    }
  );
  useStyleVWC(closeButtonRef, closeButtonStyleVWC);

  const titleWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const titleWrapperStyleVWC = useMappedValueWithCallbacks(
    titleOpacityVWC,
    (opacity) => ({
      opacity: opacity >= 0.999 ? 1 : opacity,
    })
  );
  useStyleVWC(titleWrapperRef, titleWrapperStyleVWC);

  const likeButtonRef = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(likeButtonRef, titleWrapperStyleVWC);

  const instructorWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const instructorWrapperStyleVWC = useMappedValueWithCallbacks(
    instructorOpacityVWC,
    (opacity) => ({
      opacity: opacity >= 0.999 ? 1 : opacity,
    })
  );
  useStyleVWC(instructorWrapperRef, instructorWrapperStyleVWC);

  const descriptionWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const descriptionWrapperStyleVWC = useMappedValueWithCallbacks(
    descriptionOpacityVWC,
    (opacity) => ({
      opacity: opacity >= 0.999 ? 1 : opacity,
    })
  );
  useStyleVWC(descriptionWrapperRef, descriptionWrapperStyleVWC);

  const upgradeContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const upgradeContainerStyleVWC = useMappedValueWithCallbacks(
    upgradeOpacityVWC,
    (opacity) => ({
      opacity: opacity >= 0.999 ? 1 : opacity,
    })
  );
  useStyleVWC(upgradeContainerRef, upgradeContainerStyleVWC);

  const classesWrapperRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const classesWrapperStyleVWC = useMappedValueWithCallbacks(
    numClassesOpacityVWC,
    (opacity) => ({
      opacity: opacity >= 0.999 ? 1 : opacity,
    })
  );
  useStyleVWC(classesWrapperRef, classesWrapperStyleVWC);

  const classPlaceholderRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  const classPlaceholderStyleVWC = useMappedValueWithCallbacks(
    classOpacitiesVWC,
    (o) => {
      const opacity = o[0] ?? numClassesOpacityVWC.get();
      return {
        opacity: opacity >= 0.999 ? 1 : opacity,
      };
    }
  );
  useStyleVWC(classPlaceholderRef, classPlaceholderStyleVWC);

  const journeyRefs = useWritableValueWithCallbacks<(View | null)[]>(() =>
    Array(classOpacitiesVWC.get().length).fill(null)
  );
  useValuesWithCallbacksEffect([journeyRefs, classOpacitiesVWC], () => {
    const refs = journeyRefs.get();
    const opacities = classOpacitiesVWC.get();

    let fallbackOpacity = numClassesOpacityVWC.get();
    for (let i = 0; i < refs.length; i++) {
      const ele = refs[i];
      if (ele === null) {
        continue;
      }

      const opacity = i >= opacities.length ? fallbackOpacity : opacities[i];
      ele.setNativeProps({
        style: { opacity: opacity >= 0.999 ? 1 : opacity },
      });
      fallbackOpacity = opacity;
    }
    return undefined;
  });

  const footerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const footerStyleVWC = useMappedValueWithCallbacks(
    rewatchIntroOpacityVWC,
    (opacity) => ({
      opacity: opacity >= 0.999 ? 1 : opacity,
    })
  );
  useStyleVWC(footerRef, footerStyleVWC);

  const background = useMappedValueWithCallbacks(
    resources,
    (r) => r.backgroundImage
  );

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <OsehImageFromStateValueWithCallbacks state={background} />
      </View>
      <OpacityTransitionOverlay opacity={backgroundOpacityVWC} />
      <View
        style={Object.assign({}, styles.foreground, foregroundStyleVWC.get())}
        ref={(r) => setVWC(foregroundRef, r)}
      >
        <View
          style={Object.assign({}, styles.content, contentStyleVWC.get())}
          ref={(r) => setVWC(contentRef, r)}
        >
          <View
            style={Object.assign({}, styles.closeContainer, {
              paddingTop: styles.closeContainer.paddingTop + topBarHeight,
            })}
          >
            <Pressable
              style={Object.assign(
                {},
                styles.closeButton,
                closeButtonStyleVWC.get()
              )}
              onPress={onCloseClick}
              ref={(r) => setVWC(closeButtonRef, r)}
            >
              <Back />
            </Pressable>
          </View>
          <View style={styles.contentInnerContainer}>
            <ScrollView
              contentContainerStyle={Object.assign({}, styles.contentInner, {
                width: contentWidth,
                paddingBottom: styles.contentInner.paddingBottom + botBarHeight,
              })}
              scrollEnabled
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View
                    style={titleWrapperStyleVWC.get()}
                    ref={(r) => setVWC(titleWrapperRef, r)}
                  >
                    <RenderGuardedComponent
                      props={useMappedValueWithCallbacks(
                        showing,
                        (s) => s?.title
                      )}
                      component={(title) => (
                        <>
                          <Text style={styles.title}>{title}</Text>
                        </>
                      )}
                    />
                  </View>
                  <View
                    style={instructorWrapperStyleVWC.get()}
                    ref={(r) => setVWC(instructorWrapperRef, r)}
                  >
                    <RenderGuardedComponent
                      props={useMappedValueWithCallbacks(
                        showing,
                        (s) => s?.instructor?.name
                      )}
                      component={(instructor) => (
                        <>
                          <Text style={styles.instructor}>{instructor}</Text>
                        </>
                      )}
                    />
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <Pressable
                    style={Object.assign(
                      {},
                      styles.likeButton,
                      titleWrapperStyleVWC.get()
                    )}
                    ref={(r) => setVWC(likeButtonRef, r)}
                    onPress={() => {
                      resources.get().courseLikeState.toggleLike();
                    }}
                  >
                    <RenderGuardedComponent
                      props={likedAtVWC}
                      component={(likedAt) =>
                        likedAt === null ? (
                          <EmptyHeartIcon />
                        ) : (
                          <FullHeartIcon />
                        )
                      }
                    />
                  </Pressable>
                </View>
              </View>
              <View
                style={descriptionWrapperStyleVWC.get()}
                ref={(r) => setVWC(descriptionWrapperRef, r)}
              >
                <RenderGuardedComponent
                  props={useMappedValueWithCallbacks(
                    showing,
                    (s) => s?.description
                  )}
                  component={(description) => (
                    <Text style={styles.description}>{description}</Text>
                  )}
                />
              </View>
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(
                  showing,
                  (s) =>
                    s !== undefined &&
                    s !== null &&
                    !s.hasEntitlement &&
                    s.revenueCatEntitlement === 'pro'
                )}
                component={(showUpgrade) =>
                  !showUpgrade ? (
                    <></>
                  ) : (
                    <View
                      style={Object.assign(
                        {},
                        styles.upgradeContainer,
                        upgradeContainerStyleVWC.get()
                      )}
                      ref={(r) => setVWC(upgradeContainerRef, r)}
                    >
                      <FilledPremiumButton
                        onPress={() => {
                          resources.get().gotoUpgrade();
                        }}
                        setTextStyle={(s) => setVWC(premiumButtonTextStyle, s)}
                      >
                        <RenderGuardedComponent
                          props={premiumButtonTextStyle}
                          component={(s) => (
                            <Text style={s}>Unlock with OSEH+</Text>
                          )}
                        />
                      </FilledPremiumButton>
                    </View>
                  )
                }
              />
              <View style={styles.classes}>
                <View
                  style={classesWrapperStyleVWC.get()}
                  ref={(r) => setVWC(classesWrapperRef, r)}
                >
                  <RenderGuardedComponent
                    props={useMappedValueWithCallbacks(showing, (s) =>
                      s?.numJourneys?.toLocaleString()
                    )}
                    component={(numJourneys) => (
                      <Text style={styles.classesTitle}>
                        {numJourneys} classes
                      </Text>
                    )}
                  />
                </View>
                <View style={styles.classList}>
                  <RenderGuardedComponent
                    props={useMappedValuesWithCallbacks(
                      [resources, hasEntitlementVWC],
                      () => ({
                        journeys: resources.get().journeys,
                        hasEntitlement: hasEntitlementVWC.get(),
                      })
                    )}
                    component={({ journeys, hasEntitlement }) => (
                      <>
                        {journeys === null ? (
                          <View
                            style={classPlaceholderStyleVWC.get()}
                            ref={(r) => setVWC(classPlaceholderRef, r)}
                          >
                            <Text style={styles.classesPlaceholder}>
                              An error occurred, try reloading
                            </Text>
                          </View>
                        ) : journeys === undefined ? (
                          <View
                            style={classPlaceholderStyleVWC.get()}
                            ref={(r) => setVWC(classPlaceholderRef, r)}
                          >
                            <Text style={styles.classesPlaceholder}>
                              Loading...
                            </Text>
                          </View>
                        ) : journeys.length === 0 ? (
                          <View
                            style={classPlaceholderStyleVWC.get()}
                            ref={(r) => setVWC(classPlaceholderRef, r)}
                          >
                            <Text style={styles.classesPlaceholder}>
                              No classes found
                            </Text>
                          </View>
                        ) : (
                          journeys.map((association, idx) => (
                            <Pressable
                              key={association.priority}
                              style={Object.assign(
                                {},
                                styles.classButton,
                                (() => {
                                  const classOpacities =
                                    classOpacitiesVWC.get();
                                  const opacity =
                                    classOpacities[idx] ??
                                    (classOpacities.length === 0
                                      ? numClassesOpacityVWC.get()
                                      : classOpacities[
                                          classOpacities.length - 1
                                        ]);
                                  return {
                                    opacity: opacity >= 0.999 ? 1 : opacity,
                                  };
                                })()
                              )}
                              onPress={() => {
                                handleJourneyClick(association);
                              }}
                              ref={(r) => {
                                const refs = journeyRefs.get();
                                if (refs.length > idx) {
                                  refs[idx] = r;
                                  journeyRefs.callbacks.call(undefined);
                                }
                              }}
                              disabled={!hasEntitlement}
                            >
                              <CourseJourney
                                association={association}
                                index={idx}
                                imageHandler={resources.get().imageHandler}
                              />
                            </Pressable>
                          ))
                        )}
                      </>
                    )}
                  />
                </View>
              </View>
              <RenderGuardedComponent
                props={previewableVWC}
                component={(previewable) =>
                  previewable === null ? (
                    <></>
                  ) : (
                    <View
                      style={Object.assign(
                        {},
                        styles.footer,
                        footerStyleVWC.get()
                      )}
                      ref={(r) => setVWC(footerRef, r)}
                    >
                      <OutlineWhiteButton
                        onPress={async () => {
                          setVWC(transition.animation, {
                            type: 'fade',
                            ms: 700,
                            individualFadeMS: 350,
                          });
                          await playExitTransition(transition).promise;
                          resources.get().gotoCoursePreview(previewable);
                        }}
                        setTextStyle={(s) => setVWC(gotoPreviewTextStyleVWC, s)}
                      >
                        <RenderGuardedComponent
                          props={gotoPreviewTextStyleVWC}
                          component={(s) => (
                            <Text style={s}>
                              {previewable.hasEntitlement
                                ? 'Watch Introduction'
                                : 'Rewatch Introduction'}
                            </Text>
                          )}
                        />
                      </OutlineWhiteButton>
                    </View>
                  )
                }
              />
            </ScrollView>
          </View>
        </View>
        <ModalsOutlet modals={modals} />
      </View>
      <StatusBar style="light" />
    </View>
  );
};
