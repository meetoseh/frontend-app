import { getCalendars } from 'expo-localization';
import { useMemo } from 'react';

/**
 * Fetches the users current timezone as an IANA timezone string. If it
 * could not be found, the value is guessed and `guessed` is set to `true`.
 * Otherwise, `guessed` is `false`.
 */
export const useTimezone = (): {
  timeZone: string;
  guessed: boolean;
  timeZoneTechnique: string;
} => {
  return useMemo(() => getTimezone(), []);
};

/**
 * Fetches the users current timezone as an IANA timezone string. If it
 * could not be found, the value is guessed and `guessed` is set to `true`.
 * Otherwise, `guessed` is `false`.
 */
export const getTimezone = (): {
  timeZone: string;
  guessed: boolean;
  timeZoneTechnique: string;
} => {
  const calendars = getCalendars();
  for (const calendar of calendars) {
    if (calendar.timeZone !== null) {
      return {
        timeZone: calendar.timeZone,
        guessed: false,
        timeZoneTechnique: 'app',
      };
    }
  }
  return {
    timeZone: 'America/Los_Angeles',
    guessed: true,
    timeZoneTechnique: 'app-guessed',
  };
};
