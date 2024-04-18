import { ReactElement, useCallback, useContext } from 'react';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { LoginContext } from '../../../shared/contexts/LoginContext';
import { styles } from './JourneyFeedbackScreenStyles';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { useToggleFavorited } from '../hooks/useToggleFavorited';
import { useShareClass } from '../hooks/useShareClass';
import { useWritableValueWithCallbacks } from '../../../shared/lib/Callbacks';
import {
  base64URLToByteArray,
  computeAverageRGBAUsingThumbhash,
} from '../../../shared/lib/colorUtils';
import { VerticalLayout } from '../../../shared/responsive/VerticalLayout';
import { useVerticalLayout } from '../../../shared/responsive/useVerticalLayout';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { setVWC } from '../../../shared/lib/setVWC';
import { useValuesWithCallbacksEffect } from '../../../shared/hooks/useValuesWithCallbacksEffect';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { OsehImageProps } from '../../../shared/images/OsehImageProps';
import { useOsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import { useOsehImageStateValueWithCallbacks } from '../../../shared/images/useOsehImageStateValueWithCallbacks';
import { areOsehImageStatesEqual } from '../../../shared/images/OsehImageState';
import { useReactManagedValueAsValueWithCallbacks } from '../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { Modals, ModalsOutlet } from '../../../shared/contexts/ModalContext';
import { OsehImageBackgroundFromStateValueWithCallbacks } from '../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks';
import { Platform, StyleProp, Text, TextStyle, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStaleOsehImageOnSwap } from '../../../shared/images/useStaleOsehImageOnSwap';
import { apiFetch } from '../../../shared/lib/apiFetch';
import {
  useOnLayout,
  useResponsiveRefs,
} from '../../../shared/responsive/useResponsiveRefs';
import { useContentWidth } from '../../../shared/lib/useContentWidth';
import { FilledInvertedButton } from '../../../shared/components/FilledInvertedButton';
import { OutlineWhiteButton } from '../../../shared/components/OutlineWhiteButton';
import { JourneyFeedback } from '../components/JourneyFeedback';
import Share from '../icons/Share';
import { IconButtonWithLabel } from '../../../shared/forms/IconButtonWithLabel';
import FullHeartIcon from '../icons/FullHeartIcon';
import EmptyHeartIcon from '../icons/EmptyHeartIcon';
import {
  onJourneyRated,
  onReviewRequested,
} from '../lib/JourneyFeedbackRequestReviewStore';
import StoreReview from 'expo-store-review';

type VLKey =
  | 'topPadding'
  | 'image'
  | 'imageFeedbackMargin'
  | 'feedback'
  | 'feedbackControlsMargin'
  | 'finish'
  | 'finishAnotherMargin'
  | 'another'
  | 'bottomPadding';

const baseVerticalLayout: VerticalLayout<VLKey> = {
  topPadding: { minHeight: 48, scaling: { 2: { end: 96 }, 3: {} } },
  image: { minHeight: 237, scaling: { 1: { end: 390 } } },
  imageFeedbackMargin: { minHeight: 32, scaling: {} },
  feedback: { minHeight: 93, scaling: {} },
  feedbackControlsMargin: { minHeight: 32, scaling: {} },
  finish: { minHeight: 56, scaling: {} },
  finishAnotherMargin: { minHeight: 12, scaling: {} },
  another: { minHeight: 56, scaling: {} },
  bottomPadding: {
    minHeight: 20,
    scaling: { 2: { end: 40 }, 3: {} },
  },
};

const baseVerticalLayoutWithoutAnother: VerticalLayout<VLKey> = {
  ...baseVerticalLayout,
  finishAnotherMargin: { minHeight: 0, scaling: {} },
  another: { minHeight: 0, scaling: {} },
};

const verticalLayoutKeys = Object.keys(baseVerticalLayout) as VLKey[];
const verticalLayoutApplyKeys = [
  'topPadding',
  'imageFeedbackMargin',
  'feedbackControlsMargin',
  'finishAnotherMargin',
  'bottomPadding',
] as const;

/**
 * Asks the user for feedback about the journey so that we can curate the
 * content that they see. They are also given the opportunity to jump straight
 * into another class or share the class they just took (if it's shareable)
 */
export const JourneyFeedbackScreen = ({
  journey,
  shared,
  takeAnother,
  onJourneyFinished,
}: JourneyScreenProps): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const loginContextRaw = useContext(LoginContext);

  const toggleFavorited = useToggleFavorited({
    modals,
    journey: { type: 'react-rerender', props: journey },
    shared,
  });
  const shareClass = useShareClass({
    journey: { type: 'react-rerender', props: journey },
  });
  const onToggleFavorited = useCallback(async () => {
    toggleFavorited();
  }, [toggleFavorited]);
  const onShareClass = useCallback(async () => {
    shareClass.shareClass();
  }, [shareClass]);

  const responseVWC = useWritableValueWithCallbacks<number | null>(() => null);

  const backgroundAverageRGB = useMappedValueWithCallbacks(
    shared,
    (s): [number, number, number] => {
      if (s.darkenedImage.thumbhash === null) {
        return [0.2, 0.2, 0.2];
      }

      const thumbhashBytes = base64URLToByteArray(s.darkenedImage.thumbhash);
      const averageRGBA = computeAverageRGBAUsingThumbhash(thumbhashBytes);
      return [averageRGBA[0], averageRGBA[1], averageRGBA[2]];
    },
    {
      outputEqualityFn: (a, b) =>
        a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
    }
  );

  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const contentWidth = useContentWidth();
  const fontScale = useMappedValueWithCallbacks(
    windowSizeVWC,
    (s) => s.fontScale
  );
  const height = useMappedValueWithCallbacks(windowSizeVWC, (s) => s.height);

  const refs = useResponsiveRefs<VLKey>(verticalLayoutKeys);

  const layout = useReactManagedValueAsValueWithCallbacks(
    (() => {
      if (takeAnother === null) {
        return baseVerticalLayoutWithoutAnother;
      }
      return baseVerticalLayout;
    })(),
    Object.is
  );

  const [, appliedVerticalLayout, scrollingRequired] = useVerticalLayout(
    layout,
    height,
    refs
  );

  const feedbackImageProps = useMappedValuesWithCallbacks(
    [appliedVerticalLayout],
    (): OsehImageProps => ({
      uid: journey.darkenedBackgroundImage.uid,
      jwt: journey.darkenedBackgroundImage.jwt,
      displayWidth: contentWidth,
      displayHeight: appliedVerticalLayout.get().image,
      alt: '',
    })
  );

  const imageHandler = useOsehImageStateRequestHandler({});
  const feedbackImageRaw = useStaleOsehImageOnSwap(
    useOsehImageStateValueWithCallbacks(
      {
        type: 'callbacks',
        props: feedbackImageProps.get,
        callbacks: feedbackImageProps.callbacks,
      },
      imageHandler
    )
  );
  const feedbackImage = useMappedValuesWithCallbacks(
    [feedbackImageRaw, shared],
    () => {
      const v = feedbackImageRaw.get();
      if (v.thumbhash !== null) {
        return v;
      }
      return {
        ...v,
        thumbhash: shared.get().darkenedImage.thumbhash,
      };
    },
    {
      outputEqualityFn: areOsehImageStatesEqual,
    }
  );

  useValuesWithCallbacksEffect(
    [
      appliedVerticalLayout,
      ...verticalLayoutApplyKeys.map((key) => refs[key].ref),
    ],
    () => {
      const applied = appliedVerticalLayout.get();
      verticalLayoutApplyKeys.forEach((key) => {
        const ele = refs[key].ref.get();
        if (ele === null) {
          return;
        }

        ele.setNativeProps({
          style: {
            minHeight: applied[key],
          },
        });
      });
      return undefined;
    }
  );

  const storeResponse = useCallback(async () => {
    const response = responseVWC.get() as 1 | 2 | 3 | 4;
    const loginContextUnch = loginContextRaw.value.get();
    if (response === null || loginContextUnch.state !== 'logged-in') {
      return;
    }
    const loginContext = loginContextUnch;

    const resp = await apiFetch(
      '/api/1/journeys/feedback',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          journey_uid: journey.uid,
          journey_jwt: journey.jwt,
          version: 'oseh_jf-otp_sKjKVHs8wbI',
          response: response,
          feedback: null,
        }),
        keepalive: true,
      },
      loginContext
    );

    if (!resp.ok) {
      console.warn('Failed to store feedback response', resp);
    }
  }, [loginContextRaw, responseVWC, journey.uid, journey.jwt]);

  const handleRequestReview = useCallback(async () => {
    const loginContextUnch = loginContextRaw.value.get();
    if (loginContextUnch.state !== 'logged-in') {
      return;
    }
    const loginContext = loginContextUnch;

    const response = responseVWC.get() as null | 1 | 2 | 3 | 4;
    if (
      response !== null &&
      (await onJourneyRated(journey.uid, response)) &&
      StoreReview?.requestReview !== undefined
    ) {
      apiFetch(
        '/api/1/notifications/inapp/start',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            inapp_notification_uid: 'oseh_ian_P1LDF0FIWtqnU4D0FsOZgg',
            platform: Platform.OS,
          }),
        },
        loginContext
      );
      await StoreReview.requestReview();
      await onReviewRequested();
    }
  }, [responseVWC, journey.uid]);

  const onContinue = useCallback(async () => {
    storeResponse();
    await handleRequestReview();
    onJourneyFinished(false);
  }, [onJourneyFinished, storeResponse]);

  const onTakeAnother = useCallback(async () => {
    storeResponse();
    await handleRequestReview();
    takeAnother?.onTakeAnother();
  }, [storeResponse, takeAnother]);

  const takeAnotherForwardOnLayout = useOnLayout('another', refs);
  const continueTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const takeAnotherTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  return (
    <RenderGuardedComponent
      props={fontScale}
      component={(scale) => (
        <View style={styles.container}>
          <OsehImageBackgroundFromStateValueWithCallbacks
            state={useMappedValueWithCallbacks(shared, (s) => s.blurredImage)}
            style={{
              ...styles.innerContainer,
              width: windowSizeVWC.get().width,
              height: windowSizeVWC.get().height,
            }}
            scrolling={scrollingRequired ? 'forced' : 'disabled'}
          >
            <View
              ref={(v) => setVWC(refs.topPadding.ref, v)}
              collapsable={false}
              onLayout={useOnLayout('topPadding', refs)}
              style={{
                minHeight: appliedVerticalLayout.get().topPadding,
              }}
            />
            <View style={styles.shareContainerWrapper}>
              <OsehImageBackgroundFromStateValueWithCallbacks
                state={feedbackImage}
                styleVWC={useMappedValueWithCallbacks(
                  appliedVerticalLayout,
                  () => ({
                    ...styles.shareContainer,
                    width: contentWidth,
                    height: appliedVerticalLayout.get().image,
                  })
                )}
                scrolling="disabled"
              >
                <View
                  style={Object.assign({}, styles.shareInfo, {
                    padding: styles.shareInfo.padding * scale,
                  })}
                >
                  <Text style={styles.shareTitle}>{journey.title}</Text>
                  <Text style={styles.shareInstructor}>
                    {journey.instructor.name}
                  </Text>
                </View>
                <View
                  style={Object.assign({}, styles.shareControls, {
                    gap: styles.shareControls.gap * scale,
                    padding: styles.shareControls.padding * scale,
                  })}
                >
                  <RenderGuardedComponent
                    props={shareClass.shareable}
                    component={(shareable) =>
                      shareable === false ? (
                        <></>
                      ) : (
                        <RenderGuardedComponent
                          props={shareClass.working}
                          component={(working) => (
                            <IconButtonWithLabel
                              icon={(props) => (
                                <Share
                                  width={props.size * (17 / 20)}
                                  height={props.size}
                                />
                              )}
                              label="Share Class"
                              onClick={onShareClass}
                              disabled={working}
                              spinner={working}
                            />
                          )}
                        />
                      )
                    }
                  />
                  <RenderGuardedComponent
                    props={shared}
                    component={(s) => (
                      <>
                        {s.favorited !== null && (
                          <IconButtonWithLabel
                            icon={(props) =>
                              s.favorited ? (
                                <FullHeartIcon
                                  width={props.size}
                                  height={props.size}
                                />
                              ) : (
                                <EmptyHeartIcon
                                  width={props.size}
                                  height={props.size}
                                />
                              )
                            }
                            label="Favorite"
                            onClick={onToggleFavorited}
                          />
                        )}
                      </>
                    )}
                  />
                </View>
              </OsehImageBackgroundFromStateValueWithCallbacks>
            </View>
            <View
              ref={(v) => setVWC(refs.imageFeedbackMargin.ref, v)}
              collapsable={false}
              onLayout={useOnLayout('imageFeedbackMargin', refs)}
              style={{
                minHeight: appliedVerticalLayout.get().imageFeedbackMargin,
              }}
            />
            <View
              ref={(v) => setVWC(refs.feedback.ref, v)}
              collapsable={false}
              onLayout={useOnLayout('feedback', refs)}
              style={Object.assign({}, styles.feedback, {
                width: contentWidth,
              })}
            >
              <Text style={styles.feedbackText}>How did that class feel?</Text>
              <JourneyFeedback
                response={responseVWC}
                backgroundAverageRGB={backgroundAverageRGB}
              />
            </View>
            <View
              ref={(v) => setVWC(refs.feedbackControlsMargin.ref, v)}
              collapsable={false}
              onLayout={useOnLayout('feedbackControlsMargin', refs)}
              style={{
                minHeight: appliedVerticalLayout.get().feedbackControlsMargin,
              }}
            />
            <FilledInvertedButton
              onPress={onContinue}
              width={contentWidth}
              setTextStyle={(s) => setVWC(continueTextStyleVWC, s)}
              refVWC={refs.finish.ref}
              onLayout={useOnLayout('finish', refs)}
            >
              <RenderGuardedComponent
                props={continueTextStyleVWC}
                component={(s) => <Text style={s}>Finish</Text>}
              />
            </FilledInvertedButton>
            <View
              ref={(r) => setVWC(refs.finishAnotherMargin.ref, r)}
              onLayout={useOnLayout('finishAnotherMargin', refs)}
              style={{
                minHeight: appliedVerticalLayout.get().finishAnotherMargin,
              }}
            />
            {takeAnother !== null && (
              <OutlineWhiteButton
                onPress={onTakeAnother}
                width={contentWidth}
                setTextStyle={(s) => setVWC(takeAnotherTextStyleVWC, s)}
                refVWC={refs.another.ref}
                onLayout={takeAnotherForwardOnLayout}
              >
                <RenderGuardedComponent
                  props={takeAnotherTextStyleVWC}
                  component={(s) => (
                    <Text style={s}>
                      Take another {takeAnother.emotion} class
                    </Text>
                  )}
                />
              </OutlineWhiteButton>
            )}
            <View
              ref={(v) => setVWC(refs.bottomPadding.ref, v)}
              collapsable={false}
              onLayout={useOnLayout('bottomPadding', refs)}
              style={{
                minHeight: appliedVerticalLayout.get().bottomPadding,
              }}
            />

            <ModalsOutlet modals={modals} />
          </OsehImageBackgroundFromStateValueWithCallbacks>
          <StatusBar style="light" />
        </View>
      )}
    />
  );
};
