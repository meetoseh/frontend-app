import { ReactElement, useCallback, useContext } from 'react';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { FeatureComponentProps } from '../../models/Feature';
import { styles } from './SeriesDetailsStyles';
import { SeriesDetailsResources } from './SeriesDetailsResources';
import { SeriesDetailsState } from './SeriesDetailsState';
import { useUnwrappedValueWithCallbacks } from '../../../../shared/hooks/useUnwrappedValueWithCallbacks';
import { CourseJourney } from '../../../series/components/CourseJourney';
import {
  ModalContext,
  Modals,
  ModalsOutlet,
} from '../../../../shared/contexts/ModalContext';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SvgLinearGradientBackground } from '../../../../shared/anim/SvgLinearGradientBackground';
import { STANDARD_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import FullHeartIcon from '../../../journey/icons/FullHeartIcon';
import EmptyHeartIcon from '../../../journey/icons/EmptyHeartIcon';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import Back from './assets/Back';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';

export const SeriesDetails = ({
  state,
  resources,
}: FeatureComponentProps<SeriesDetailsState, SeriesDetailsResources>) => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const modals = resources.get().modals;
  const loginContextRaw = useContext(LoginContext);

  const showing = useMappedValueWithCallbacks(state, (s) => s.show);
  const onCloseClick = useCallback(() => {
    state.get().setShow(null, true);
  }, [state]);

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
  useWorkingModal(modals, goingToJourney);

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
        resources.get().gotoJourney(journey, series);
      } catch (e) {
        const err = await describeError(e);
        setVWC(gotoJourneyError, err);
      } finally {
        setVWC(goingToJourney, false);
      }
    },
    [goingToJourney, gotoJourneyError, loginContextRaw.value, resources, state]
  );

  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([contentRef, windowSizeVWC], () => {
    const content = contentRef.get();
    const size = windowSizeVWC.get();

    if (content === null) {
      return;
    }
    content.setNativeProps({
      style: {
        width: size.width,
        minHeight: size.height,
      },
    });
    return undefined;
  });
  const topBarHeight = useTopBarHeight();
  const botBarHeight = useBotBarHeight();
  const contentWidth = useContentWidth();
  const premiumButtonTextStyle = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  return (
    <View style={styles.container}>
      <SvgLinearGradientBackground
        state={{
          type: 'react-rerender',
          props: STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
        containerStyle={styles.contentContainer}
      >
        <View style={styles.content} ref={(r) => setVWC(contentRef, r)}>
          <View
            style={Object.assign({}, styles.closeContainer, {
              paddingTop: styles.closeContainer.paddingTop + topBarHeight,
            })}
          >
            <Pressable style={styles.closeButton} onPress={onCloseClick}>
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
                <View style={styles.headerRight}>
                  <Pressable
                    style={styles.likeButton}
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
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(
                  showing,
                  (s) => s?.description
                )}
                component={(description) => (
                  <Text style={styles.description}>{description}</Text>
                )}
              />
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
                    <View style={styles.upgradeContainer}>
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
                          <Text style={styles.classesPlaceholder}>
                            An error occurred, try reloading
                          </Text>
                        ) : journeys === undefined ? (
                          <Text style={styles.classesPlaceholder}>
                            Loading...
                          </Text>
                        ) : journeys.length === 0 ? (
                          <Text style={styles.classesPlaceholder}>
                            No classes found
                          </Text>
                        ) : (
                          journeys.map((association, idx) => (
                            <Pressable
                              key={association.priority}
                              style={styles.classButton}
                              onPress={() => {
                                handleJourneyClick(association);
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
            </ScrollView>
          </View>
        </View>
        <ModalsOutlet modals={modals} />
      </SvgLinearGradientBackground>
      <StatusBar style="light" />
    </View>
  );
};
