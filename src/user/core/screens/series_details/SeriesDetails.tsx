import { Fragment, ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import {
  TransitionPropAsOwner,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { SeriesDetailsResources } from './SeriesDetailsResources';
import { SeriesDetailsMappedParams } from './SeriesDetailsParams';
import { styles } from './SeriesDetailsStyles';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useFavoritedModal } from '../../../favorites/hooks/useFavoritedModal';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { CourseLikeState } from '../../../series/lib/createSeriesLikeStateRequestHandler';
import { useUnfavoritedModal } from '../../../favorites/hooks/useUnfavoritedModal';
import { EmptyHeartIcon } from './icons/EmptyHeartIcon';
import { FullHeartIcon } from './icons/FullHeartIcon';
import { setVWC } from '../../../../shared/lib/setVWC';
import {
  GridImageBackground,
  GridImageWithSrc,
} from '../../../../shared/components/GridImageBackground';
import { OsehImageExportCropped } from '../../../../shared/images/OsehImageExportCropped';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { createValueWithCallbacksEffect } from '../../../../shared/hooks/createValueWithCallbacksEffect';
import { MinimalCourseJourney } from '../../../favorites/lib/MinimalCourseJourney';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { Check } from './icons/Check';
import { formatDurationClock } from '../../../../shared/lib/networkResponseUtils';
import { trackClassTaken } from '../home/lib/trackClassTaken';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { View, Text, Pressable } from 'react-native';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { OutlineWhiteButton } from '../../../../shared/components/OutlineWhiteButton';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import {
  base64URLToByteArray,
  computeAverageRGBAUsingThumbhash,
} from '../../../../shared/lib/colorUtils';
import { OsehColors } from '../../../../shared/OsehColors';
import { Back } from '../../../../shared/components/icons/Back';

/**
 * Displays the series details page on a specific series
 */
export const SeriesDetails = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'series_details',
  SeriesDetailsResources,
  SeriesDetailsMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar
      modals={modals}
    >
      <GridImageBackground
        image={resources.background}
        thumbhash={resources.backgroundThumbhash}
        size={ctx.windowSizeImmediate}
      />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={20} />
        <View style={styles.backWrapper}>
          <Pressable
            onPress={() => {
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.buttons.back.exit,
                screen.parameters.buttons.back.trigger,
                {
                  beforeDone: async () => {
                    trace({ type: 'back' });
                  },
                }
              );
            }}
          >
            <Back
              icon={{ width: 20 }}
              container={{ width: 60, height: 32 }}
              startPadding={{ x: { fraction: 0 }, y: { fraction: 0 } }}
              color={OsehColors.v4.primary.light}
            />
          </Pressable>
        </View>
        <VerticalSpacer height={20} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{screen.parameters.series.title}</Text>
            <VerticalSpacer height={2} />
            <Text style={styles.instructor}>
              {screen.parameters.series.instructor.name}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <RenderGuardedComponent
              props={resources.likeState}
              component={(likeState) => {
                if (likeState === null) {
                  return <></>;
                }

                return <Heart state={likeState} modals={modals} />;
              }}
            />
          </View>
        </View>
        <VerticalSpacer height={24} />
        <Text style={styles.description}>
          {screen.parameters.series.description}
        </Text>
        {!screen.parameters.series.hasEntitlement &&
          screen.parameters.series.revenueCatEntitlement === 'pro' && (
            <>
              <VerticalSpacer height={24} />
              <TextStyleForwarder
                component={(styleVWC) => (
                  <FilledPremiumButton
                    onPress={() => {
                      configurableScreenOut(
                        workingVWC,
                        startPop,
                        transition,
                        screen.parameters.buttons.buyNow.exit,
                        screen.parameters.buttons.buyNow.trigger,
                        {
                          endpoint: '/api/1/users/me/screens/pop_to_series',
                          parameters: {
                            series: {
                              uid: screen.parameters.series.uid,
                              jwt: screen.parameters.series.jwt,
                            },
                          },
                          beforeDone: async () => {
                            trace({ type: 'upgrade' });
                          },
                        }
                      );
                    }}
                    setTextStyle={(s) => setVWC(styleVWC, s)}
                  >
                    <RenderGuardedComponent
                      props={styleVWC}
                      component={(s) => (
                        <Text style={s}>Unlock with OSEH+</Text>
                      )}
                    />
                  </FilledPremiumButton>
                )}
              />
            </>
          )}
        <VerticalSpacer height={24} />
        <Text style={styles.numClasses}>
          {screen.parameters.series.numJourneys.toLocaleString()} Classes
        </Text>
        <VerticalSpacer height={8} />
        {Array(screen.parameters.series.numJourneys)
          .fill(null)
          .map((_, idx) => {
            return (
              <Fragment key={idx}>
                {idx > 0 && <VerticalSpacer height={8} />}
                <Journey
                  ctx={ctx}
                  screen={screen}
                  resources={resources}
                  startPop={startPop}
                  trace={trace}
                  transition={transition}
                  idx={idx}
                />
              </Fragment>
            );
          })}
        {screen.parameters.buttons.rewatchIntro !== null && (
          <>
            <VerticalSpacer height={40} />
            <TextStyleForwarder
              component={(styleVWC) => (
                <OutlineWhiteButton
                  onPress={() => {
                    const cta = screen.parameters.buttons.rewatchIntro;
                    if (cta === null) {
                      return;
                    }

                    configurableScreenOut(
                      workingVWC,
                      startPop,
                      transition,
                      cta.exit,
                      cta.trigger,
                      {
                        beforeDone: async () => {
                          trace({ type: 'rewatch_intro' });
                        },
                        endpoint: '/api/1/users/me/screens/pop_to_series',
                        parameters: {
                          series: {
                            uid: screen.parameters.series.uid,
                            jwt: screen.parameters.series.jwt,
                          },
                        },
                      }
                    );
                  }}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => <Text style={s}>Watch Introduction</Text>}
                  />
                </OutlineWhiteButton>
              )}
            />
          </>
        )}
        <VerticalSpacer height={24} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};

