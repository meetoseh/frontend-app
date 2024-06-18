import { RequestHandler } from '../../../../../shared/requests/RequestHandler';
import { createGetDataFromRefUsingSignal } from '../../../../../shared/images/createGetDataFromRefUsingSignal';
import { LoginContextValueLoggedIn } from '../../../../../shared/contexts/LoginContext';
import { OsehExpoToken } from './createExpoTokenHandler';
import { apiFetch } from '../../../../../shared/lib/apiFetch';
import { VISITOR_SOURCE } from '../../../../../shared/lib/visitorSource';
import { getJwtExpiration } from '../../../../../shared/lib/getJwtExpiration';

/** The OsehExpoTokenSyncRequest, but only the minimal data required for formatting the ref uid */
export type OsehExpoTokenSyncMinimalRequest = {
  token: OsehExpoToken;
  user: { userAttributes: { sub: string } };
};

export type OsehExpoTokenSyncRequest = {
  /** The token to associate */
  token: OsehExpoToken;

  /** The user to associate the token with */
  user: LoginContextValueLoggedIn;
};

export type OsehExpoTokenSync = {
  /** The token we synchronized with the backend server */
  token: string;

  /** The sub of the user we associated the token with */
  sub: string;

  /** When we associated the token with the user */
  attachedAt: Date;

  /** When we should refresh this association */
  expiresAt: Date;
};

/** How long before we attempt to refresh the token */
const EXPIRATION_MS = 1000 * 60 * 60 * 24;

/**
 * Creates a request handler for expo to generate a unique token that allows
 * sending push tokens to this device. Requires that we have permission to
 * send notifications.
 */
export const createExpoTokenSyncRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<
  OsehExpoTokenSyncMinimalRequest,
  OsehExpoTokenSyncRequest,
  OsehExpoTokenSync
> => {
  return new RequestHandler({
    getRefUid,
    getDataFromRef,
    compareRefs,
    logConfig: { logging },
    cacheConfig: { maxStale, keepActiveRequestsIntoStale: false },
    retryConfig: { maxRetries },
  });
};

const getRefUid = (ref: OsehExpoTokenSyncMinimalRequest): string =>
  `${ref.user.userAttributes.sub}-${ref.token.token}`;

const getDataFromRef = createGetDataFromRefUsingSignal({
  inner: async (
    ref: OsehExpoTokenSyncRequest,
    signal
  ): Promise<OsehExpoTokenSync> => {
    const response = await apiFetch(
      '/api/1/notifications/push/tokens/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          platform: VISITOR_SOURCE,
          push_token: ref.token.token,
        }),
        signal,
      },
      ref.user
    );
    if (!response.ok) {
      throw response;
    }

    const now = Date.now();
    return {
      token: ref.token.token,
      sub: ref.user.userAttributes.sub,
      attachedAt: new Date(now),
      expiresAt: new Date(now + EXPIRATION_MS),
    };
  },
});
const compareRefs = (
  a: OsehExpoTokenSyncRequest,
  b: OsehExpoTokenSyncRequest
): number =>
  getJwtExpiration(b.user.authTokens.idToken) -
  getJwtExpiration(a.user.authTokens.idToken);
