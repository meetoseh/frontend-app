import { OsehContentRefLoadable } from '../content/OsehContentRef';
import { OsehImageRef } from '../images/OsehImageRef';
import { CrudFetcherMapper } from '../lib/CrudFetcher';
import { OsehTranscriptRef } from '../transcripts/OsehTranscriptRef';

/**
 * Describes a full-screen onboarding video that can be shown
 */
export type OnboardingVideo = {
  /** The uid of the onboarding video association */
  onboardingVideoUid: string;
  /** The actual video */
  video: OsehContentRefLoadable;
  /** The cover image / thumbnail image */
  thumbnail: OsehImageRef;
  /** The transcript for the video, if available */
  transcript: OsehTranscriptRef | null;
};

export const onboardingVideoKeyMap: CrudFetcherMapper<OnboardingVideo> = {
  onboarding_video_uid: 'onboardingVideoUid',
};
