import { ReactElement, useCallback } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import {
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import {
  ValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import {
  PlayerCTA,
  PlayerForeground,
} from '../../../../shared/content/player/PlayerForeground';
import { VideoInterstitialResources } from './VideoInterstitialResources';
import { VideoInterstitialMappedParams } from './VideoInterstitialParams';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { useCurrentTranscriptPhrases } from '../../../../shared/transcripts/useCurrentTranscriptPhrases';
import { useReactManagedValueAsValueWithCallbacks } from '../../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { useMediaInfo } from '../../../../shared/content/useMediaInfo';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { largestPhysicalPerLogical } from '../../../../shared/images/DisplayRatioHelper';
import { getEffectiveVideoTarget } from '../../../../shared/content/createVideoSizeComparerForTarget';
import { MediaInfoVideo } from '../../../../shared/content/MediaInfoVideo';
import { getNativeExport } from '../../../../shared/content/useOsehContentTarget';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * A basic full screen video interstitial
 */
export const VideoInterstitial = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'video_interstitial',
  VideoInterstitialResources,
  VideoInterstitialMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (v) => v.width
  );
  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const transcript = useCurrentTranscriptPhrases({
    transcript: resources.transcript,
  });
  const mediaInfo = useMediaInfo({
    currentTranscriptPhrasesVWC: transcript,
    autoplay: true,
  });

  const onFinish = () => {
    if (workingVWC.get()) {
      return;
    }

    setVWC(workingVWC, true);
    const finishPop = startPop(
      screen.parameters.trigger === null
        ? null
        : {
            slug: screen.parameters.trigger,
            parameters: {},
          }
    );
    setVWC(transition.animation, screen.parameters.exit);
    playExitTransition(transition).promise.finally(() => finishPop());
  };

  useValueWithCallbacksEffect(mediaInfo.ended, (ended) => {
    if (ended) {
      trace({ type: 'ended', time: mediaInfo.currentTime.get() });
      onFinish();
    }
    return undefined;
  });

  const cta = useReactManagedValueAsValueWithCallbacks<PlayerCTA>({
    title: screen.parameters.cta ?? 'Skip',
    action: async () => {
      trace({ type: 'skip', time: mediaInfo.currentTime.get() });
      onFinish();
    },
  });
  const title = useReactManagedValueAsValueWithCallbacks(
    screen.parameters.title
  );
  const subtitle = useReactManagedValueAsValueWithCallbacks(
    screen.parameters.subtitle
  );

  useValueWithCallbacksEffect(mediaInfo.paused, (paused) => {
    trace({
      type: 'paused-changed',
      paused,
      time: mediaInfo.currentTime.get(),
    });
    return undefined;
  });

  const videoVWC = useMappedValueWithCallbacks(
    ctx.windowSizeDebounced,
    (size) =>
      getNativeExport(
        screen.parameters.video.content.uid,
        screen.parameters.video.content.jwt,
        false,
        size
      )
  );

  const videoStyleVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (size): StyleProp<ViewStyle> => ({
      width: size.width,
      height: size.height,
    })
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar={screen.parameters.dark ? 'light' : 'dark'}
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={windowWidthVWC}
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable={false}
        noPointerEvents
        justifyContent="flex-start"
      >
        <MediaInfoVideo
          mediaInfo={mediaInfo}
          video={videoVWC}
          styleVWC={videoStyleVWC}
        />
      </GridContentContainer>
      <GridContentContainer
        contentWidthVWC={windowWidthVWC}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable={false}
        justifyContent="flex-start"
      >
        <PlayerForeground
          size={ctx.windowSizeImmediate}
          mediaInfo={mediaInfo}
          transcript={transcript}
          title={title}
          subtitle={
            screen.parameters.subtitle === null
              ? undefined
              : (subtitle as ValueWithCallbacks<string>)
          }
          cta={screen.parameters.cta === null ? undefined : cta}
          onClose={
            !screen.parameters.close
              ? undefined
              : createWritableValueWithCallbacks(async () => {
                  trace({
                    type: 'close-via-x',
                    time: mediaInfo.currentTime.get(),
                  });
                  onFinish();
                })
          }
          assumeDark={screen.parameters.dark}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
