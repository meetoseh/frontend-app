import { ReactElement, useCallback } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { JourneyFeedbackResources } from './JourneyFeedbackResources';
import { JourneyFeedbackMappedParams } from './JourneyFeedbackParams';
import { styles } from './JourneyFeedbackStyles';
import { JourneyFeedback as JourneyFeedbackComponent } from '../../../journey/components/JourneyFeedback';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import {
  base64URLToByteArray,
  computeAverageRGBAUsingThumbhash,
} from '../../../../shared/lib/colorUtils';
import { IconButtonWithLabel } from '../../../../shared/forms/IconButtonWithLabel';
import { Share as ShareIcon } from './icons/Share';
import { EmptyHeartIcon } from '../series_details/icons/EmptyHeartIcon';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { waitForValueWithCallbacksConditionCancelable } from '../../../../shared/lib/waitForValueWithCallbacksCondition';
import { FullHeartIcon } from '../series_details/icons/FullHeartIcon';
import { createValueWithCallbacksEffect } from '../../../../shared/hooks/createValueWithCallbacksEffect';
import { useFavoritedModal } from '../../../favorites/hooks/useFavoritedModal';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { useUnfavoritedModal } from '../../../favorites/hooks/useUnfavoritedModal';
import { trackFavoritesChanged } from '../home/lib/trackFavoritesChanged';
import { storeResponse } from './lib/storeResponse';
import { makePrettyResponse } from './lib/makePrettyResponse';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { Share, View, Text, Platform } from 'react-native';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { OutlineWhiteButton } from '../../../../shared/components/OutlineWhiteButton';
import { configurableScreenOut } from '../../lib/configurableScreenOut';

/**
 * Allows the user to provide feedback on a journey
 */
