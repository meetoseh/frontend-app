import { ReactElement } from 'react';

/**
 * Describes the meta-information on a native export of a content file.
 */
export type ContentFileNativeExport = {
  /** The url where the m3u8 can be downloaded */
  url: string;
  /** True if the url is already presigned, false otherwise */
  presigned: boolean;
  /** The jwt for authorizing the download if the url is not presigned */
  jwt: string;
};

/**
 * Describes a loading, loaded, or failed-to-load target for a content file. This,
 * in particular, is used to decide where we can download the actual content file.
 * For the web, for maximum browser support we download a json file which tells us
 * where all the available files are, then select one from there. For native apps
 * the m3u8 file will already include that information, so this skips straight
 * to the loaded state.
 */
export type OsehContentTarget =
  | {
      /**
       * A discriminatory field to indicate if we're loading, loaded, or failed.
       */
      state: 'loading';
      /**
       * Null unless failed, in which case this is a ReactElement which can be
       * displayed to describe the failure.
       */
      error: null;
      /**
       * Null unless loaded, in which case this is the native export of the content
       * file. Note that on frontend-web this is replaced with webExport which
       * points to an mp4 file.
       */
      nativeExport: null;
      /**
       * True if the content file urls have been presigned and thus can be played
       * without custom headers, false if presigning via the jwt is required.
       */
      presigned: null;
      /**
       * The jwt that provides access to the content file either via a query parameter
       * or via a bearer token. If presigned, this jwt is already embedded in the url,
       * but it will be included here regardless.
       */
      jwt: null;
    }
  | {
      state: 'loaded';
      error: null;
      nativeExport: ContentFileNativeExport;
      presigned: boolean;
      jwt: string;
    }
  | {
      state: 'failed';
      error: ReactElement;
      nativeExport: null;
      presigned: null;
      jwt: null;
    };
