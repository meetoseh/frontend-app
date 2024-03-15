import {
  LoginContextValue,
  LoginContextValueLoggedIn,
} from '../../../../shared/contexts/LoginContext';
import { HTTP_FRONTEND_URL, apiFetch } from '../../../../shared/lib/apiFetch';
import { MergeProvider } from './MergeAccountState';
import Constants from 'expo-constants';
import { mergeRedirectUrl } from './hooks/usePromptMergeUsingModal';

const isDevelopment = Constants.expoConfig?.extra?.environment === 'dev';

/**
 * Gets the URL that the user should be sent to in order to merge their account
 * with the one associated with the given provider.
 *
 * @param loginContext The login context, as these merge urls require authentication
 * @param provider The provider to merge with
 */
export const getMergeProviderUrl = async (
  loginContext: LoginContextValueLoggedIn,
  provider: MergeProvider
): Promise<string> => {
  if (isDevelopment && provider !== 'Direct') {
    return (
      HTTP_FRONTEND_URL +
      '/dev_login?merge=1&redirect_url=' +
      encodeURIComponent(mergeRedirectUrl) +
      '&id_token=' +
      loginContext.authTokens?.idToken
    );
  }

  if (!isDevelopment && provider === 'Dev') {
    // This shouldn't happen, but just in case we'll generate a real url
    provider = 'Direct';
  }

  const response = await apiFetch(
    '/api/1/oauth/prepare_for_merge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        provider: provider,
        redirect_uri: mergeRedirectUrl,
      }),
    },
    loginContext
  );

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();
  return data.url;
};