export const JourneyFeedback = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'journey_feedback',
  JourneyFeedbackResources,
  JourneyFeedbackMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const backgroundAverageRGBVWC = useMappedValueWithCallbacks(
    resources.background.thumbhash,
    (th): [number, number, number] => {
      if (th === null) {
        return [0, 0, 0];
      }
      const rgba = computeAverageRGBAUsingThumbhash(base64URLToByteArray(th));
      return [rgba[0], rgba[1], rgba[2]];
    }
  );

  const transitionState = useStandardTransitionsState(transition);
  const workingVWC = useWritableValueWithCallbacks(() => false);

  const responseVWC = useWritableValueWithCallbacks<number | null>(() => null);
  const feedbackErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, feedbackErrorVWC, 'saving feedback');

  const shareErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, shareErrorVWC, 'sharing journey');

  const storeResponseWrapper = useCallback((): Promise<boolean> => {
    return storeResponse({
      responseVWC,
      trace,
      ctx,
      feedbackErrorVWC,
      journey: screen.parameters.journey,
    });
  }, [responseVWC, trace, ctx, feedbackErrorVWC, screen.parameters.journey]);

  const tracedResponse = useWritableValueWithCallbacks<number | null>(
    () => null
  );
  useValueWithCallbacksEffect(responseVWC, (response) => {
    if (response === tracedResponse.get()) {
      return undefined;
    }

    trace({
      type: 'changed',
      response,
      prettyResponse: makePrettyResponse(response),
    });
    setVWC(tracedResponse, response);
    return undefined;
  });

  const likeErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const showFavoritedUntilVWC = useWritableValueWithCallbacks<
    number | undefined
  >(() => undefined);
  const showUnfavoritedUntilVWC = useWritableValueWithCallbacks<
    number | undefined
  >(() => undefined);
  useValueWithCallbacksEffect(resources.likeState, (likeState) => {
    if (likeState === null) {
      setVWC(likeErrorVWC, null);
      setVWC(showFavoritedUntilVWC, undefined);
      setVWC(showUnfavoritedUntilVWC, undefined);
      return undefined;
    }

    const cleanupError = createValueWithCallbacksEffect(
      likeState.error,
      (e) => {
        setVWC(likeErrorVWC, e);
        return undefined;
      }
    );

    const cleanupFavorited = createValueWithCallbacksEffect(
      likeState.showLikedUntil,
      (u) => {
        setVWC(showFavoritedUntilVWC, u);
        return undefined;
      }
    );

    const cleanupUnfavorited = createValueWithCallbacksEffect(
      likeState.showUnlikedUntil,
      (u) => {
        setVWC(showUnfavoritedUntilVWC, u);
        return undefined;
      }
    );

    return () => {
      cleanupError();
      cleanupFavorited();
      cleanupUnfavorited();
    };
  });

  useErrorModal(modals, likeErrorVWC, 'favoriting or unfavoriting journey');
  useFavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showFavoritedUntilVWC),
    modals
  );
  useUnfavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showUnfavoritedUntilVWC),
    modals
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
      statusBar
    >
      <GridImageBackground
        image={resources.background.image}
        thumbhash={resources.background.thumbhash}
        size={ctx.windowSizeImmediate}
      />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <GridFullscreenContainer
          windowSizeImmediate={resources.share.sizeImmediate}
          modals={false}
          statusBar={false}
        >
          <GridImageBackground
            image={resources.share.image}
            thumbhash={resources.share.thumbhash}
            size={resources.share.sizeImmediate}
            borderRadius={10}
          />
          <GridContentContainer
            contentWidthVWC={ctx.contentWidth}
            gridSizeVWC={resources.share.sizeImmediate}
            justifyContent="flex-start"
            scrollable={false}
          >
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>
                {screen.parameters.journey.title}
              </Text>
              <Text style={styles.shareInstructor}>
                {screen.parameters.journey.instructor.name}
              </Text>
            </View>
            <HorizontalSpacer width={8} flexGrow={1} />
            <View style={styles.shareActions}>
              <RenderGuardedComponent
                props={resources.isShareable}
                component={(v) =>
                  !v?.shareable ? (
                    <></>
                  ) : (
                    <IconButtonWithLabel
                      icon={({ size }) => <ShareIcon size={{ height: size }} />}
                      label="Share Class"
                      averageBackgroundColor={backgroundAverageRGBVWC}
                      onClick={async () => {
                        trace({ type: 'share-start' });
                        const link =
                          ctx.resources.journeyShareLinkHandler.request({
                            ref: { uid: screen.parameters.journey.uid },
                            refreshRef: () => {
                              throw new Error('not implemented');
                            },
                          });
                        const linkData =
                          await waitForValueWithCallbacksConditionCancelable(
                            link.data,
                            (d) => d.type !== 'loading'
                          ).promise;
                        if (linkData.type === 'error') {
                          link.release();
                          trace({
                            type: 'share-error',
                            dataType: linkData.type,
                          });
                          setVWC(shareErrorVWC, linkData.error);
                          return;
                        }
                        if (linkData.type !== 'success') {
                          link.release();
                          trace({
                            type: 'share-error',
                            dataType: linkData.type,
                          });
                          setVWC(
                            shareErrorVWC,
                            <>
                              failed to load (expected success, got{' '}
                              {linkData.type})
                            </>
                          );
                          return;
                        }
                        const url = linkData.data.link;
                        if (url === null) {
                          link.release();
                          trace({
                            type: 'share-error',
                            dataType: 'success',
                            reason: 'url is null (not shareable)',
                          });
                          setVWC(
                            shareErrorVWC,
                            <>This journey cannot be shared at this time</>
                          );
                          return;
                        }

                        trace({ type: 'share-link', url });
                        try {
                          await Share.share(
                            Platform.select({
                              ios: { url: url },
                              default: { message: url },
                            })
                          );
                        } finally {
                          link.release();
                        }
                      }}
                    />
                  )
                }
              />
              <RenderGuardedComponent
                props={resources.likeState}
                component={(v) =>
                  v === null ? (
                    <></>
                  ) : (
                    <IconButtonWithLabel
                      icon={({ size }) => (
                        <RenderGuardedComponent
                          props={v.likedAt}
                          component={(likedAt) =>
                            likedAt === null ? (
                              <EmptyHeartIcon size={{ height: size }} />
                            ) : (
                              <FullHeartIcon size={{ height: size }} />
                            )
                          }
                        />
                      )}
                      label="Favorite"
                      averageBackgroundColor={backgroundAverageRGBVWC}
                      onClick={() => {
                        v.toggleLike();
                        trackFavoritesChanged(ctx);
                      }}
                    />
                  )
                }
              />
            </View>
          </GridContentContainer>
        </GridFullscreenContainer>
        <VerticalSpacer height={32} />
        <JourneyFeedbackComponent
          response={responseVWC}
          backgroundAverageRGB={backgroundAverageRGBVWC}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <TextStyleForwarder
          component={(styleVWC) => (
            <FilledInvertedButton
              onPress={() => {
                const cta = screen.parameters.cta1;
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  cta.exit,
                  cta.trigger,
                  {
                    beforeDone: async () => {
                      await storeResponseWrapper();
                    },
                    parameters:
                      cta.emotion === null || cta.emotion === ''
                        ? undefined
                        : { emotion: cta.emotion },
                  }
                );
              }}
              setTextStyle={(s) => setVWC(styleVWC, s)}
            >
              <RenderGuardedComponent
                props={styleVWC}
                component={(s) => (
                  <Text style={s}>{screen.parameters.cta1.text}</Text>
                )}
              />
            </FilledInvertedButton>
          )}
        />
        {screen.parameters.cta2 !== null && (
          <>
            <VerticalSpacer height={16} />
            <TextStyleForwarder
              component={(styleVWC) => (
                <OutlineWhiteButton
                  onPress={() => {
                    const cta = screen.parameters.cta2;
                    if (cta === null) {
                      setVWC(
                        feedbackErrorVWC,
                        <>cta2 is null but button handler called</>
                      );
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
                          await storeResponseWrapper();
                        },
                        parameters:
                          cta.emotion === null || cta.emotion === ''
                            ? undefined
                            : { emotion: cta.emotion },
                      }
                    );
                  }}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>{screen.parameters.cta2?.text}</Text>
                    )}
                  />
                </OutlineWhiteButton>
              )}
            />
          </>
        )}
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
