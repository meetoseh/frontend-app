import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { createValueWithCallbacksEffect } from '../../../../shared/hooks/createValueWithCallbacksEffect';
import { createMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { OnboardingVideo } from '../../../../shared/models/OnboardingVideo';
import { RequestResult } from '../../../../shared/requests/RequestHandler';
import { createChainedRequest } from '../../../../shared/requests/createChainedRequest';
import { unwrapRequestResult } from '../../../../shared/requests/unwrapRequestResult';
import { OsehTranscript } from '../../../../shared/transcripts/OsehTranscript';
import { SplashScreen } from '../../../splash/SplashScreen';
import { createLoginContextRequest } from '../../lib/createLoginContextRequest';
import { OsehScreen } from '../../models/Screen';
import { VideoInterstitial } from '../video_interstitial/VideoInterstitial';
import {
  VideoInterstitialOnboardingAPIParams,
  VideoInterstitialOnboardingMappedParams,
} from './VideoInterstitialOnboardingParams';
import { VideoInterstitialOnboardingResources } from './VideoInterstitialOnboardingResources';

/**
 * An extremely basic screen with a header, message, and ok button.
 */
export const VideoInterstitialOnboardingScreen: OsehScreen<
  'video_interstitial_onboarding',
  VideoInterstitialOnboardingResources,
  VideoInterstitialOnboardingAPIParams,
  VideoInterstitialOnboardingMappedParams
> = {
  slug: 'video_interstitial_onboarding',
  paramMapper: (params) => ({
    ...params,
    __mapped: true,
  }),
  initInstanceResources: (ctx, screen, refreshScreen) => {
    const activeVWC = createWritableValueWithCallbacks(true);

    const getVideoRef = () =>
      createLoginContextRequest({
        ctx,
        handler: ctx.resources.onboardingVideoHandler,
      });

    const getTranscript = () =>
      createChainedRequest(getVideoRef, ctx.resources.transcriptHandler, {
        sync: (onboarding) => onboarding.transcript,
        async: undefined,
        cancelable: undefined,
      });

    const transcriptRequestVWC =
      createWritableValueWithCallbacks<RequestResult<OsehTranscript> | null>(
        getTranscript()
      );
    const [transcriptVWC, cleanupTranscriptUnwrapper] = unwrapRequestResult(
      transcriptRequestVWC,
      (d) => d.data,
      (d) => (d === null ? undefined : null)
    );

    const videoRefRequestVWC =
      createWritableValueWithCallbacks<RequestResult<OnboardingVideo> | null>(
        null
      );
    const cleanupVideoRefRequester = createValueWithCallbacksEffect(
      ctx.login.value,
      (ref) => {
        if (ref.state !== 'logged-in') {
          return undefined;
        }

        const req = getVideoRef();
        setVWC(videoRefRequestVWC, req);
        return () => {
          req.release();
          if (Object.is(videoRefRequestVWC.get(), req)) {
            setVWC(videoRefRequestVWC, null);
          }
        };
      }
    );

    const [videoRefVWC, cleanupVideoRefUnwrapper] = unwrapRequestResult(
      videoRefRequestVWC,
      (d) => d.data,
      (d) => (d === null || d.type === 'loading' ? undefined : null)
    );

    const [ready, cleanupReadyMapper] = createMappedValueWithCallbacks(
      videoRefVWC,
      (r) => r !== undefined
    );

    return {
      ready,
      videoRef: videoRefVWC,
      transcript: transcriptVWC,
      dispose: () => {
        setVWC(activeVWC, false);
        cleanupReadyMapper();
        cleanupVideoRefRequester();
        cleanupVideoRefUnwrapper();
        cleanupTranscriptUnwrapper();
        const transcript = transcriptRequestVWC.get();
        if (transcript !== null) {
          transcript.release();
          setVWC(transcriptRequestVWC, null);
        }
      },
    };
  },
  component: (props) => (
    <RenderGuardedComponent
      props={props.resources.videoRef}
      component={(videoRef) => {
        if (videoRef === undefined) {
          return <SplashScreen />;
        }

        if (videoRef === null) {
          props.trace({ type: 'skip', reason: 'video failed to load' });
          props.startPop(null)();
          return <SplashScreen />;
        }

        return (
          <VideoInterstitial
            {...props}
            screen={{
              ...props.screen,
              parameters: {
                ...props.screen.parameters,
                video: {
                  content: videoRef.video,
                  transcript: videoRef.transcript,
                },
              },
            }}
          />
        );
      }}
    />
  ),
};
