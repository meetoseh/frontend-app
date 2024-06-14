import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { CancelablePromise } from '../../../../shared/lib/CancelablePromise';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';
import { mapCancelable } from '../../../../shared/lib/mapCancelable';
import { setVWC } from '../../../../shared/lib/setVWC';
import {
  RequestResult,
  Result,
} from '../../../../shared/requests/RequestHandler';
import { unwrapRequestResult } from '../../../../shared/requests/unwrapRequestResult';
import { OsehTranscript } from '../../../../shared/transcripts/OsehTranscript';
import { OsehTranscriptRef } from '../../../../shared/transcripts/OsehTranscriptRef';
import { OsehScreen } from '../../models/Screen';
import { screenContentKeyMap } from '../../models/ScreenContent';
import { VideoInterstitial } from './VideoInterstitial';
import {
  VideoInterstitialAPIParams,
  VideoInterstitialMappedParams,
} from './VideoInterstitialParams';
import { VideoInterstitialResources } from './VideoInterstitialResources';

/**
 * An extremely basic screen with a header, message, and ok button.
 */
export const VideoInterstitialScreen: OsehScreen<
  'video_interstitial',
  VideoInterstitialResources,
  VideoInterstitialAPIParams,
  VideoInterstitialMappedParams
> = {
  slug: 'video_interstitial',
  paramMapper: (params) => ({
    ...params,
    video: convertUsingMapper(params.video, screenContentKeyMap),
  }),
  initInstanceResources: (ctx, screen, refreshScreen) => {
    const activeVWC = createWritableValueWithCallbacks(true);

    const getTranscript = () =>
      ctx.resources.transcriptHandler.request({
        ref: screen.parameters.video.transcript,
        refreshRef: (): CancelablePromise<Result<OsehTranscriptRef>> => {
          if (!activeVWC.get()) {
            return {
              promise: Promise.resolve({
                type: 'expired',
                data: undefined,
                error: <>Screen is not mounted</>,
                retryAt: undefined,
              }),
              done: () => true,
              cancel: () => {},
            };
          }

          return mapCancelable(
            refreshScreen(),
            (s): Result<OsehTranscriptRef> =>
              s.type !== 'success'
                ? s
                : s.data.parameters.video.transcript === null
                ? {
                    type: 'error',
                    data: undefined,
                    error: <>transcript is no longer available</>,
                    retryAt: undefined,
                  }
                : {
                    type: 'success',
                    data: s.data.parameters.video.transcript,
                    error: undefined,
                    retryAt: undefined,
                  }
          );
        },
      });

    const transcriptRequestVWC =
      createWritableValueWithCallbacks<RequestResult<OsehTranscript> | null>(
        screen.parameters.video.transcript === null ? null : getTranscript()
      );
    const [transcriptVWC, cleanupTranscriptUnwrapper] = unwrapRequestResult(
      transcriptRequestVWC,
      (d) => d.data,
      (d) => (d === null ? undefined : null)
    );

    return {
      ready: createWritableValueWithCallbacks(true),
      transcript: transcriptVWC,
      dispose: () => {
        setVWC(activeVWC, false);
        cleanupTranscriptUnwrapper();
        const transcript = transcriptRequestVWC.get();
        if (transcript !== null) {
          transcript.release();
          setVWC(transcriptRequestVWC, null);
        }
      },
    };
  },
  component: (props) => <VideoInterstitial {...props} />,
};
