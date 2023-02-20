import * as SecureStore from 'expo-secure-store';

/**
 * Deletes a key that was set as if by storeSecurePaginated.
 *
 * @param baseKey The base key to use for the storage
 */
export const deleteSecurePaginated = async (baseKey: string) => {
  const lengthKey = `${baseKey}-length`;
  const digestKey = `${baseKey}-sha512`;

  let expectedLength;
  try {
    expectedLength = await SecureStore.getItemAsync(lengthKey);
  } catch (e) {
    // item did not exist or the secure store encryption key has been rotated
    try {
      await SecureStore.deleteItemAsync(lengthKey);
    } catch (e) {
      // Ignore; the key did not exist
    }
    expectedLength = null;
  }

  if (expectedLength !== null) {
    await SecureStore.deleteItemAsync(lengthKey);
  }

  try {
    await SecureStore.deleteItemAsync(digestKey);
  } catch (e) {
    // Ignore; the key did not exist
  }

  let minKeysToCheck = 1;
  if (expectedLength !== null) {
    try {
      minKeysToCheck = Math.max(Math.ceil(parseInt(expectedLength, 10) / 2048), 1);
    } catch (e) {
      // Ignore; the length key was not an integer. Fallback to delete-until-fail
    }
  }

  let i = 0;
  while (true) {
    let hadValue = false;
    try {
      const val = await SecureStore.getItemAsync(`${baseKey}-${i}`);
      hadValue = val !== null;
    } catch (e) {
      // item did not exist or the secure store encryption key has been rotated
      try {
        await SecureStore.deleteItemAsync(`${baseKey}-${i}`);
        hadValue = true;
      } catch (e) {
        // Ignore; the key did not exist
      }
    }

    if (hadValue) {
      try {
        await SecureStore.deleteItemAsync(`${baseKey}-${i}`);
      } catch (e) {
        // Ignore; the key did not exist
      }
      i++;
    } else {
      i++;
      if (i >= minKeysToCheck) {
        break;
      }
    }
  }
};
