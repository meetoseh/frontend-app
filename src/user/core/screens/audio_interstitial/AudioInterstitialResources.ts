import { AudioFileData } from '../../../../shared/content/createAudioDataHandler';
import { OsehAudioContentState } from '../../../../shared/content/createOsehAudioContentState';
import { OsehImageExportCropped } from '../../../../shared/images/OsehImageExportCropped';
import { ValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OsehTranscript } from '../../../../shared/transcripts/OsehTranscript';
import { ScreenResources } from '../../models/Screen';

export type AudioInterstitialResources = ScreenResources & {
  /**
   * The background image to use, or null if either the thumbhash or dark gray
   * gradient should be used
   */
  background: ValueWithCallbacks<OsehImageExportCropped | null>;

  /**
   * The audio to use
   */
  audio: ValueWithCallbacks<AudioFileData | null>;

  /**
   * The transcript for the video, if available.
   */
  transcript: ValueWithCallbacks<OsehTranscript | null | undefined>;
};
