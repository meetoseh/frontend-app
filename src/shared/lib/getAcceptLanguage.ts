import { getLocales } from 'expo-localization';

/**
 * Determines an appropriate accept-language header value
 */
export const getAcceptLanguage = () => {
  const locales = getLocales();
  return locales[0].languageTag ?? 'en-US';
};
