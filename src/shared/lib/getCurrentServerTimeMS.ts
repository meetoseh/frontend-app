import { apiFetch } from './apiFetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredClockDrift = {
  correctionMS: number;
  checkedAt: number;
  isSynthetic: boolean;
};

const CLOCK_DRIFT_KEY = 'clockDrift';

const getStoredClockDrift = async (): Promise<StoredClockDrift | null> => {
  const raw = await AsyncStorage.getItem(CLOCK_DRIFT_KEY);
  if (raw === null || raw === undefined) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    if (
      typeof parsed.correctionMS !== 'number' ||
      typeof parsed.checkedAt !== 'number' ||
      typeof parsed.isSynthetic !== 'boolean'
    ) {
      return null;
    }

    return {
      correctionMS: parsed.correctionMS,
      checkedAt: parsed.checkedAt,
      isSynthetic: parsed.isSynthetic,
    };
  } catch (e) {
    await AsyncStorage.removeItem(CLOCK_DRIFT_KEY);
    return null;
  }
};

const setStoredClockDrift = async (
  drift: StoredClockDrift | null
): Promise<void> => {
  if (drift === null) {
    await AsyncStorage.removeItem(CLOCK_DRIFT_KEY);
    return;
  }

  await AsyncStorage.setItem(CLOCK_DRIFT_KEY, JSON.stringify(drift));
};

const tryUseServerForCristiansAlgorithm =
  async (): Promise<StoredClockDrift> => {
    const initialClientTime = Date.now();
    const response = await apiFetch(
      '/api/1/misc/now',
      {
        method: 'GET',
      },
      null
    );
    const data: { now: number } = await response.json();
    const serverTime = data.now * 1000;
    const finalClientTime = Date.now();

    const roundTripTime = finalClientTime - initialClientTime;
    const oneWayTime = roundTripTime / 2;
    const correctionMS = serverTime - (initialClientTime + oneWayTime);

    return {
      correctionMS,
      checkedAt: finalClientTime,
      isSynthetic: false,
    };
  };

const computeClockDrift = async (): Promise<StoredClockDrift> => {
  try {
    return await tryUseServerForCristiansAlgorithm();
  } catch (e) {
    console.log('failed to use server for cristians algorithm', e);
    return {
      correctionMS: 0,
      checkedAt: Date.now(),
      isSynthetic: true,
    };
  }
};

const getClockDriftWithLocalCache = async (): Promise<StoredClockDrift> => {
  const stored = await getStoredClockDrift();
  const clientNow = Date.now();
  if (stored !== null && stored.checkedAt > clientNow - 15 * 60 * 1000) {
    return stored;
  }

  const computed = await computeClockDrift();
  await setStoredClockDrift(computed);
  return computed;
};

/**
 * Semantically equivalent to Date.now(), except this will account for
 * clock drift with the server. This was added in response to user reports
 * of incorrect behavior eventually tracked down to clock drift.
 *
 * Whenever comparing times with the server, e.g, expiration times on JWTs,
 * use this function instead of Date.now(). It's still safe to use client
 * side times if they are not mixed with server side times, e.g., measuring
 * elapsed time.
 *
 * @returns A promise for the current server time in milliseconds. This will
 *   never fail; if the server cannot be contacted this will fallback to
 *   Date.now().
 */
export const getCurrentServerTimeMS = async (): Promise<number> => {
  const drift = await getClockDriftWithLocalCache();
  return Date.now() + drift.correctionMS;
};
