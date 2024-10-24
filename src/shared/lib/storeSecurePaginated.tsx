import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { deleteSecurePaginated } from './deleteSecurePaginated';

/**
 * Stores the given data securely over multiple keys to get around the 2048
 * character limit on secure storage.
 *
 * This uses the following convention:
 * - `{base}-length` goes to the total length, in bytes, of the value.
 *   This is used to know when to stop reading the value, in particular
 *   when the content is an exact multiple of 2048 bytes
 * - `{base}-sha512` goes to the expected sha512 of the overall value,
 *   base64 encoded with trailing padding and without wrapping lines,
 *   without a trailing newline. This is used to detect if the value
 *   was corrupted, typically as a result of developer error.
 * - `{base}-{n}` goes to the nth segment, 0-indexed. The length of each
 *   segment is guarranteed to be the smaller of 2048 bytes or the remaining,
 *   whichever is shorter.
 *
 * @param baseKey The base key to use for the storage
 * @param data The data to store
 * @param suppressDelete If set to true, this will not erase the existing key. This
 *   will result in leakage if the key is already set and it's set to a longer
 *   value than the new value.
 */
export const storeSecurePaginated = async (
  baseKey: string,
  data: string,
  suppressDelete?: boolean | undefined
) => {
  if (suppressDelete === undefined) {
    suppressDelete = false;
  }

  if (data.length <= 0) {
    throw new Error('Cannot store empty data');
  }

  if (!suppressDelete) {
    await deleteSecurePaginated(baseKey);
  }

  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA512,
    data
  );

  const lengthKey = `${baseKey}-length`;
  const digestKey = `${baseKey}-sha512`;

  const lengthSetPromise = SecureStore.setItemAsync(
    lengthKey,
    data.length.toString()
  );
  const digestSetPromise = SecureStore.setItemAsync(digestKey, digest);

  const valSetPromises = [];

  const expectedNumParts = Math.ceil(data.length / 2048);

  for (let partIndex = 0; partIndex < expectedNumParts; partIndex++) {
    const dataStartIndex = partIndex * 2048;
    const dataEndIndex = Math.min(dataStartIndex + 2048, data.length);

    const val = data.substring(dataStartIndex, dataEndIndex);
    valSetPromises.push(
      SecureStore.setItemAsync(`${baseKey}-${partIndex}`, val)
    );
  }

  await Promise.all([lengthSetPromise, digestSetPromise, ...valSetPromises]);
};
