import * as Crypto from 'expo-crypto';
import * as aes from 'aes-js';
import { Buffer } from '@craftzdog/react-native-buffer';
import { hmacSha256 } from './hmacSha256';

class Fernet {
  /** The original key as it is stored */
  readonly key: string;

  /* Signing key, extracted from the key */
  private readonly signingKeyData: Uint8Array;

  /* Encryption key, extracted from the key */
  private readonly encryptionKeyData: Uint8Array;

  constructor(key: string) {
    this.key = key;
    const keyData = Buffer.from(
      key.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );
    this.signingKeyData = Uint8Array.prototype.slice.call(keyData, 0, 16);
    this.encryptionKeyData = Uint8Array.prototype.slice.call(keyData, 16, 32);
  }

  /**
   * Uses the symmetric key to encrypt the given message using the Fernet
   * symmetric encryption algorithm: https://github.com/fernet/spec/
   *
   * Fernet includes a 64-bit timestamp field with second-level precision but does
   * not require a specific time to live. We use 2 minutes to protect against
   * replay attacks and to ensure that message ages are not faked. This means you
   * need to ensure the provided time is synchronized with the server (i.e., via
   * getCurrentServerTimeMS) in case the device clock is off.
   *
   * @param messageUtf8 The message to encode, may include any UTF-8 characters.
   * @param timeServerMS The current time in milliseconds since the Unix epoch.
   * @returns The Fernet token as a base64 (url) encoded string.
   */
  async encrypt(messageUtf8: string, timeServerMS: number): Promise<string> {
    const iv = await Crypto.getRandomBytesAsync(16);

    const message = Buffer.from(messageUtf8, 'utf-8');

    const timeServerIntegerSeconds = BigInt(Math.floor(timeServerMS / 1000));
    const timeServerBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      timeServerBytes[i] = Number(
        (timeServerIntegerSeconds >> BigInt(8 * (7 - i))) & BigInt(0xff)
      );
    }

    const paddedMessage =
      message.length % 16 === 0 ? message : aes.padding.pkcs7.pad(message);
    const cipherText = new aes.ModeOfOperation.cbc(
      this.encryptionKeyData,
      iv
    ).encrypt(paddedMessage);

    const basicParts = new Uint8Array(
      1 + 8 + iv.byteLength + cipherText.byteLength
    );
    basicParts[0] = 0x80;
    basicParts.set(timeServerBytes, 1);
    basicParts.set(iv, 1 + 8);
    basicParts.set(cipherText, 1 + 8 + iv.byteLength);

    const signature = await hmacSha256(this.signingKeyData, basicParts);

    const result = new Uint8Array(basicParts.byteLength + signature.byteLength);
    result.set(basicParts);
    result.set(signature, basicParts.byteLength);

    return Buffer.from(result)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * Uses the symmetric key to decrypt the given Fernet token using the Fernet
   * symmetric encryption algorithm:
   *
   * Fernet includes a 64-bit timestamp field with second-level precision but does
   * not require a specific time to live. We use 2 minutes to protect against
   * replay attacks and to ensure that message ages are not faked. This means you
   * need to ensure the provided time is synchronized with the server (i.e., via
   * getCurrentServerTimeMS) in case the device clock is off.
   *
   * @param tokenBase64Url The Fernet token as a base64 (url) encoded string.
   * @param timeServerMS The current time in milliseconds since the Unix epoch.
   * @returns The decrypted message as a UTF-8 string.
   */
  async decrypt(tokenBase64Url: string, timeServerMS: number): Promise<string> {
    const token = Buffer.from(
      tokenBase64Url.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );
    const signature = Uint8Array.prototype.slice.call(token, -32);
    const basicParts = Uint8Array.prototype.slice.call(token, 0, -32);

    if (basicParts[0] !== 0x80) {
      throw new Error('Invalid Fernet token version');
    }

    const expectedSignature = await hmacSha256(this.signingKeyData, basicParts);
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature[i] ^ expectedSignature[i];
    }
    if (mismatch !== 0) {
      throw new Error('Invalid Fernet token signature');
    }

    const tokenTimeSeconds = basicParts
      .slice(1, 9)
      .reduce((acc, byte) => (acc << BigInt(8)) + BigInt(byte), BigInt(0));
    const currentServerTimeSeconds = BigInt(Math.floor(timeServerMS / 1000));

    if (tokenTimeSeconds < currentServerTimeSeconds - BigInt(120)) {
      throw new Error('Token expired (excessively far in the past)');
    }
    if (tokenTimeSeconds > currentServerTimeSeconds + BigInt(120)) {
      throw new Error('Token from the future (excessively far in the future)');
    }

    const iv = basicParts.slice(9, 25);
    const cipherText = basicParts.slice(25);

    const paddedMessage = new aes.ModeOfOperation.cbc(
      this.encryptionKeyData,
      iv
    ).decrypt(cipherText);
    const message = aes.padding.pkcs7.strip(paddedMessage);

    return Buffer.from(message).toString('utf-8');
  }
}

export type { Fernet };

/**
 * Creates a new Fernet instance from the given key, ready for encryption
 * and decryption.
 */
export const createFernet = async (key: string): Promise<Fernet> => {
  return new Fernet(key);
};
