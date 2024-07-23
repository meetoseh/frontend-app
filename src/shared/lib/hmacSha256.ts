import * as Crypto from 'expo-crypto';

/**
 * Couldn't find a built-in to do this, but at least the hash function is built-in.
 * Computes HMAC-SHA256 of the given message using the given key.
 */
export const hmacSha256 = async (
  key: Uint8Array,
  message: Uint8Array
): Promise<Uint8Array> => {
  let stretchedKey: Uint8Array;
  if (key.length === 64) {
    stretchedKey = key;
  } else if (key.length < 64) {
    stretchedKey = new Uint8Array(64);
    stretchedKey.set(key);
  } else {
    stretchedKey = new Uint8Array(
      await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, key)
    );
  }

  const innerKeyPad = new Uint8Array(64);
  for (let i = 0; i < stretchedKey.length; i++) {
    innerKeyPad[i] = stretchedKey[i] ^ 0x36;
  }

  const innerMessage = new Uint8Array(innerKeyPad.length + message.length);
  innerMessage.set(innerKeyPad);
  innerMessage.set(message, innerKeyPad.length);

  const innerHash = new Uint8Array(
    await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, innerMessage)
  );

  const outerKeyPad = new Uint8Array(64);
  for (let i = 0; i < stretchedKey.length; i++) {
    outerKeyPad[i] = stretchedKey[i] ^ 0x5c;
  }
  const outerMessage = new Uint8Array(outerKeyPad.length + innerHash.length);
  outerMessage.set(outerKeyPad);
  outerMessage.set(innerHash, outerKeyPad.length);

  const outerHash = new Uint8Array(
    await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, outerMessage)
  );

  return outerHash;
};
