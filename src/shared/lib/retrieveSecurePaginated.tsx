import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/**
 * Retrieves a key that was set as if by storeSecurePaginated. If any part of
 * the value is missing or the value does not pass a sha512 check, this will
 * return null but not necessarily clear the value.
 *
 * @param baseKey The base key to use for the storage
 */
export const retrieveSecurePaginated = async (
  baseKey: string
): Promise<string | null> => {
  const lengthKey = `${baseKey}-length`;
  const digestKey = `${baseKey}-sha512`;

  const expectedLength = await SecureStore.getItemAsync(lengthKey);
  if (expectedLength === null) {
    return null;
  }

  let expectedLengthNum = 0;
  try {
    expectedLengthNum = parseInt(expectedLength, 10);
  } catch (e) {
    return null;
  }

  if (expectedLengthNum <= 0) {
    return null;
  }
  const expectedNumParts = Math.ceil(expectedLengthNum / 2048);
  console.log('retrieveSecurePaginated retrieving', expectedNumParts, 'parts');

  const expectedDigest = await SecureStore.getItemAsync(digestKey);
  if (expectedDigest === null) {
    return null;
  }

  const parts = [];
  for (let i = 0; i < expectedNumParts; i++) {
    console.log(
      'retrieveSecurePaginated retrieving',
      expectedNumParts,
      'parts; getting part index',
      i
    );
    const val = await SecureStore.getItemAsync(`${baseKey}-${i}`);
    if (val === null) {
      console.log('retrieveSecurePaginated returning (part missing)');
      return null;
    }

    console.log('retrieveSecurePaginated pushing part');
    parts.push(val);
  }

  const retrieved = parts.join('');
  if (retrieved.length !== expectedLengthNum) {
    console.log('retrieveSecurePaginated returning (wrong length when joined)');
    return null;
  }

  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA512,
    retrieved
  );

  if (digest !== expectedDigest) {
    console.log('retrieveSecurePaginated returning (bad digest)');
    return null;
  }

  console.log('retrieveSecurePaginated returning with stored value');
  return retrieved;
};
