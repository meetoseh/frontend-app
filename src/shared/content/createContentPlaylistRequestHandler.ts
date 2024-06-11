import { createGetDataFromRefUsingSignal } from '../images/createGetDataFromRefUsingSignal';
import { CancelablePromise } from '../lib/CancelablePromise';
import { getJwtExpiration } from '../lib/getJwtExpiration';
import { RequestHandler, Result } from '../requests/RequestHandler';
import {
  OsehContentNativeMinimalRef,
  OsehContentNativeRef,
  OsehContentRefLoadable,
} from './OsehContentRef';
import { ContentFileNativeExport } from './OsehContentTarget';
import { getNativeExport } from './useOsehContentTarget';

/**
 * Creates a request handler for fetching what media is available for
 * a given content ref.
 *
 * This is for the web only; for native apps, a content ref can be directly
 * converted to an m3u8 url which is generated on the fly given search parameters
 * via `getNativeExport`
 */
export const createContentPlaylistRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<
  OsehContentNativeMinimalRef,
  OsehContentNativeRef,
  ContentFileNativeExport
> => {
  return new RequestHandler({
    getRefUid,
    getDataFromRef,
    compareRefs,
    logConfig: { logging },
    cacheConfig: { maxStale, keepActiveRequestsIntoStale: true },
    retryConfig: { maxRetries },
  });
};

const getRefUid = (ref: OsehContentNativeMinimalRef): string => {
  if (ref.showAs === 'audio') {
    return `audio:${ref.uid}`;
  }
  return `video:${ref.uid}@${ref.displayWidth}x${ref.displayHeight}`;
};

const getDataFromRef: (
  ref: OsehContentNativeRef
) => CancelablePromise<Result<ContentFileNativeExport>> =
  createGetDataFromRefUsingSignal({
    inner: async (ref, signal) => {
      return getNativeExport(
        ref.uid,
        ref.jwt,
        false,
        ref.showAs === 'audio'
          ? undefined
          : { width: ref.displayWidth, height: ref.displayHeight }
      );
    },
    isExpired: (ref, nowServer) => getJwtExpiration(ref.jwt) < nowServer,
  });
const compareRefs = (
  a: OsehContentNativeRef,
  b: OsehContentNativeRef
): number => getJwtExpiration(b.jwt) - getJwtExpiration(a.jwt);
