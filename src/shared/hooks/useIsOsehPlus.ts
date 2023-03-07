import { ReactElement, useEffect, useMemo, useState } from 'react';
import { LoginContextValue } from '../contexts/LoginContext';
import { apiFetch } from '../lib/apiFetch';
import { describeError } from '../lib/describeError';

export type IsOsehPlus = {
  /**
   * True if the value is a guess, false if the value is known
   */
  loading: boolean;

  /**
   * True if the user is on Oseh+, false otherwise
   */
  value: boolean;

  /**
   * If an error prevented the value from being determined, this will be
   * an element describing the error.
   */
  error: ReactElement | null;
};

/**
 * A hook-like function which determines if the user has oseh+, optionally
 * attempting to skip all intermediate caches.
 */
export const useIsOsehPlus = ({
  loginContext,
  force,
}: {
  loginContext: LoginContextValue;
  force?: boolean;
}): IsOsehPlus => {
  const [isOsehPlus, setIsOsehPlus] = useState<{ userSub: string; value: boolean } | null>(null);
  const [error, setError] = useState<ReactElement | null>(null);

  useEffect(() => {
    if (loginContext.state !== 'logged-in') {
      setIsOsehPlus(null);
      return;
    }

    if (isOsehPlus !== null && isOsehPlus.userSub === loginContext.userAttributes?.sub) {
      return;
    }

    let active = true;
    fetchIsOsehPlus(force ?? false);
    return () => {
      active = false;
    };

    async function fetchIsOsehPlus(bustCache: boolean): Promise<void> {
      try {
        const response = await apiFetch(
          '/api/1/users/me/entitlements/pro',
          {
            method: 'GET',
            ...(bustCache ? { headers: { Pragma: 'no-cache' } } : {}),
          },
          loginContext
        );

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (bustCache && response.status === 429) {
            return fetchIsOsehPlus(false);
          }
          throw response;
        }

        const data: { is_active: boolean } = await response.json();
        setIsOsehPlus({
          userSub: loginContext.userAttributes?.sub ?? 'not-available',
          value: data.is_active,
        });
      } catch (e) {
        if (!active) {
          return;
        }
        const err = await describeError(e);
        if (!active) {
          return;
        }
        setIsOsehPlus(null);
        setError(err);
      }
    }
  }, [loginContext, isOsehPlus, force]);

  return useMemo(
    () => ({
      loading: isOsehPlus === null,
      value: isOsehPlus?.value ?? false,
      error,
    }),
    [isOsehPlus, error]
  );
};
