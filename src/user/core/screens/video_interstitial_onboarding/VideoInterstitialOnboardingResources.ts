import { ValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OnboardingVideo } from '../../../../shared/models/OnboardingVideo';
import { VideoInterstitialResources } from '../video_interstitial/VideoInterstitialResources';

export type VideoInterstitialOnboardingResources =
  VideoInterstitialResources & {
    /** The video to show, null if an error prevented us from loading, undefined while loading */
    videoRef: ValueWithCallbacks<OnboardingVideo | null | undefined>;
  };
