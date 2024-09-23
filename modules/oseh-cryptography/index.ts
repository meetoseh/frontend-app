import OsehCryptographyModule from './src/OsehCryptographyModule';

/**
 * Generates a RSA 4096 private key and returns the public modulus (n) and private exponent (d).
 * The public exponent (e) is always 65537.
 */
export async function generateRSA4096V1KeyPair(): Promise<{
  modulus: string;
  privateExponent: string;
  hwAccelInfo?: string;
}> {
  return await OsehCryptographyModule.generateRSA4096V1KeyPair();
}

/**
 * Decrypts a message encoded with an RSA 4096 public key returned from
 * generateRSA4096V1KeyPair, using only the hwAccelInfo that was returned.
 *
 * Returns the message base64 encoded.
 */
export async function decryptRSA4096V1(
  hwAccelInfo: string,
  encryptedB64: string
): Promise<string> {
  return await OsehCryptographyModule.decryptRSA4096V1(
    hwAccelInfo,
    encryptedB64
  );
}