const Journey = ({
  ctx,
  screen,
  resources,
  idx,
  startPop,
  transition,
  trace,
}: ScreenComponentProps<
  'series_details',
  SeriesDetailsResources,
  SeriesDetailsMappedParams
> & {
  idx: number;
  transition: TransitionPropAsOwner<
    StandardScreenTransition['type'],
    StandardScreenTransition
  >;
}): ReactElement => {
  const backgroundVWC =
    useWritableValueWithCallbacks<OsehImageExportCropped | null>(() => null);
  useValueWithCallbacksEffect(resources.journeyBackgrounds, (vwcs) => {
    const vwc = vwcs[idx];
    if (vwc === null || vwc === undefined) {
      setVWC(backgroundVWC, null);
      return undefined;
    }

    return createValueWithCallbacksEffect(vwc, (v) => {
      setVWC(backgroundVWC, v);
      return undefined;
    });
  });

  const heightVWC = useWritableValueWithCallbacks<number | null>(() => null);
  useValueWithCallbacksEffect(heightVWC, (h) => {
    if (h === null) {
      return undefined;
    }

    const heights = resources.journeyBackgroundHeights.get();
    const expectedHeightVWC = heights[idx];
    if (expectedHeightVWC === null || expectedHeightVWC === undefined) {
      return undefined;
    }

    setVWC(expectedHeightVWC, h);
    return undefined;
  });

  const journeyVWC = useWritableValueWithCallbacks<MinimalCourseJourney | null>(
    () => null
  );
  useValueWithCallbacksEffect(resources.journeys, (course) => {
    if (course === null) {
      setVWC(journeyVWC, null);
      return undefined;
    }

    const journey = course.journeys[idx];
    setVWC(journeyVWC, journey ?? null);
  });

  const takenBeforeVWC = useMappedValueWithCallbacks(
    journeyVWC,
    (j) => j !== null && j.journey.lastTakenAt !== null
  );

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const imgContainerSize = useMappedValuesWithCallbacks(
    [heightVWC, ctx.contentWidth],
    () => ({
      width: ctx.contentWidth.get(),
      height: heightVWC.get() ?? 80,
    })
  );

  const backgroundThumbhashVWC = useMappedValueWithCallbacks(
    backgroundVWC,
    (v) => (v === null ? null : v.export.item.thumbhash)
  );
  const backgroundAverageColorVWC = useMappedValueWithCallbacks(
    backgroundThumbhashVWC,
    (thumbhash) =>
      thumbhash === null
        ? [0, 0, 0, 0]
        : computeAverageRGBAUsingThumbhash(base64URLToByteArray(thumbhash)),
    {
      inputEqualityFn: Object.is,
      outputEqualityFn: (a, b) =>
        a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
    }
  );
  const backgroundInfoVWC = useMappedValuesWithCallbacks(
    [backgroundVWC, backgroundAverageColorVWC],
    () => {
      const averageColorRGBA = backgroundAverageColorVWC.get();
      const averageColorCss = `rgb(${averageColorRGBA.slice(0, 3).join(',')})`;
      return {
        img: backgroundVWC.get(),
        avgColor: averageColorCss,
      };
    }
  );

  const inner = (
    <View
      style={styles.journey}
      onLayout={(e) => {
        const height = e?.nativeEvent?.layout?.height;
        if (
          height === null ||
          height === undefined ||
          isNaN(height) ||
          height <= 0
        ) {
          return;
        }
        setVWC(heightVWC, height);
      }}
    >
      <RenderGuardedComponent
        props={backgroundInfoVWC}
        component={({ img, avgColor }) =>
          img === null ? (
            <></>
          ) : (
            <RenderGuardedComponent
              props={imgContainerSize}
              component={(size) => (
                <GridImageWithSrc
                  src={img.croppedUrl}
                  size={size}
                  imgDisplaySize={{
                    width: img.croppedToDisplay.displayWidth,
                    height: img.croppedToDisplay.displayHeight,
                  }}
                  averageColor={avgColor}
                />
              )}
              applyInstantly
            />
          )
        }
      />
      <View style={styles.journeyForeground}>
        <View style={styles.journeyHeader}>
          <View style={styles.journeyHeaderLeft}>
            <RenderGuardedComponent
              props={takenBeforeVWC}
              component={(takenBefore) => (!takenBefore ? <></> : <Check />)}
            />
            <View style={styles.journeyCounterWrapper}>
              <Text style={styles.journeyCounterText}>
                {(idx + 1).toLocaleString()}.
              </Text>
            </View>
            <RenderGuardedComponent
              props={useMappedValueWithCallbacks(
                journeyVWC,
                (j) => j?.journey?.title ?? ''
              )}
              component={(title) => (
                <Text style={styles.journeyTitle}>{title}</Text>
              )}
            />
          </View>
          <View style={styles.journeyHeaderRight}>
            <RenderGuardedComponent
              props={takenBeforeVWC}
              component={(takenBefore) =>
                takenBefore ? (
                  <>
                    <Text style={styles.journeyPlayedText}>Played</Text>
                    <HorizontalSpacer width={8} />
                  </>
                ) : (
                  <></>
                )
              }
            />
            <View style={styles.journeyDurationWrapper}>
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(
                  journeyVWC,
                  (j) => j?.journey?.durationSeconds ?? 0
                )}
                component={(durationSeconds) => (
                  <Text style={styles.journeyDurationText}>
                    {formatDurationClock(durationSeconds, {
                      minutes: true,
                      seconds: true,
                      milliseconds: false,
                    })}
                  </Text>
                )}
              />
            </View>
          </View>
        </View>
        <VerticalSpacer height={7} />
        <VerticalSpacer height={0} flexGrow={1} />

        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(
            journeyVWC,
            (j) => j?.journey?.description ?? ''
          )}
          component={(description) => (
            <Text style={styles.journeyDescription}>{description}</Text>
          )}
        />
        <VerticalSpacer height={0} flexGrow={1} />
      </View>
    </View>
  );

  return screen.parameters.series.hasEntitlement ? (
    <Pressable
      onPress={() => {
        const journey = journeyVWC.get();
        if (journey === null) {
          return;
        }

        configurableScreenOut(
          workingVWC,
          startPop,
          transition,
          screen.parameters.buttons.takeClass.exit,
          screen.parameters.buttons.takeClass.trigger,
          {
            endpoint: '/api/1/users/me/screens/pop_to_series_class',
            parameters: {
              series: {
                uid: screen.parameters.series.uid,
                jwt: screen.parameters.series.jwt,
              },
              journey: {
                uid: journey.journey.uid,
              },
            },
            beforeDone: async () => {
              trace({
                type: 'journey',
                uid: journey.journey.uid,
                title: journey.journey.title,
              });
            },
            afterDone: () => {
              if (screen.parameters.buttons.takeClass.trigger !== null) {
                trackClassTaken(ctx);
              }
            },
          }
        );
      }}
    >
      {inner}
    </Pressable>
  ) : (
    inner
  );
};

const Heart = ({
  state,
  modals,
}: {
  state: CourseLikeState;
  modals: WritableValueWithCallbacks<Modals>;
}): ReactElement => {
  useFavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(state.showLikedUntil),
    modals
  );
  useUnfavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(state.showUnlikedUntil),
    modals
  );

  const workingVWC = useWritableValueWithCallbacks(() => false);

  return (
    <RenderGuardedComponent
      props={state.likedAt}
      component={(likedAt) => {
        if (likedAt === undefined) {
          return <></>;
        }

        return (
          <RenderGuardedComponent
            props={workingVWC}
            component={(disabled) => (
              <Pressable
                style={styles.heartWrapper}
                onPress={async () => {
                  setVWC(workingVWC, true);
                  try {
                    await state.toggleLike().promise;
                  } finally {
                    setVWC(workingVWC, false);
                  }
                }}
                disabled={disabled}
              >
                {likedAt === null ? (
                  <EmptyHeartIcon size={{ height: 20 }} />
                ) : (
                  <FullHeartIcon size={{ height: 20 }} />
                )}
              </Pressable>
            )}
          />
        );
      }}
    />
  );
};
