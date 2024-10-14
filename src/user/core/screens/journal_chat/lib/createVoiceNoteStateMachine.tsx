import { ReactElement } from 'react';
import { OsehContentRefLoadable } from '../../../../../shared/content/OsehContentRef';
import {
  createWritableValueWithCallbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { RequestResult } from '../../../../../shared/requests/RequestHandler';
import {
  OsehTranscript,
  osehTranscriptMapper,
} from '../../../../../shared/transcripts/OsehTranscript';
import {
  upload,
  UploadResult,
  uploadStandardEndpointTryUpload,
  uploadStandardURIGetData,
} from '../../../../../shared/lib/uploadHelpers';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { waitForValueWithCallbacksConditionCancelable } from '../../../../../shared/lib/waitForValueWithCallbacksCondition';
import { CancelablePromise } from '../../../../../shared/lib/CancelablePromise';
import { LoginContextValue } from '../../../../../shared/contexts/LoginContext';
import {
  convertToRange,
  parseUploadInfoFromResponse,
} from '../../../../../shared/upload/UploadInfo';
import {
  getOrCreateClientKey,
  JournalClientKey,
  WrappedJournalClientKey,
} from '../../../../../shared/journals/clientKeys';
import { Visitor } from '../../../../../shared/hooks/useVisitorValueWithCallbacks';
import { createFernet } from '../../../../../shared/lib/fernet';
import { getCurrentServerTimeMS } from '../../../../../shared/lib/getCurrentServerTimeMS';
import { convertUsingMapper } from '../../../../../shared/lib/CrudFetcher';
import { waitForAnimationFrameCancelable } from '../../../../../shared/lib/waitForAnimationFrameCancelable';
import { passMessageWithVWC } from '../../../../../shared/lib/passMessageWithVWC';
import { receiveMessageWithVWC } from '../../../../../shared/lib/receiveMessageWithVWC';
import {
  createSmartAPIFetch,
  createTypicalSmartAPIFetchMapper,
  SmartAPIFetch,
} from '../../../../../shared/lib/smartApiFetch';
import { Resources } from '../../../models/Resources';
import { Audio } from 'expo-av';
import { AudioFileData } from '../../../../../shared/content/createAudioDataHandler';
import { ContentFileNativeExport } from '../../../../../shared/content/OsehContentTarget';
import * as FileSystem from 'expo-file-system';
import { createOsehAudioContentState } from '../../../../../shared/content/createOsehAudioContentState';
import { makeTextError } from '../../../../../shared/lib/describeError';
import { exactIntDivide } from '../../../../../shared/lib/exactIntDivide';

/**
 * Previous states:
 * - none, this is an initial state
 *
 * Transitions:
 * - `initialized-for-recording`: once the media recorder is ready
 * - `error`: if the media recorder fails to initialize
 * - `released`: if the voice note is released before the media recorder is ready
 */
export type VoiceNoteStateInitializingForRecording = {
  /**
   * - `initializing-for-recording`: we are currently setting up the voice note to
   *   be able to record audio
   */
  type: 'initializing-for-recording';
  /**
   * The login context to use when initializing the upload
   */
  loginContext: LoginContextValue;
  audio?: undefined;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;
};

/**
 * Previous states:
 * - `initializing-for-recording`
 *
 * Transitions:
 * - `recording`: when recording starts
 * - `error`: if you try to start recording and it fails
 * - `released`: if the voice note is released before recording starts
 */
export type VoiceNoteStateInitializedForRecording = {
  /**
   * - `initialized-for-recording`: we have completed setup and are ready to
   *   record audio
   */
  type: 'initialized-for-recording';

  /**
   * The login context to use when initializing the upload
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the underlying voice note audio */
  audio: {
    /** the MediaRecorder that will be used to record _and encode_ audio */
    recorder: Audio.Recording;

    /** analysis on the audio for visualization */
    analysis: {};

    playable?: undefined;
  };
};

/**
 * Previous states:
 * - `initialized-for-recording`
 *
 * Transitions:
 * - `recorded`: when recording stops
 * - `error`: if an error event is emitted by the recorder
 * - `released`: if the voice note is released before recording stops
 */
export type VoiceNoteStateRecording = {
  /**
   * - `recording`: we are currently recording audio and are ready to stop
   */
  type: 'recording';

  /**
   * The login context to use when initializing the upload
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** When we started recording, approximately */
  recordingStartedAt: {
    /**
     * the current closest approximation for the Date.now() value that,
     * if you take Date.now() - recordingStartedAt, will give you the
     * duration of the recording in milliseconds
     *
     * we adjust this value to be as close as possible to the actual
     * over the course of the recording (unlike on web)
     */
    asDateNow: ValueWithCallbacks<number>;
  };

  /** the underlying voice note audio */
  audio: {
    /** the MediaRecorder that is currently recording audio */
    recorder: Audio.Recording;

    /** analysis on the audio for visualization */
    analysis: {
      /** all the metered intensity samples we've collected at approximately equal spacings */
      historicalMeteredIntensity: WritableValueWithCallbacks<{
        /** the filled arrays that we kept */
        filled: Float32Array[];
        /** the current working array */
        current: Float32Array;
        /** the number of samples written to current */
        offset: number;
      }>;
      /**
       * We try to determine the actual dynamic range of the microphone by tracking
       * the quietest and loudest signals we've actually seen
       */
      rawMeteredIntensityRecently: WritableValueWithCallbacks<{
        /** An array of recently received intensity values from metering, from -160 to 0 */
        arr: Float32Array;
        /** The offset of the most recent sample in the array */
        offset: number;
      }>;

      /**
       * index 0 corresponds to the oldest bin, index length - 1 corresponds to
       * the latest bin. The bins are of an equal, predetermined size, meaning that
       * the total time duration of the bins is fixed at the start (representing a
       * rolling window of time)
       */
      timeVsAverageSignalIntensity: WritableValueWithCallbacks<Float32Array>;

      /**
       * A value which generally ranges from 0 to 1. At 0 it means the last bin
       * was just sampled. At 1, it means an entire bin interval has occured
       * since we sampled a bin.
       */
      timeVsAverageSignalIntensityOffset: WritableValueWithCallbacks<number>;
    };
    playable?: undefined;
  };
};

/**
 * Previous states:
 * - `recording`
 *
 * Transitions:
 * - `initializing-local-stream`: as soon as data is available
 * - `error`: if an error event is emitted by the recorder
 * - `released`: if the voice note is released before the data is available
 *
 * NOTE: On web this is just a reserved state
 */
export type VoiceNoteStateRecorded = {
  /**
   * - `recorded`: We have recorded the voice note and are now waiting for the
   *   data to become available
   */
  type: 'recorded';

  /**
   * The login context to use when initializing the upload
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the underlying voice note audio */
  audio: {
    /** NATIVE ONLY: the file containing the data that was recorded */
    __uri: string;

    /** all the metered intensity samples we've collected at approximately equal spacings */
    historicalMeteredIntensity: {
      /** the filled arrays that we kept */
      filled: Float32Array[];
      /** the current working array */
      current: Float32Array;
      /** the number of samples written to current */
      offset: number;
    };

    /**
     * A single time vs average signal intensity data right before recording stopped.
     * Uses an array of arrays for consistency, but always has one element.
     */
    timeVsAverageSignalIntensity: Float32Array[];

    /** The duration of the voice note in seconds */
    durationSeconds: number;
    playable?: undefined;
  };
};

/**
 * Previous states:
 * - `recorded`
 *
 * Transitions:
 * - `initializing-local-play`: as soon as the data is streamable - on web, this
 *   is converting to an object url. in native, this may involve storing the data
 *   in a file
 * - `error`: if we cannot get the data streamable, e.g., file io error on native
 * - `released`: if the voice note is released before the data is streamable
 */
export type VoiceNoteStateInitializingLocalStream = {
  /**
   * - `initializing-local-stream`: we have the voice note data and are now preparing
   *   the audio data to be streamable locally
   */
  type: 'initializing-local-stream';

  /**
   * The login context to use when initializing the upload
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the underlying voice note audio */
  audio: {
    /** NATIVE ONLY: the path to the voice note audio locally */
    __uri: string;

    /**
     * The time vs average signal intensity data right before recording stopped.
     * Uses an array of arrays for consistency, but always has one element.
     */
    timeVsAverageSignalIntensity: Float32Array[];

    /** The duration of the voice note in seconds */
    durationSeconds: number;
    playable?: undefined;
  };
};

/**
 * Previous states:
 * - `initializing-local-stream`
 *
 * Transitions:
 * - `initializing-upload`: once the audio file can be played
 * - `error`: if we cannot get the audio file to be playable
 * - `released`: if the voice note is released before the audio file is playable
 *
 * Notes:
 * - Initializes an HTMLAudioElement pointing to the object URL then uses
 *   waitUntilMediaIsReady. We don't need to worry about the MediaStream object
 *   url compatibility issues (i.e., src vs srcObject) as we did not make the
 *   object URL directly from the MediaStream.
 */
export type VoiceNoteStateInitializingLocalPlay = {
  /**
   * - `initializing-local-play`: we have the voice note data and can stream
   *   the raw data locally, and now are preparing to be able to play it locally
   */
  type: 'initializing-local-play';

  /**
   * The login context to use when initializing the upload
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the underlying voice note audio */
  audio: {
    /** the local URL that can be used to stream the raw data */
    url: string;

    /**
     * The time vs average signal intensity data right before recording stopped.
     * Uses an array of arrays for consistency, but always has one element.
     */
    timeVsAverageSignalIntensity: Float32Array[];

    /** The duration of the voice note in seconds */
    durationSeconds: number;
    playable?: undefined;
  };
};

type InitUploadResponse = {
  voice_note: { uid: string; jwt: string };
  file_upload: {
    uid: string;
    jwt: string;
    parts:
      | { number: number; start_byte: number; end_byte: number }
      | {
          start_number: number;
          start_byte: number;
          number_of_parts: number;
          part_size: number;
        };
  };
};
/**
 * Previous states:
 * - `initializing-local-play`
 *
 * Transitions:
 * - `uploading`: once the file upload has been initialized
 * - `error`: if we fail to initialize the file upload and have exhausted all retries
 * - `released`: if the voice note is released before the upload is initialized
 *
 * Notes:
 * - In order to transition to uploading we have to do something rather unusual:
 *   we will have just been assigned an actual voice note uid, so that voice note
 *   uid should now also point to us. This behavior is injected into this file.
 */
export type VoiceNoteStateInitializingUpload = {
  /**
   * - `initializing-upload`: we have the voice note data and it can already
   *   be played locally, so we are setting up to upload the data
   */
  type: 'initializing-upload';

  /**
   * The login context to use when initializing the upload
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the underlying voice note audio */
  audio: {
    /** the local URL that can be used to stream the raw data */
    url: string;

    /**
     * the playable audio file data; you may use this directly under
     * the common scenario where only one component will be trying to
     * play audio at a time
     */
    playable: AudioFileData;

    /**
     * The duration of the audio file in seconds
     */
    durationSeconds: number;

    /**
     * The time vs average signal intensity data such that the bins partition
     * the audio file. The list is in descending order of number of bins.
     */
    timeVsAverageSignalIntensity: Float32Array[];
  };

  /** tracks what we're currently doing */
  progress: SmartAPIFetch<InitUploadResponse>;
};

/**
 * Previous states:
 * - `initializing-upload`
 *
 * Transitions:
 * - `transcribing`: as soon as the last upload part succeeds
 * - `error`: if we fail to upload the parts and we've exhausted any retry attempts
 * - `released`: if the voice note is released before the upload is complete
 *
 * Notes:
 * - File uploads are handled identically in web and native, so relying on the
 *   file upload progress object is perfectly reasonable.
 * - Generally this is the first state since recording that won't transition
 *   almost immediately to another state, though less than a second here is
 *   expected
 * - Once uploading is finished we stop holding a reference to the raw blob but
 *   we cannot release the object url since it's used by the audio element
 */
export type VoiceNoteStateUploading = {
  /**
   * - `uploading`: we are in the process of uploading the voice note
   */
  type: 'uploading';

  /**
   * The login context to use for getting the transcript
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the underlying voice note audio */
  audio: {
    /** the local URL that can be used to stream the raw data */
    url: string;

    /**
     * the playable audio file data; you may use this directly under
     * the common scenario where only one component will be trying to
     * play audio at a time
     */
    playable: AudioFileData;

    /**
     * The duration of the audio file in seconds
     */
    durationSeconds: number;

    /**
     * The time vs average signal intensity data such that the bins
     * partition the audio file. This list is in descending order of
     * number of bins
     */
    timeVsAverageSignalIntensity: Float32Array[];
  };

  /** the reserved voice note */
  voiceNote: {
    /** the uid of the reserved voice note */
    uid: string;
    /** a jwt allowing access to the reserved voice note */
    jwt: string;
  };

  /** the file upload for the voice note */
  fileUpload: {
    /** the uid of the file upload */
    uid: string;
    /** a jwt allowing us to perform the file upload */
    jwt: string;
    /** tracks the progress for this upload */
    result: UploadResult;
  };
};

type TranscriptionResponse = {
  voice_note_uid: string;
  journal_client_key_uid: string;
  encrypted_transcript: string;
};

/**
 * Previous states:
 * - `uploading`
 *
 * Transitions:
 * - `local-ready`: as soon as the transcript is available
 * - `error`: if we fail to get the transcript
 * - `released`: if the voice note is released before the transcript is available
 *
 * Notes:
 * - due to the server holding the response open, this will generally transition
 *   away as soon as the audio is ready with no poll interval hyperparameters.
 *   retrying is only included as a fallback if the server is overwhelmed (ie
 *   the transcript is taking a a while) or the connection is unstable
 * - on native only, this also tries to update the bins for the audio file
 */
export type VoiceNoteStateTranscribing = {
  /**
   * - `transcribing`: we have successfully uploaded
   *   the voice note. we are waiting for the transcript to be available
   *   by polling the show transcript endpoint. The show transcript endpoint
   *   will hold the request open up to 5s if the transcript is being processed
   */
  type: 'transcribing';

  /**
   * The login context to use for getting the transcript
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the underlying voice note audio */
  audio: {
    /** the local URL that can be used to stream the raw data */
    url: string;

    /**
     * the playable audio file data; you may use this directly under
     * the common scenario where only one component will be trying to
     * play audio at a time
     */
    playable: AudioFileData;

    /**
     * The duration of the audio file in seconds
     */
    durationSeconds: number;

    /**
     * The time vs average signal intensity data such that the bins
     * partition the audio file. This list is in descending order of
     * number of bins.
     */
    timeVsAverageSignalIntensity: Float32Array[];
  };

  /** the voice note that we created */
  voiceNote: {
    /** the uid of the voice note */
    uid: string;
    /** the jwt to access the voice note */
    jwt: string;
  };

  /** the journal client key we are using to receive the transcription */
  journalClientKey: WrappedJournalClientKey;

  /** tracks what we're currently doing */
  progress: SmartAPIFetch<TranscriptionResponse>;

  /** tracks progress on getting the rebinned data */
  rebinProgress: SmartAPIFetch<ShowAudioResponse>;
};

/**
 * Previous states:
 * - `transcribing`
 *
 * Transitions:
 * - `released`: once the last reference to the voice note is released
 */
export type VoiceNoteStateLocalReady = {
  /**
   * - `local-ready`: The voice note has the audio available locally and the
   *   transcript is ready
   */
  type: 'local-ready';

  /** The voice note whose audio and transcript are ready */
  voiceNote: {
    /** The UID for the voice note */
    uid: string;
    /** the jwt used to access the voice note; may be expired */
    jwt: string;
  };

  /** the underlying voice note audio */
  audio: {
    /** the local URL that can be used to stream the raw data */
    url: string;

    /**
     * the playable audio file data; you may use this directly under
     * the common scenario where only one component will be trying to
     * play audio at a time
     */
    playable: AudioFileData;

    /**
     * The duration of the audio file in seconds
     */
    durationSeconds: number;

    /**
     * The time vs average signal intensity data such that the bins
     * partition the audio file. This list is in descending order of
     * number of bins.
     */
    timeVsAverageSignalIntensity: Float32Array[];
  };

  /** the voice note's transcript */
  transcript: {
    /** the parsed and ready to use transcript for the voice note */
    usable: OsehTranscript;
  };
};

/**
 * Previous states:
 * none, this is an initial state
 *
 * Transitions:
 * - `remote-initialized`: once the requests have been dispatched
 * - `released`: if the voice note is released before the requests are dispatched
 *
 * Notes:
 * - We transition away from this state almost immediately, but having this state
 *   allows the top level create function to avoid business logic (e.g., referencing
 *   endpoints)
 */
export type VoiceNoteStateRemoteInitializing = {
  /**
   * - `remote-initializing`: We received a ref to a voice note and we
   *   want to get the transcript and audio. We are dispatching requests
   *   to fetch the content file ref and the transcript
   */
  type: 'remote-initializing';

  /**
   * The login context to use for getting the transcript
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the request handlers to use for the audio data */
  resources: VoiceNoteStateRemoteResources;

  /** The voice note use audio and transcript were requested */
  voiceNote: {
    /** the uid of the voice note */
    uid: string;
    /** the jwt used to access the voice note */
    jwt: string;
  };

  /** the underlying voice note audio */
  audio?: undefined;
};

type ShowAudioResponse = {
  voice_note_uid: string;
  audio_content_file: { uid: string; jwt: string };
  duration_seconds: number;
  encrypted_binned_time_vs_intensity: string;
};

export type VoiceNoteStateRemoteResources = Pick<
  Resources,
  'contentPlaylistHandler' | 'audioDataHandler'
>;

/**
 * Previous states:
 * - `remote-initializing`
 *
 * Transitions:
 * - `remote-selecting-export`: once we have the content file ref and transcript
 * - `error`: if we fail to get the content file ref or transcript and have exhausted all retries
 * - `released`: if the voice note is released before the content file ref and transcript are available
 */
export type VoiceNoteStateRemoteInitialized = {
  /**
   * - `remote-initialized`: We received a ref to a voice note and we
   *   want to get the transcript and audio. We have dispatched requests
   *   to get the content file ref and the transcript
   */
  type: 'remote-initialized';

  /**
   * The login context to use for getting the transcript
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the request handlers to use for the audio data */
  resources: VoiceNoteStateRemoteResources;

  /** The voice note use audio and transcript were requested */
  voiceNote: {
    /** the uid of the voice note */
    uid: string;
    /** the jwt used to access the voice note */
    jwt: string;
  };

  /** the journal client key we are using to receive the transcription */
  journalClientKey: WrappedJournalClientKey;

  /** the underlying voice note audio */
  audio: {
    /** the ref to the remote file or null if it's still loading */
    pendingContentFileRef: WritableValueWithCallbacks<OsehContentRefLoadable | null>;

    /**
     * The time vs average signal intensity data such that the bins
     * partition the audio file, in order of descending number of bins,
     * if known, otherwise null
     */
    pendingTimeVsAverageSignalIntensity: WritableValueWithCallbacks<
      Float32Array[] | null
    >;

    /**
     * The duration of the audio file in seconds, if known, otherwise null
     */
    pendingDurationSeconds: WritableValueWithCallbacks<number | null>;

    playable?: undefined;
  };

  /** the voice note's transcript */
  transcript: {
    /** the transcript if it's available otherwise null */
    pending: WritableValueWithCallbacks<OsehTranscript | null>;
  };

  /** tracks what we're currently doing */
  progress: {
    /** progress to getting audio data; released after we have it */
    audio: SmartAPIFetch<ShowAudioResponse>;
    /** progress to getting transcript data; released after we have it */
    transcript: SmartAPIFetch<TranscriptionResponse>;
  };
};

/**
 * Previous states:
 * - `remote-initialized`
 *
 * Transitions:
 * - `remote-downloading-audio`: once we have the content playlist to choose from
 * - `error`: if we fail to get the content playlist and have exhausted all retries
 * - `released`: if the voice note is released before the content playlist is available
 */
export type VoiceNoteStateRemoteSelectingExport = {
  /**
   * - `remote-selecting-export`: We have the transcript and audio content ref
   *   and are now determining which export we want to use for the audio
   */
  type: 'remote-selecting-export';

  /**
   * The login context to use for getting the transcript
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the request handlers to use for the audio data */
  resources: VoiceNoteStateRemoteResources;

  /** the voice note use audio and transcript were requested */
  voiceNote: {
    /** the uid of the voice note */
    uid: string;
    /** the jwt used to access the voice note */
    jwt: string;
  };

  /** the underlying voice note audio */
  audio: {
    /** the remote file that contains the audio */
    contentFile: OsehContentRefLoadable;

    /** the request for the playlist of available exports of the audio */
    playlistRequest: RequestResult<ContentFileNativeExport>;

    /**
     * The duration of the audio file in seconds
     */
    durationSeconds: number;

    /**
     * The time vs average signal intensity data such that the bins
     * partition the audio file. This list is in descending order of
     * number of bins
     */
    timeVsAverageSignalIntensity: Float32Array[];

    playable?: undefined;
  };

  /** the voice note's transcript */
  transcript: {
    /** the parsed and ready to use transcript for the voice note */
    usable: OsehTranscript;
  };
};

/**
 * Previous states:
 * - `remote-selecting-export`
 *
 * Transitions:
 * - `remote-ready`: once the audio is ready to play
 * - `error`: if we fail to get the audio and have exhausted all retries
 * - `released`: if the voice note is released before the audio is available
 */
export type VoiceNoteStateRemotingDownloadingAudio = {
  /**
   * - `remote-downloading-audio`: Downloading enough of the selected export to
   *   start playing the audio
   */
  type: 'remote-downloading-audio';

  /**
   * The login context to use for getting the transcript
   */
  loginContext: LoginContextValue;

  /**
   * The visitor who is signed in
   */
  visitor: Visitor;

  /** the request handlers to use for the audio data */
  resources: VoiceNoteStateRemoteResources;

  /** the voice note use audio and transcript were requested */
  voiceNote: {
    /** the uid of the voice note */
    uid: string;
    /** the jwt used to access the voice note */
    jwt: string;
  };

  /** the underlying voice note audio */
  audio: {
    /** the remote file that contains the audio */
    contentFile: OsehContentRefLoadable;

    /**
     * the request for the playlist of available exports of the audio, held
     * to prevent it from being released
     */
    playlistRequest: RequestResult<ContentFileNativeExport>;

    /** the playlist of available exports of the audio */
    playlist: ContentFileNativeExport;

    /** the request to make the playlist playable */
    request: RequestResult<AudioFileData>;

    /**
     * The duration of the audio file in seconds
     */
    durationSeconds: number;

    /**
     * The time vs average signal intensity data such that the bins
     * partition the audio file. This list is in descending order of
     * number of bins
     */
    timeVsAverageSignalIntensity: Float32Array[];

    playable?: undefined;
  };

  /** the voice note's transcript */
  transcript: {
    /** the parsed and ready to use transcript for the voice note */
    usable: OsehTranscript;
  };
};

/**
 * Previous states:
 * - `remote-downloading-audio`
 *
 * Transitions:
 * - `released`: once the last reference to the voice note is released
 */
export type VoiceNoteStateRemoteReady = {
  /**
   * - `remote-ready`: The voice note's transcript is ready and the audio
   *   can very likely be played through without interruption (i.e., we have
   *   downloaded enough that we think we will have finished downloading by
   *   the time we need to play the next part, all the way to the end).
   */
  type: 'remote-ready';

  /** the request handlers used for the audio data */
  resources: VoiceNoteStateRemoteResources;

  /** The voice note whose audio and transcript are ready */
  voiceNote: {
    /** The UID for the voice note */
    uid: string;

    /** A possibly expired JWT for the voice note */
    jwt: string;
  };

  /** the underlying voice note audio */
  audio: {
    /** the remote file that contains the audio */
    contentFile: OsehContentRefLoadable;

    /**
     * the request for the playlist of available exports of the audio, held
     * to prevent it from being released
     */
    playlistRequest: RequestResult<ContentFileNativeExport>;

    /** the playlist of available exports of the audio */
    playlist: ContentFileNativeExport;

    /**
     * the request to make the playlist playable, held to prevent it from
     * being released
     */
    request: RequestResult<AudioFileData>;

    /**
     * the playable audio file data; you may use this directly under
     * the common scenario where only one component will be trying to
     * play audio at a time
     *
     * This audio data may only be playable for a limited period of time
     * before 403's are returned. If that is detected, report this object
     * as expired.
     *
     * To detect when this is likely to return 403s, use the playlistRequest. if
     * the JWT is expired on the OsehContentPlaylist, then actual network
     * requests for the audio data, if needed, will fail
     */
    playable: AudioFileData;

    /**
     * The duration of the audio file in seconds
     */
    durationSeconds: number;

    /**
     * The time vs average signal intensity data such that the bins
     * partition the audio file. This list is in descending order of
     * number of bins
     */
    timeVsAverageSignalIntensity: Float32Array[];
  };

  /** the voice note's transcript */
  transcript: {
    /** the parsed and ready to use transcript for the voice note */
    usable: OsehTranscript;
  };
};

/**
 * Previous states:
 * - almost any
 *
 * Transitions:
 * - `released`: once the last reference to the voice note is released
 */
export type VoiceNoteStateError = {
  /**
   * - `error`: an error occurred while processing the voice note
   */
  type: 'error';

  /** a description of the error that occurred */
  error: ReactElement;
  audio?: undefined;
};

/**
 * Previous states:
 * - any
 *
 * Transitions:
 * - none, this is a terminal state
 */
export type VoiceNoteStateReleased = {
  /**
   * - `released`: the voice note has been released and all resources
   *   have been cleaned up or are in the process of being cleaned up
   */
  type: 'released';
  audio?: undefined;
};

export type VoiceNoteState =
  | VoiceNoteStateInitializingForRecording
  | VoiceNoteStateInitializedForRecording
  | VoiceNoteStateRecording
  | VoiceNoteStateRecorded
  | VoiceNoteStateInitializingLocalStream
  | VoiceNoteStateInitializingLocalPlay
  | VoiceNoteStateInitializingUpload
  | VoiceNoteStateUploading
  | VoiceNoteStateTranscribing
  | VoiceNoteStateLocalReady
  | VoiceNoteStateRemoteInitializing
  | VoiceNoteStateRemoteInitialized
  | VoiceNoteStateRemoteSelectingExport
  | VoiceNoteStateRemotingDownloadingAudio
  | VoiceNoteStateRemoteReady
  | VoiceNoteStateError
  | VoiceNoteStateReleased;

/**
 * Can be sent to request that the state machine transition from
 * initialized for recording to recording
 */
export type VoiceNoteStateMachineMessageRecord = {
  /**
   * - `record`: request that the voice note start recording
   */
  type: 'record';
};

/**
 * Can be sent to request that the state machine transition from
 * recording to recorded
 */
export type VoiceNoteStateMachineMessageStopRecording = {
  /**
   * - `stop-recording`: request that the voice note stop recording and
   *   begin processing (use release if you want to stop recording and
   *   discard the voice note instead)
   */
  type: 'stop-recording';
};

/**
 * Can be sent to almost any state to request that any actively
 * held resources are released and the state machine transitions
 * to the released state
 */
export type VoiceNoteStateMachineMessageRelease = {
  /**
   * - `release`: request that the voice note be released and all resources
   *   be cleaned up
   */
  type: 'release';
};

export type VoiceNoteStateMachineMessage =
  | VoiceNoteStateMachineMessageRecord
  | VoiceNoteStateMachineMessageStopRecording
  | VoiceNoteStateMachineMessageRelease;

/**
 * Describes the result of createVoiceNoteStateMachine - i.e., an
 * object where:
 *
 * - the state can be inspected at any point
 * - there is a coroutine that may transition the state unless it is in
 *   the `released` state
 * - the coroutine can be sent messages to transition the state, which it
 *   will process asynchronously (but with nearly no delay)
 */
export type VoiceNoteStateMachine = {
  /** the current state */
  state: ValueWithCallbacks<VoiceNoteState>;

  /**
   * Sends a message to be processed by the state machine. Raises an error
   * if the state machine is in the `released` state. The returned promise
   * resolves when the message has been processed.
   */
  sendMessage: (
    message: VoiceNoteStateMachineMessage
  ) => CancelablePromise<void>;
};

/**
 * Creates a new voice note state machine in the `initialized-for-recording`
 * state
 */
export const createVoiceNoteStateMachineForLocalUpload = ({
  loginContext,
  visitor,
  assignUID,
}: {
  /** The login context to use for the upload */
  loginContext: LoginContextValue;

  /** The visitor who is using the client */
  visitor: Visitor;

  /**
   * Called once a UID becomes available for this voice note. This should do
   * whatever is necessary to ensure that attempts to load this remote voice
   * note uid gives a reference to the returned local state voice machine instead.
   *
   * This is essentially equivalent to just listening for switching into the
   * uploading state, but is included here both to remind the caller that this
   * is necessary and to provide a consistent way to detect when the UID is
   * assigned
   *
   * Suggested implementation: Inject this behavior into the RequestHanlder via
   *   a stateful getRefUid and cleanupData
   *
   * Alternative implementation: Subclass RequestHandler
   *
   * @param uid The remote assigned UID for this voice note
   */
  assignUID: (uid: string) => void;
}): VoiceNoteStateMachine => {
  const state = createWritableValueWithCallbacks<VoiceNoteState>({
    type: 'initializing-for-recording',
    loginContext,
    visitor,
  });
  const messageQueue =
    createWritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>(null);

  handleLoop(state, messageQueue, assignUID);

  return {
    state,
    sendMessage: (message) => passMessageWithVWC(messageQueue, message),
  };
};

/**
 * transitions to released and raises the given error. this should
 * only be used if we know it's a programming issue, not a user or
 * user environment error
 */
function onAssertFailed(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>,
  msg: string
) {
  setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
  setVWC(messageQueue, null);
  throw new Error(msg);
}

async function handleLoop(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>,
  assignUID: (uid: string) => void
) {
  while (true) {
    const ogType = state.get().type;
    console.log('handleLoop now in state', ogType);
    switch (ogType) {
      case 'initializing-for-recording':
        await transitionFromInitializingForRecording(state, messageQueue);
        break;
      case 'initialized-for-recording':
        await transitionFromInitializedForRecording(state, messageQueue);
        break;
      case 'recording':
        await transitionFromRecording(state, messageQueue);
        break;
      case 'recorded':
        await transitionFromRecorded(state, messageQueue);
        break;
      case 'initializing-local-stream':
        await transitionFromInitializingLocalStream(state, messageQueue);
        break;
      case 'initializing-local-play':
        await transitionFromInitializingLocalPlay(state, messageQueue);
        break;
      case 'initializing-upload':
        await transitionFromInitializingUpload(state, messageQueue, assignUID);
        break;
      case 'uploading':
        await transitionFromUploading(state, messageQueue);
        break;
      case 'transcribing':
        await transitionFromTranscribing(state, messageQueue);
        break;
      case 'local-ready':
        await transitionFromLocalReady(state, messageQueue);
        break;
      case 'remote-initializing':
        await transitionFromRemoteInitializing(state, messageQueue);
        break;
      case 'remote-initialized':
        await transitionFromRemoteInitialized(state, messageQueue);
        break;
      case 'remote-selecting-export':
        await transitionFromRemoteSelectingExport(state, messageQueue);
        break;
      case 'remote-downloading-audio':
        await transitionFromRemoteDownloadingAudio(state, messageQueue);
        break;
      case 'remote-ready':
        await transitionFromRemoteReady(state, messageQueue);
        break;
      case 'error':
        await transitionFromError(state, messageQueue);
        break;
      case 'released':
        setVWC(messageQueue, null);
        return;
      default:
        onAssertFailed(
          state,
          messageQueue,
          `unexpected state machine state: ${ogType}`
        );
    }

    if (state.get().type === ogType) {
      onAssertFailed(state, messageQueue, `${ogType} did not transition`);
      return;
    }
  }
}

async function transitionFromInitializingForRecording(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'initializing-for-recording') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  try {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      console.log('permission not granted');
      setVWC(
        state,
        {
          type: 'error',
          error: makeTextError('Permission to record audio was denied'),
        },
        () => false
      );
      return;
    }

    console.log('setting audio mode');
    await Audio.setAudioModeAsync({
      // playsInSilentModeIOS: false, -- iOS fails with error code E_AUDIO_AUDIOMODE
      playsInSilentModeIOS: true,
      allowsRecordingIOS: true,
    });
    console.log('set audio mode');
  } catch (e) {
    console.log(
      `error initializing ${e}; ${
        typeof e === 'object' && e !== null ? JSON.stringify(e) : null
      }`
    );
    setVWC(
      state,
      {
        type: 'error',
        error: makeTextError(
          'Failed to initialize audio recording permissions'
        ),
      },
      () => false
    );
    return;
  }

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  messageCancelable.promise.catch(() => {});

  if (messageCancelable.done()) {
    const msg = (await messageCancelable.promise)();

    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }

    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  const recorder = new Audio.Recording();
  try {
    await recorder.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.LOW_QUALITY
    );
  } catch {
    try {
      await recorder.stopAndUnloadAsync();
      const uri = recorder.getURI();
      if (uri !== null) {
        await FileSystem.deleteAsync(uri);
      }
    } catch {}

    setVWC(
      state,
      {
        type: 'error',
        error: makeTextError('Failed to prepare audio recording'),
      },
      () => false
    );
    return;
  }

  if (messageCancelable.done()) {
    try {
      await recorder.stopAndUnloadAsync();
      const uri = recorder.getURI();
      if (uri !== null) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (e) {
      console.warn('Failed to stop and unload recorder', e);
    }

    const msg = (await messageCancelable.promise)();

    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }

    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  messageCancelable.cancel();

  setVWC(
    state,
    {
      type: 'initialized-for-recording',
      loginContext: current.loginContext,
      visitor: current.visitor,
      audio: {
        recorder,
        analysis: {},
      },
    },
    () => false
  );
}
async function transitionFromInitializedForRecording(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'initialized-for-recording') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const msg = (await receiveMessageWithVWC(messageQueue).promise)();
  if (msg.type === 'record') {
    const current = state.get();
    if (current.type !== 'initialized-for-recording') {
      onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
      return;
    }

    let startedAtApprox = Date.now();

    let firstStatus: Audio.RecordingStatus;
    try {
      firstStatus = await current.audio.recorder.startAsync();
      startedAtApprox = Date.now() - firstStatus.durationMillis;
    } catch (e) {
      console.warn('error starting audio:', e);
      try {
        await current.audio.recorder.stopAndUnloadAsync();
        const uri = current.audio.recorder.getURI();
        if (uri !== null) {
          await FileSystem.deleteAsync(uri);
        }
      } catch (e2) {
        console.warn('error stopping audio:', e2);
      }

      setVWC(
        state,
        { type: 'error', error: makeTextError('Failed to start recording') },
        () => false
      );
      return;
    }

    setVWC(state, {
      type: 'recording',
      loginContext: current.loginContext,
      visitor: current.visitor,
      recordingStartedAt: {
        asDateNow: createWritableValueWithCallbacks(startedAtApprox),
      },
      audio: {
        recorder: current.audio.recorder,
        analysis: {
          historicalMeteredIntensity: createWritableValueWithCallbacks({
            filled: [] as Float32Array[],
            current: new Float32Array(128),
            offset: 0,
          }),
          rawMeteredIntensityRecently: createWritableValueWithCallbacks({
            arr: new Float32Array(128),
            offset: 0,
          }),
          timeVsAverageSignalIntensity: createWritableValueWithCallbacks(
            new Float32Array(64)
          ),
          timeVsAverageSignalIntensityOffset:
            createWritableValueWithCallbacks(0),
        },
      },
    });
    return;
  }

  try {
    await current.audio.recorder.stopAndUnloadAsync();
    const uri = current.audio.recorder.getURI();
    if (uri !== null) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (e) {
    console.warn('Failed to stop and unload recorder', e);
  }

  if (msg.type !== 'release') {
    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
  }
}
async function transitionFromRecording(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'recording') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const binWidthMS = 1000 / 10;

  const seenStop = createWritableValueWithCallbacks<boolean>(false);
  const seenError = createWritableValueWithCallbacks<boolean>(false);
  const lastStatusVWC =
    createWritableValueWithCallbacks<Audio.RecordingStatus | null>(null);
  const onStatusUpdate = (s: Audio.RecordingStatus) => {
    lastStatusVWC.set(s);

    let changedStop = false;
    if (!seenStop.get() && !s.isRecording) {
      changedStop = true;
      seenStop.set(true);
    }

    let changedError = false;
    if (!seenError.get() && !s.isRecording && s.uri === null) {
      changedError = true;
      seenError.set(true);
    }

    lastStatusVWC.callbacks.call(undefined);
    seenStop.callbacks.call(undefined);
    seenError.callbacks.call(undefined);
  };

  current.audio.recorder.setOnRecordingStatusUpdate(onStatusUpdate);
  current.audio.recorder.setProgressUpdateInterval(binWidthMS);
  current.audio.recorder.getStatusAsync().then(onStatusUpdate);

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  messageCancelable.promise.catch(() => {});

  const stopCancelable = waitForValueWithCallbacksConditionCancelable(
    seenStop,
    (v) => v
  );
  stopCancelable.promise.catch(() => {});
  const errorCancelable = waitForValueWithCallbacksConditionCancelable(
    seenError,
    (v) => v
  );
  errorCancelable.promise.catch(() => {});

  let lastBinAtPerf = performance.now();

  const offsetVWC = current.audio.analysis.timeVsAverageSignalIntensityOffset;
  const intensityVWC = current.audio.analysis.timeVsAverageSignalIntensity;
  const rawHistoricalVWC = current.audio.analysis.historicalMeteredIntensity;
  const rawHistorical = rawHistoricalVWC.get();
  const rawRecentVWC = current.audio.analysis.rawMeteredIntensityRecently;
  const rawRecent = rawRecentVWC.get();
  const intensity = intensityVWC.get();
  let isFirstSample = true;

  const insertIntensity = (v: number) => {
    for (let i = 0; i < intensity.length - 1; i++) {
      intensity[i] = intensity[i + 1];
    }
    intensity[intensity.length - 1] = v;
  };

  const insertRawIntensityAndGetSampleIntensity = (raw: number): number => {
    if (isFirstSample) {
      if (raw < -100) {
        return 0;
      }
      for (let i = 0; i < rawRecent.arr.length; i++) {
        rawRecent.arr[i] = raw;
      }
      rawRecent.offset = 0;
      rawHistorical.filled = [];
      rawHistorical.current[0] = raw;
      rawHistorical.offset = 1;
      rawRecentVWC.callbacks.call(undefined);
      rawHistoricalVWC.callbacks.call(undefined);
      isFirstSample = false;
      return 0;
    }

    // historical first as its simpler
    rawHistorical.current[rawHistorical.offset] = raw;
    rawHistorical.offset += 1;
    if (rawHistorical.offset === rawHistorical.current.length) {
      rawHistorical.filled.push(rawHistorical.current);
      rawHistorical.current = new Float32Array(rawHistorical.current.length);
      rawHistorical.offset = 0;
    }

    // offset increment is intentionally first here
    rawRecent.offset += 1;
    if (rawRecent.offset === rawRecent.arr.length) {
      rawRecent.offset = 0;
    }
    const arr = rawRecent.arr;
    arr[rawRecent.offset] = raw;
    rawRecentVWC.callbacks.call(undefined);

    let min = arr[0];
    let max = arr[1];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < min) {
        min = arr[i];
      }
      if (arr[i] > max) {
        max = arr[i];
      }
    }
    if (min >= max) {
      return 0;
    }

    return (raw - min) / (max - min);
  };

  while (true) {
    if (messageCancelable.done() || seenStop.get() || seenError.get()) {
      break;
    }

    const frameTime = performance.now();

    if (frameTime >= lastBinAtPerf + binWidthMS) {
      const lastSample = lastStatusVWC.get();
      const instantaneousRaw = lastSample?.metering ?? 0;
      const instantaneous =
        insertRawIntensityAndGetSampleIntensity(instantaneousRaw);

      // fix skipped bins with repetition
      while (frameTime >= lastBinAtPerf + binWidthMS) {
        insertIntensity(instantaneous);
        lastBinAtPerf += binWidthMS;
      }
      intensityVWC.callbacks.call(undefined);
    }

    const timeSinceLastBinMS = frameTime - lastBinAtPerf;
    const timeSinceLastBinNormalized = timeSinceLastBinMS / binWidthMS;
    setVWC(offsetVWC, timeSinceLastBinNormalized);

    const nextFrameCancelable = waitForAnimationFrameCancelable();
    nextFrameCancelable.promise.catch(() => {});

    await Promise.race([
      messageCancelable.promise,
      nextFrameCancelable.promise,
      stopCancelable.promise,
      errorCancelable.promise,
    ]);
    nextFrameCancelable.cancel();
  }

  stopCancelable.cancel();
  errorCancelable.cancel();

  let lastStatus: Audio.RecordingStatus;
  try {
    lastStatus = await current.audio.recorder.stopAndUnloadAsync();
  } catch (e) {
    console.warn('Failed to stop and unload recorder', e);
    messageCancelable.cancel();

    try {
      const uri = current.audio.recorder.getURI();
      if (uri !== null) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (e2) {
      console.warn('Failed to delete audio file', e2);
    }

    setVWC(
      state,
      { type: 'error', error: makeTextError('Failed to stop recording') },
      () => false
    );
    return;
  }

  const finalURI = current.audio.recorder.getURI();
  if (finalURI === null) {
    messageCancelable.cancel();

    setVWC(
      state,
      { type: 'error', error: makeTextError('Failed to finalize recording') },
      () => false
    );
    return;
  }

  const msg = (await messageCancelable.promise)();
  if (msg.type !== 'stop-recording') {
    try {
      await FileSystem.deleteAsync(finalURI);
    } catch (e) {
      console.warn('Failed to delete audio file', e);
    }

    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
    } else {
      onAssertFailed(
        state,
        messageQueue,
        `unsupported message in ${state.get().type}: ${msg.type}`
      );
    }
    return;
  }

  const durationSeconds = lastStatus.durationMillis / 1000;

  setVWC(
    state,
    {
      type: 'recorded',
      loginContext: current.loginContext,
      visitor: current.visitor,
      audio: {
        __uri: finalURI,
        historicalMeteredIntensity:
          current.audio.analysis.historicalMeteredIntensity.get(),
        timeVsAverageSignalIntensity: [
          current.audio.analysis.timeVsAverageSignalIntensity.get(),
        ],
        durationSeconds,
      },
    },
    () => false
  );
  return;
}
async function transitionFromRecorded(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'recorded') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  let timeVsAverageSignalIntensity = current.audio.timeVsAverageSignalIntensity;
  try {
    const raw = current.audio.historicalMeteredIntensity;
    const desiredNumBins = [64, 56, 48, 40, 32, 24, 16, 8] as const;
    const totalHistoricalSamples =
      raw.filled.reduce((a, b) => a + b.length, 0) + raw.offset;

    const mergedSamples = new Float32Array(totalHistoricalSamples);
    let offset = 0;
    for (const arr of raw.filled) {
      mergedSamples.set(arr, offset);
      offset += arr.length;
    }
    mergedSamples.set(raw.current.subarray(0, raw.offset), offset);
    offset += raw.offset;

    if (mergedSamples.length <= desiredNumBins[0]) {
      let max = 1;
      let min = 0;
      for (let i = 0; i < mergedSamples.length; i++) {
        mergedSamples[i] = mergedSamples[i] * mergedSamples[i];
        if (mergedSamples[i] > max) {
          max = mergedSamples[i];
        }
        if (mergedSamples[i] < min) {
          min = mergedSamples[i];
        }
      }
      const normFactor = 1 / (max - min);
      for (let i = 0; i < mergedSamples.length; i++) {
        mergedSamples[i] = (mergedSamples[i] - min) * normFactor;
        if (mergedSamples[i] < 0.02) {
          mergedSamples[i] = 0.02;
        }
      }
      timeVsAverageSignalIntensity = [mergedSamples];
    } else {
      let max = mergedSamples[0];
      let min = mergedSamples[0];
      for (let i = 1; i < mergedSamples.length; i++) {
        if (mergedSamples[i] > max) {
          max = mergedSamples[i];
        }
        if (mergedSamples[i] < min) {
          min = mergedSamples[i];
        }
      }
      const rescaledSamples = new Float32Array(mergedSamples.length);
      if (min < max) {
        for (let i = 0; i < mergedSamples.length; i++) {
          rescaledSamples[i] = (mergedSamples[i] - min) / (max - min);
        }
      }

      const newTVI: Float32Array[] = [];
      for (const numBins of [64, 56, 48, 40, 32, 24, 16, 8]) {
        const bins = new Float32Array(numBins);
        const binSize = exactIntDivide(rescaledSamples.length, numBins, {
          round: 'down',
        });
        for (let bin = 0; bin < numBins; bin++) {
          const binStart = bin * binSize;
          const binEnd = Math.min(binStart + binSize, rescaledSamples.length);

          let sum = 0;
          for (let i = binStart; i < binEnd; i++) {
            sum += rescaledSamples[i];
          }
          bins[bin] = Math.max(sum / Math.max(binEnd - binStart, 1), 0.02);
        }

        newTVI.push(bins);
      }
      timeVsAverageSignalIntensity = newTVI;
    }
  } catch (e) {
    console.log('Failed to process raw intensity data:', e);
  }

  setVWC(state, {
    type: 'initializing-local-stream',
    loginContext: current.loginContext,
    visitor: current.visitor,
    audio: {
      __uri: current.audio.__uri,
      timeVsAverageSignalIntensity,
      durationSeconds: current.audio.durationSeconds,
    },
  });
}
async function transitionFromInitializingLocalStream(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'initializing-local-stream') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  setVWC(state, {
    type: 'initializing-local-play',
    loginContext: current.loginContext,
    visitor: current.visitor,
    audio: {
      url: current.audio.__uri,
      timeVsAverageSignalIntensity: current.audio.timeVsAverageSignalIntensity,
      durationSeconds: current.audio.durationSeconds,
    },
  });
}
async function transitionFromInitializingLocalPlay(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'initializing-local-play') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  let fileInfo: FileSystem.FileInfo;
  try {
    fileInfo = await FileSystem.getInfoAsync(current.audio.url, {
      md5: false,
      size: true,
    });
  } catch (e) {
    try {
      await FileSystem.deleteAsync(current.audio.url);
    } catch (e2) {
      console.warn('Failed to delete audio file', e2);
    }

    setVWC(
      state,
      { type: 'error', error: makeTextError('Failed to get audio file info') },
      () => false
    );
    return;
  }

  if (!fileInfo.exists) {
    setVWC(
      state,
      { type: 'error', error: makeTextError('Audio file does not exist') },
      () => false
    );
    return;
  }

  const fakedExportInfo: ContentFileNativeExport = {
    url: current.audio.url,
    presigned: true,
    jwt: '',
  };
  const [audioState, disposeAudioState] =
    createOsehAudioContentState(fakedExportInfo);

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  messageCancelable.promise.catch(() => {});
  const audioNotLoadingCancelable =
    waitForValueWithCallbacksConditionCancelable(
      audioState,
      (s) => s.type !== 'loading'
    );
  audioNotLoadingCancelable.promise.catch(() => {});

  await Promise.race([
    messageCancelable.promise,
    audioNotLoadingCancelable.promise,
  ]);
  audioNotLoadingCancelable.cancel();

  if (messageCancelable.done()) {
    disposeAudioState();
    await waitForValueWithCallbacksConditionCancelable(
      audioState,
      (s) => s.type === 'unloaded'
    ).promise;
    try {
      await FileSystem.deleteAsync(current.audio.url);
    } catch (e) {
      console.warn('Failed to delete audio file', e);
    }

    const msg = (await messageCancelable.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }

    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  const finalState = audioState.get();
  if (finalState.type !== 'loaded') {
    console.log('unexpected audio final state:', finalState);
    disposeAudioState();
    await waitForValueWithCallbacksConditionCancelable(
      audioState,
      (s) => s.type === 'unloaded'
    ).promise;
    try {
      await FileSystem.deleteAsync(current.audio.url);
    } catch (e) {
      console.warn('Failed to delete audio file', e);
    }
    setVWC(
      state,
      { type: 'error', error: makeTextError('Failed to load audio') },
      () => false
    );
    return;
  }

  setVWC(state, {
    type: 'initializing-upload',
    loginContext: current.loginContext,
    visitor: current.visitor,
    audio: {
      url: current.audio.url,
      playable: {
        state: audioState,
        dispose: disposeAudioState,
      },
      timeVsAverageSignalIntensity: current.audio.timeVsAverageSignalIntensity,
      durationSeconds: current.audio.durationSeconds,
    },
    progress: createSmartAPIFetch<InitUploadResponse>({
      path: '/api/1/voice_notes/',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          file_size: fileInfo.size,
        }),
      },
      user: () => {
        const raw = current.loginContext.value.get();
        if (raw.state !== 'logged-in') {
          return { error: makeTextError('not logged in') };
        }
        return { user: raw };
      },
      retryer: 'expo-backoff-3',
      mapper: createTypicalSmartAPIFetchMapper((v) => v),
    }),
  });
}
async function transitionFromInitializingUpload(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>,
  assignUID: (uid: string) => void
) {
  const current = state.get();
  if (current.type !== 'initializing-upload') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  const voiceNoteReady = waitForValueWithCallbacksConditionCancelable(
    current.progress.state,
    (s) => s.type === 'success' || s.type === 'error' || s.type === 'released'
  );

  await Promise.race([messageCancelable.promise, voiceNoteReady.promise]);
  if (messageCancelable.done()) {
    voiceNoteReady.promise.catch(() => {});
    voiceNoteReady.cancel();

    if (current.progress.state.get().type !== 'released') {
      current.progress.sendMessage({ type: 'release' });
    }

    current.audio.playable.dispose();

    const msg = (await messageCancelable.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }

    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  messageCancelable.promise.catch(() => {});
  messageCancelable.cancel();

  const voiceNoteDataRaw = current.progress.state.get();
  if (voiceNoteDataRaw.type !== 'success') {
    if (current.progress.state.get().type !== 'released') {
      current.progress.sendMessage({ type: 'release' });
    }
    current.audio.playable.dispose();
    setVWC(
      state,
      {
        type: 'error',
        error:
          voiceNoteDataRaw.type === 'error'
            ? voiceNoteDataRaw.error
            : makeTextError('Failed to initialize voice note'),
      },
      () => false
    );
    return;
  }
  const voiceNoteData = voiceNoteDataRaw.value;
  try {
    const fileUploadInfo = parseUploadInfoFromResponse(
      voiceNoteData.file_upload
    );

    assignUID(voiceNoteData.voice_note.uid);
    const uploadResult = upload({
      parts: fileUploadInfo.parts.map((v) => {
        const range = convertToRange(v);
        return {
          number: range.startNumber,
          startByte: range.startByte,
          numberOfParts: range.numberOfParts,
          partSize: range.partSize,
        };
      }),
      concurrency: {
        upload: 5,
        acquireData: 3,
      },
      retries: {
        backoff: (n) => Math.pow(2, n) * 1000 + Math.random() * 1000,
        max: 5,
      },
      getData: uploadStandardURIGetData(current.audio.url),
      tryUpload: uploadStandardEndpointTryUpload(
        voiceNoteData.file_upload.uid,
        voiceNoteData.file_upload.jwt
      ),
    });
    setVWC(state, {
      type: 'uploading',
      loginContext: current.loginContext,
      visitor: current.visitor,
      voiceNote: voiceNoteData.voice_note,
      fileUpload: {
        uid: fileUploadInfo.uid,
        jwt: fileUploadInfo.jwt,
        result: uploadResult,
      },
      audio: {
        url: current.audio.url,
        playable: current.audio.playable,
        timeVsAverageSignalIntensity:
          current.audio.timeVsAverageSignalIntensity,
        durationSeconds: current.audio.durationSeconds,
      },
    });
  } finally {
    current.progress.sendMessage({ type: 'release' });
  }
}
async function transitionFromUploading(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'uploading') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }
  const userRaw = current.loginContext.value.get();
  if (userRaw.state !== 'logged-in') {
    current.fileUpload.result.cancel();
    current.audio.playable.dispose();
    setVWC(
      state,
      { type: 'error', error: makeTextError('Not logged in') },
      () => false
    );
    return;
  }
  const clientKeyPromise = getOrCreateClientKey(userRaw, current.visitor);

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  const uploadNotRunning = waitForValueWithCallbacksConditionCancelable(
    current.fileUpload.result.state,
    (v) => v !== 'running'
  );

  await Promise.race([
    messageCancelable.promise,
    Promise.all([uploadNotRunning.promise, clientKeyPromise]),
  ]);

  if (messageCancelable.done()) {
    uploadNotRunning.promise.catch(() => {});
    uploadNotRunning.cancel();
    current.fileUpload.result.cancel();
    current.audio.playable.dispose();

    const msg = (await messageCancelable.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }

    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  messageCancelable.promise.catch(() => {});
  messageCancelable.cancel();

  uploadNotRunning.promise.then(
    () => {},
    () => {}
  );
  uploadNotRunning.cancel();

  const clientKey = await clientKeyPromise;
  const finalUploadState = current.fileUpload.result.state.get();
  if (finalUploadState !== 'success') {
    console.log('finalUploadState was', finalUploadState);
    current.audio.playable.dispose();
    current.fileUpload.result.cancel();
    setVWC(
      state,
      { type: 'error', error: makeTextError('Failed to upload voice note') },
      () => false
    );
    return;
  }

  setVWC(
    state,
    {
      type: 'transcribing',
      loginContext: current.loginContext,
      visitor: current.visitor,
      voiceNote: current.voiceNote,
      audio: {
        url: current.audio.url,
        playable: current.audio.playable,
        durationSeconds: current.audio.durationSeconds,
        timeVsAverageSignalIntensity:
          current.audio.timeVsAverageSignalIntensity,
      },
      progress: createSmartAPIFetch({
        path: '/api/1/voice_notes/show_transcript',
        init: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            voice_note_uid: current.voiceNote.uid,
            voice_note_jwt: current.voiceNote.jwt,
            journal_client_key_uid: clientKey.uid,
          }),
        },
        user: () => {
          const raw = current.loginContext.value.get();
          if (raw.state !== 'logged-in') {
            return { error: makeTextError('not logged in') };
          }
          return { user: raw };
        },
        retryer: 'forever-5',
        mapper: createTypicalSmartAPIFetchMapper((v) => v),
      }),
      rebinProgress: createSmartAPIFetch({
        path: '/api/1/voice_notes/show_audio',
        init: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            voice_note_uid: current.voiceNote.uid,
            voice_note_jwt: current.voiceNote.jwt,
            journal_client_key_uid: clientKey.uid,
          }),
        },
        user: () => {
          const userRaw = current.loginContext.value.get();
          if (userRaw.state !== 'logged-in') {
            return { error: makeTextError('not logged in') };
          }
          return { user: userRaw };
        },
        retryer: (attempt, minDelay) => {
          if (attempt > 10) {
            return { error: makeTextError('Too many retries') };
          }

          return {
            delay:
              Math.max(
                attempt < 1 ? 5000 : attempt < 5 ? 1000 : 10000,
                minDelay ?? 0
              ) +
              Math.random() * 1000,
          };
        },
        mapper: createTypicalSmartAPIFetchMapper((v) => v),
      }),
      journalClientKey: {
        key: await createFernet(clientKey.key),
        uid: clientKey.uid,
      },
    },
    () => false
  );
}
async function transitionFromTranscribing(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'transcribing') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  messageCancelable.promise.catch(() => {});
  const transcribeNotRunning = waitForValueWithCallbacksConditionCancelable(
    current.progress.state,
    (v) => v.type === 'success' || v.type === 'error' || v.type === 'released'
  );
  transcribeNotRunning.promise.catch(() => {});
  await Promise.race([messageCancelable.promise, transcribeNotRunning.promise]);
  transcribeNotRunning.cancel();
  if (messageCancelable.done()) {
    if (current.progress.state.get().type !== 'released') {
      current.progress.sendMessage({ type: 'release' });
    }
    if (current.rebinProgress.state.get().type !== 'released') {
      current.rebinProgress.sendMessage({ type: 'release' });
    }
    current.audio.playable.dispose();
    const msg = (await messageCancelable.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }
    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }
  messageCancelable.cancel();
  const transcribeState = current.progress.state.get();
  if (transcribeState.type !== 'success') {
    if (transcribeState.type !== 'released') {
      current.progress.sendMessage({ type: 'release' });
    }
    if (current.rebinProgress.state.get().type !== 'released') {
      current.rebinProgress.sendMessage({ type: 'release' });
    }
    current.audio.playable.dispose();
    setVWC(
      state,
      {
        type: 'error',
        error:
          transcribeState.type === 'error'
            ? transcribeState.error
            : makeTextError('Failed to transcribe voice note'),
      },
      () => false
    );
    return;
  }

  const encryptedTranscript = transcribeState.value.encrypted_transcript;
  current.progress.sendMessage({ type: 'release' });
  const decryptedTranscript = await current.journalClientKey.key.decrypt(
    encryptedTranscript,
    await getCurrentServerTimeMS()
  );
  const transcriptJSON = JSON.parse(decryptedTranscript);
  const transcript = convertUsingMapper(transcriptJSON, osehTranscriptMapper);
  setVWC(state, {
    type: 'local-ready',
    voiceNote: current.voiceNote,
    audio: {
      url: current.audio.url,
      playable: current.audio.playable,
      durationSeconds: current.audio.durationSeconds,
      timeVsAverageSignalIntensity: current.audio.timeVsAverageSignalIntensity,
    },
    transcript: { usable: transcript },
  });

  // NATIVE only: keep it here until we get the rebinned value
  // remove this once we can rebin locally in an earlier state
  {
    const rebinNotRunningCancelable =
      waitForValueWithCallbacksConditionCancelable(
        current.rebinProgress.state,
        (v) =>
          v.type === 'success' || v.type === 'error' || v.type === 'released'
      );
    rebinNotRunningCancelable.promise.catch(() => {});
    const rebinMessageCancelable = receiveMessageWithVWC(messageQueue);
    rebinMessageCancelable.promise.catch(() => {});

    await Promise.race([
      rebinNotRunningCancelable.promise,
      rebinMessageCancelable.promise,
    ]);
    rebinNotRunningCancelable.cancel();

    if (rebinMessageCancelable.done()) {
      // let transitionFromLocalReady handle this message
      if (current.rebinProgress.state.get().type !== 'released') {
        current.rebinProgress.sendMessage({ type: 'release' });
      }
      return;
    }

    rebinMessageCancelable.cancel();

    const rebinState = current.rebinProgress.state.get();
    if (rebinState.type !== 'success') {
      if (rebinState.type !== 'released') {
        current.rebinProgress.sendMessage({ type: 'release' });
      }
      return;
    }

    const rebinData = rebinState.value;
    current.rebinProgress.sendMessage({ type: 'release' });
    try {
      const decryptedTVIRaw = await current.journalClientKey.key.decrypt(
        rebinData.encrypted_binned_time_vs_intensity,
        await getCurrentServerTimeMS()
      );
      const decryptedTVI = JSON.parse(decryptedTVIRaw) as number[][];
      const tvi = decryptedTVI.map((v) => new Float32Array(v));

      // backend is giving the actual bins, lets set a minimum value of 0.02
      // as it looks better if there is a pixel for silence rather than nothingness
      for (let i = 0; i < tvi.length; i++) {
        const arr = tvi[i];
        for (let j = 0; j < arr.length; j++) {
          if (arr[j] < 0.02) {
            arr[j] = 0.02;
          }
        }
      }

      setVWC(state, {
        type: 'local-ready',
        voiceNote: current.voiceNote,
        audio: {
          url: current.audio.url,
          playable: current.audio.playable,
          durationSeconds: current.audio.durationSeconds,
          timeVsAverageSignalIntensity: tvi,
        },
        transcript: { usable: transcript },
      });
    } catch (e) {
      console.log('failed to process rebinned audio data:', e);
    }
  }
}
async function transitionFromLocalReady(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'local-ready') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const msg = (await receiveMessageWithVWC(messageQueue).promise)();
  current.audio.playable.dispose();
  if (msg.type === 'release') {
    setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
    return;
  }

  onAssertFailed(
    state,
    messageQueue,
    `unsupported message in ${state.get().type}: ${msg.type}`
  );
}
async function transitionFromError(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'error') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  const msg = (await messageCancelable.promise)();
  if (msg.type === 'release') {
    setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
    return;
  }

  onAssertFailed(
    state,
    messageQueue,
    `unsupported message in ${state.get().type}: ${msg.type}`
  );
}

