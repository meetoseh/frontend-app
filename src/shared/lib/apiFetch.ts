import { LoginContextValue } from '../contexts/LoginContext';
import Constants from 'expo-constants';

/**
 * The base url for simple http requests to the backend
 */
export const HTTP_API_URL: string = Constants.expoConfig!.extra!.rootBackendUrl!;

/**
 * The base url for websocket requests to the backend
 */
export const HTTP_WEBSOCKET_URL: string = Constants.expoConfig!.extra!.rootWebsocketUrl!;

/**
 * The base url for the web frontend
 */
export const HTTP_FRONTEND_URL: string = Constants.expoConfig!.extra!.rootFrontendUrl!;

/**
 * A basic wrapper around fetch that prefixes absolute paths with the correct
 * url for the backend and injects the correct authentication headers if
 * a user is provided
 *
 * @param path The path to append to the base url
 * @param init The init object to pass to fetch
 * @param user The user to use for authentication
 * @returns The response from the backend
 */
export const apiFetch = async (
  path: string,
  init: RequestInit | null,
  user: LoginContextValue | null
): Promise<Response> => {
  const url = HTTP_API_URL + path;
  const headers = new Headers(init ? init.headers : undefined);
  if (user?.authTokens?.idToken) {
    headers.set('authorization', 'bearer ' + user.authTokens.idToken);
  }

  return await fetch(url, {
    ...init,
    headers,
  });
};
