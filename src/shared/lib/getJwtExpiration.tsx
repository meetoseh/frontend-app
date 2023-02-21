import { Buffer } from '@craftzdog/react-native-buffer';

/**
 * Determines when the JWT expires
 *
 * @param jwt The JWT to check
 * @returns The number of milliseconds since the epoch when the JWT expires
 */
export const getJwtExpiration = (jwt: string): number => {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT; incorrect number of parts');
  }

  const claimsBase64 = parts[1];
  const claimsJson = Buffer.from(claimsBase64, 'base64').toString('utf8');
  const payload = JSON.parse(claimsJson);
  if (!payload.exp) {
    throw new Error('Invalid JWT; no exp claim');
  }

  return payload.exp * 1000;
};
