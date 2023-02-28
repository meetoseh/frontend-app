import { ReactElement, useContext, useEffect, useMemo, useState } from 'react';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { apiFetch } from '../../shared/lib/apiFetch';
import { convertUsingKeymap } from '../../shared/lib/CrudFetcher';
import { describeError } from '../../shared/lib/describeError';
import { getJwtExpiration } from '../../shared/lib/getJwtExpiration';
import { DailyEvent, dailyEventKeyMap } from '../models/DailyEvent';

/**
 * Fetches the current daily event using the now endpoint. This refreshes the
 * daily event whenever its jwt expires and can be forced to reload by changing
 * the counter.
 *
 * Returns the daily event (if loaded), and the error (if any).
 */
export const useCurrentDailyEvent = (
  reloadCounter?: number
): [DailyEvent | null, ReactElement | null] => {
  const loginContext = useContext(LoginContext);
  const [dailyEvent, setDailyEvent] = useState<DailyEvent | null>(null);
  const [error, setError] = useState<ReactElement | null>(null);

  useEffect(() => {
    if (loginContext.state !== 'logged-in') {
      return;
    }

    let active = true;
    let timeout: NodeJS.Timeout | null = null;
    loadDailyEvent();
    return () => {
      if (!active) {
        return;
      }
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }

      active = false;
    };

    async function onAboutToExpire() {
      if (!active) {
        return;
      }
      timeout = null;
      await loadDailyEvent();
    }

    async function loadDailyEvent() {
      setError(null);
      try {
        const response = await apiFetch(
          '/api/1/daily_events/now',
          {
            method: 'GET',
          },
          loginContext
        );

        if (!active) {
          return;
        }

        if (!response.ok) {
          throw response;
        }

        const data = await response.json();
        if (!active) {
          return;
        }

        const dailyEvent = convertUsingKeymap(data, dailyEventKeyMap);
        setDailyEvent(dailyEvent);

        const expiresAt = getJwtExpiration(dailyEvent.jwt);
        timeout = setTimeout(onAboutToExpire, expiresAt - Date.now() - 15);
      } catch (e) {
        if (!active) {
          return;
        }

        const err = await describeError(e);
        if (!active) {
          return;
        }

        setError(err);
      }
    }
  }, [loginContext, reloadCounter]);

  return useMemo(() => [dailyEvent, error], [dailyEvent, error]);
};