async function transitionFromRemoteInitializing(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'remote-initializing') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const userReady = waitForValueWithCallbacksConditionCancelable(
    current.loginContext.value,
    (v) => v.state !== 'loading'
  );
  userReady.promise.catch(() => {});
  const message = receiveMessageWithVWC(messageQueue);
  message.promise.catch(() => {});
  await Promise.race([userReady.promise, message.promise]);
  userReady.cancel();
  if (message.done()) {
    const msg = (await message.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }
    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }
  let clientKeyPromise: Promise<JournalClientKey>;
  {
    const userRaw = current.loginContext.value.get();
    if (userRaw.state !== 'logged-in') {
      message.cancel();
      setVWC(
        state,
        { type: 'error', error: makeTextError('Not logged in') },
        () => false
      );
      return;
    }
    const user = userRaw;
    clientKeyPromise = getOrCreateClientKey(user, current.visitor);
  }

  await Promise.race([clientKeyPromise, message.promise]);
  if (message.done()) {
    const msg = (await message.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }
    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  message.cancel();
  let clientKey: WrappedJournalClientKey;
  try {
    const raw = await clientKeyPromise;
    clientKey = { key: await createFernet(raw.key), uid: raw.uid };
  } catch {
    setVWC(
      state,
      { type: 'error', error: makeTextError('Failed to setup encryption') },
      () => false
    );
    return;
  }

  setVWC(
    state,
    {
      type: 'remote-initialized',
      loginContext: current.loginContext,
      visitor: current.visitor,
      resources: current.resources,
      voiceNote: current.voiceNote,
      journalClientKey: clientKey,
      audio: {
        pendingContentFileRef:
          createWritableValueWithCallbacks<OsehContentRefLoadable | null>(null),
        pendingTimeVsAverageSignalIntensity: createWritableValueWithCallbacks<
          Float32Array[] | null
        >(null),
        pendingDurationSeconds: createWritableValueWithCallbacks<number | null>(
          null
        ),
      },
      transcript: {
        pending: createWritableValueWithCallbacks<OsehTranscript | null>(null),
      },
      progress: {
        audio: createSmartAPIFetch({
          path: '/api/1/voice_notes/show_audio',
          init: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              voice_note_uid: current.voiceNote.uid,
              voice_note_jwt: current.voiceNote.jwt,
              journal_client_key_uid: clientKey.uid,
            }),
          },
          user: () => {
            const userRaw = current.loginContext.value.get();
            if (userRaw.state !== 'logged-in') {
              return { error: makeTextError('not logged in') };
            }
            return { user: userRaw };
          },
          retryer: 'expo-backoff-3',
          mapper: createTypicalSmartAPIFetchMapper((v) => v),
        }),
        transcript: createSmartAPIFetch({
          path: '/api/1/voice_notes/show_transcript',
          init: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              voice_note_uid: current.voiceNote.uid,
              voice_note_jwt: current.voiceNote.jwt,
              journal_client_key_uid: clientKey.uid,
            }),
          },
          user: () => {
            const userRaw = current.loginContext.value.get();
            if (userRaw.state !== 'logged-in') {
              return { error: makeTextError('not logged in') };
            }
            return { user: userRaw };
          },
          retryer: 'expo-backoff-3',
          mapper: createTypicalSmartAPIFetchMapper((v) => v),
        }),
      },
    },
    () => false
  );
}
async function transitionFromRemoteInitialized(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'remote-initialized') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  messageCancelable.promise.catch(() => {});
  const audioReady = waitForValueWithCallbacksConditionCancelable(
    current.progress.audio.state,
    (v) => v.type === 'success' || v.type === 'error' || v.type === 'released'
  );
  const transcriptReady = waitForValueWithCallbacksConditionCancelable(
    current.progress.transcript.state,
    (v) => v.type === 'success' || v.type === 'error' || v.type === 'released'
  );
  transcriptReady.promise.catch(() => {});

  let managedAudio = false;
  let managedTranscript = false;
  while (true) {
    if (messageCancelable.done()) {
      audioReady.cancel();
      transcriptReady.cancel();

      if (current.progress.audio.state.get().type !== 'released') {
        current.progress.audio.sendMessage({ type: 'release' });
      }
      if (current.progress.transcript.state.get().type !== 'released') {
        current.progress.transcript.sendMessage({ type: 'release' });
      }

      const msg = (await messageCancelable.promise)();
      if (msg.type === 'release') {
        setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
        return;
      }
      onAssertFailed(
        state,
        messageQueue,
        `unsupported message in ${state.get().type}: ${msg.type}`
      );
      return;
    }

    if (!managedAudio && audioReady.done()) {
      const audioState = current.progress.audio.state.get();
      if (audioState.type !== 'success') {
        messageCancelable.cancel();
        transcriptReady.cancel();
        if (audioState.type !== 'released') {
          current.progress.audio.sendMessage({ type: 'release' });
        }
        if (current.progress.transcript.state.get().type !== 'released') {
          current.progress.transcript.sendMessage({ type: 'release' });
        }
        setVWC(
          state,
          {
            type: 'error',
            error:
              audioState.type === 'error'
                ? audioState.error
                : makeTextError('Failed to load audio'),
          },
          () => false
        );
        return;
      }

      managedAudio = true;
      const audioData = audioState.value;
      current.progress.audio.sendMessage({ type: 'release' });
      try {
        const decryptedTVIRaw = await current.journalClientKey.key.decrypt(
          audioData.encrypted_binned_time_vs_intensity,
          await getCurrentServerTimeMS()
        );
        const decryptedTVI = JSON.parse(decryptedTVIRaw) as number[][];
        const tvi = decryptedTVI.map((v) => new Float32Array(v));

        // backend is giving the actual bins, lets set a minimum value of 0.02
        // as it looks better if there is a pixel for silence rather than nothingness
        for (let i = 0; i < tvi.length; i++) {
          const arr = tvi[i];
          for (let j = 0; j < arr.length; j++) {
            if (arr[j] < 0.02) {
              arr[j] = 0.02;
            }
          }
        }

        current.audio.pendingContentFileRef.set(audioData.audio_content_file);
        current.audio.pendingTimeVsAverageSignalIntensity.set(tvi);
        current.audio.pendingDurationSeconds.set(audioData.duration_seconds);

        current.audio.pendingContentFileRef.callbacks.call(undefined);
        current.audio.pendingTimeVsAverageSignalIntensity.callbacks.call(
          undefined
        );
        current.audio.pendingDurationSeconds.callbacks.call(undefined);
      } catch {
        messageCancelable.cancel();
        transcriptReady.cancel();
        if (current.progress.transcript.state.get().type !== 'released') {
          current.progress.transcript.sendMessage({ type: 'release' });
        }
        setVWC(state, {
          type: 'error',
          error: makeTextError('Failed to decrypt transcript'),
        });
        return;
      }
    }

    if (!managedTranscript && transcriptReady.done()) {
      const transcriptState = current.progress.transcript.state.get();
      if (transcriptState.type !== 'success') {
        messageCancelable.cancel();
        audioReady.cancel();
        if (transcriptState.type !== 'released') {
          current.progress.transcript.sendMessage({ type: 'release' });
        }
        if (current.progress.audio.state.get().type !== 'released') {
          current.progress.audio.sendMessage({ type: 'release' });
        }
        setVWC(
          state,
          {
            type: 'error',
            error:
              transcriptState.type === 'error'
                ? transcriptState.error
                : makeTextError('Failed to load transcript'),
          },
          () => false
        );
        return;
      }

      managedTranscript = true;
      const transcriptData = transcriptState.value;
      current.progress.transcript.sendMessage({ type: 'release' });
      try {
        const decryptedTranscript = await current.journalClientKey.key.decrypt(
          transcriptData.encrypted_transcript,
          await getCurrentServerTimeMS()
        );
        const transcriptJSON = JSON.parse(decryptedTranscript);
        const transcript = convertUsingMapper(
          transcriptJSON,
          osehTranscriptMapper
        );
        setVWC(current.transcript.pending, transcript);
      } catch {
        messageCancelable.cancel();
        audioReady.cancel();
        if (current.progress.audio.state.get().type !== 'released') {
          current.progress.audio.sendMessage({ type: 'release' });
        }
        setVWC(state, {
          type: 'error',
          error: makeTextError('Failed to decrypt transcript'),
        });
        return;
      }
    }

    if (managedAudio && managedTranscript) {
      break;
    }

    await Promise.race([
      messageCancelable.promise,
      ...(managedAudio ? [] : [audioReady.promise]),
      ...(managedTranscript ? [] : [transcriptReady.promise]),
    ]);
  }

  messageCancelable.cancel();
  const contentFileRef = current.audio.pendingContentFileRef.get();
  const timeVsAverageSignalIntensity =
    current.audio.pendingTimeVsAverageSignalIntensity.get();
  const durationSeconds = current.audio.pendingDurationSeconds.get();
  const transcript = current.transcript.pending.get();

  if (
    contentFileRef === null ||
    timeVsAverageSignalIntensity === null ||
    durationSeconds === null ||
    transcript === null
  ) {
    onAssertFailed(state, messageQueue, 'missing data after managed');
    return;
  }

  setVWC(state, {
    type: 'remote-selecting-export',
    loginContext: current.loginContext,
    visitor: current.visitor,
    resources: current.resources,
    voiceNote: current.voiceNote,
    audio: {
      contentFile: contentFileRef,
      playlistRequest: current.resources.contentPlaylistHandler.request({
        ref: { showAs: 'audio', ...contentFileRef },
        refreshRef: () => ({
          promise: Promise.resolve({
            type: 'error',
            data: undefined,
            error: makeTextError('refresh not supported here'),
            retryAt: undefined,
          }),
          done: () => true,
          cancel: () => {},
        }),
      }),
      timeVsAverageSignalIntensity,
      durationSeconds,
    },
    transcript: {
      usable: transcript,
    },
  });
}
async function transitionFromRemoteSelectingExport(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'remote-selecting-export') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  messageCancelable.promise.catch(() => {});
  const playlistReady = waitForValueWithCallbacksConditionCancelable(
    current.audio.playlistRequest.data,
    (v) => v.type === 'success' || v.type === 'error' || v.type === 'released'
  );
  playlistReady.promise.catch(() => {});

  await Promise.race([messageCancelable.promise, playlistReady.promise]);
  playlistReady.cancel();
  if (messageCancelable.done()) {
    current.audio.playlistRequest.release();
    const msg = (await messageCancelable.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }
    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  messageCancelable.cancel();

  const playlistData = current.audio.playlistRequest.data.get();
  if (playlistData.type !== 'success') {
    current.audio.playlistRequest.release();
    setVWC(state, {
      type: 'error',
      error:
        playlistData.type === 'error'
          ? playlistData.error
          : makeTextError('Failed to load audio playlist'),
    });
    return;
  }

  const audioRequest = current.resources.audioDataHandler.request({
    ref: playlistData.data,
    refreshRef: () => ({
      promise: Promise.resolve({
        type: 'error',
        data: undefined,
        error: makeTextError('refresh not supported here'),
        retryAt: undefined,
      }),
      done: () => true,
      cancel: () => {},
    }),
  });
  setVWC(state, {
    type: 'remote-downloading-audio',
    loginContext: current.loginContext,
    visitor: current.visitor,
    resources: current.resources,
    voiceNote: current.voiceNote,
    audio: {
      contentFile: current.audio.contentFile,
      playlistRequest: current.audio.playlistRequest,
      playlist: playlistData.data,
      request: audioRequest,
      timeVsAverageSignalIntensity: current.audio.timeVsAverageSignalIntensity,
      durationSeconds: current.audio.durationSeconds,
    },
    transcript: {
      usable: current.transcript.usable,
    },
  });
}
async function transitionFromRemoteDownloadingAudio(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'remote-downloading-audio') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  const messageCancelable = receiveMessageWithVWC(messageQueue);
  messageCancelable.promise.catch(() => {});
  const audioReady = waitForValueWithCallbacksConditionCancelable(
    current.audio.request.data,
    (v) => v.type === 'success' || v.type === 'error' || v.type === 'released'
  );
  audioReady.promise.catch(() => {});

  await Promise.race([messageCancelable.promise, audioReady.promise]);
  audioReady.cancel();
  if (messageCancelable.done()) {
    current.audio.request.release();
    current.audio.playlistRequest.release();
    const msg = (await messageCancelable.promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }
    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
    return;
  }

  messageCancelable.cancel();
  const audioData = current.audio.request.data.get();
  if (audioData.type !== 'success') {
    current.audio.request.release();
    current.audio.playlistRequest.release();
    setVWC(state, {
      type: 'error',
      error:
        audioData.type === 'error'
          ? audioData.error
          : makeTextError('Failed to load audio'),
    });
    return;
  }

  setVWC(state, {
    type: 'remote-ready',
    resources: current.resources,
    voiceNote: current.voiceNote,
    audio: {
      contentFile: current.audio.contentFile,
      playlistRequest: current.audio.playlistRequest,
      playlist: current.audio.playlist,
      request: current.audio.request,
      playable: audioData.data,
      timeVsAverageSignalIntensity: current.audio.timeVsAverageSignalIntensity,
      durationSeconds: current.audio.durationSeconds,
    },
    transcript: {
      usable: current.transcript.usable,
    },
  });
}
async function transitionFromRemoteReady(
  state: WritableValueWithCallbacks<VoiceNoteState>,
  messageQueue: WritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>
) {
  const current = state.get();
  if (current.type !== 'remote-ready') {
    onAssertFailed(state, messageQueue, `unexpected state: ${current.type}`);
    return;
  }

  try {
    const msg = (await receiveMessageWithVWC(messageQueue).promise)();
    if (msg.type === 'release') {
      setVWC(state, { type: 'released' }, (a, b) => a.type === b.type);
      return;
    }

    onAssertFailed(
      state,
      messageQueue,
      `unsupported message in ${state.get().type}: ${msg.type}`
    );
  } finally {
    current.audio.playlistRequest.release();
    current.audio.request.release();
  }
}

/**
 * Creates a new voice note state machine in the `remote-initializing` state
 * then starts progressing it until a release message is received
 */
export const createVoiceNoteStateMachineForRemoteDownload = ({
  loginContext,
  visitor,
  resources,
  voiceNote,
}: {
  /** The login context to use for the upload */
  loginContext: LoginContextValue;

  /** The visitor who is using the client */
  visitor: Visitor;

  /** the request handlers used for the audio data */
  resources: VoiceNoteStateRemoteResources;

  /** the voice note to download */
  voiceNote: { uid: string; jwt: string };
}): VoiceNoteStateMachine => {
  const state = createWritableValueWithCallbacks<VoiceNoteState>({
    type: 'remote-initializing',
    loginContext,
    visitor,
    resources,
    voiceNote,
  });
  const messageQueue =
    createWritableValueWithCallbacks<VoiceNoteStateMachineMessage | null>(null);

  handleLoop(state, messageQueue, () => {
    onAssertFailed(state, messageQueue, 'should not assign uid in remote flow');
  });

  return {
    state,
    sendMessage: (message) => passMessageWithVWC(messageQueue, message),
  };
};
