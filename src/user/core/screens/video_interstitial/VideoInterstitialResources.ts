import { ValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OsehTranscript } from '../../../../shared/transcripts/OsehTranscript';
import { ScreenResources } from '../../models/Screen';

export type VideoInterstitialResources = ScreenResources & {
  /**
   * The transcript for the video, if available.
   */
  transcript: ValueWithCallbacks<OsehTranscript | null | undefined>;
};
