import { LoginContextValueLoggedIn } from '../contexts/LoginContext';
import { WrappedJournalClientKey } from '../journals/clientKeys';
import { apiFetch } from './apiFetch';
import { getCurrentServerTimeMS } from './getCurrentServerTimeMS';
import * as Crypto from 'expo-crypto';
import { Buffer } from '@craftzdog/react-native-buffer';
import { ValueWithCallbacks } from './Callbacks';

type Alphabet = 'ascii';

const generateRandomString = async (
  size: number,
  alphabet: Alphabet
): Promise<[Uint8Array, string]> => {
  // for right now, only ascii, which is just any value 0-127
  const result = await Crypto.getRandomBytesAsync(size);
  for (let i = 0; i < result.length; i++) {
    result[i] = result[i] % 128;
  }
  return [result, Buffer.from(result).toString('ascii')];
};

/**
 * Tests our fernet encryption algorithm via the test endpoint.
 */
export const testFernet = async (
  user: LoginContextValueLoggedIn,
  key: WrappedJournalClientKey,
  matrix: {
    sizes: number[];
    alphabets: 'ascii'[];
    repetitions: number;
  },
  active: ValueWithCallbacks<boolean>
) => {
  for (const alphabet of matrix.alphabets) {
    console.log('starting on alphabet:', alphabet);
    for (const size of matrix.sizes) {
      console.log('starting on size:', size);
      for (let repetition = 0; repetition < matrix.repetitions; repetition++) {
        if (!active.get()) {
          console.log('stopping early (!active.get())');
          return;
        }

        const [payloadBytes, payloadStr] = await generateRandomString(
          size,
          alphabet
        );
        const payloadSha256 = await Crypto.digest(
          Crypto.CryptoDigestAlgorithm.SHA256,
          payloadBytes
        );
        const payloadSha256Hex = Array.from(new Uint8Array(payloadSha256))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const now = await getCurrentServerTimeMS();

        let encrypted;
        try {
          encrypted = await key.key.encrypt(payloadStr, now);
        } catch (e) {
          throw new Error(
            `failed to encrypt ${payloadStr} (size=${size}, alphabet=${alphabet}, repetition=${repetition}): ${e}`
          );
        }
        let decrypted;
        try {
          decrypted = await key.key.decrypt(encrypted, now);
        } catch (e) {
          throw new Error(
            `failed to decrypt ${payloadStr} (size=${size}, alphabet=${alphabet}, repetition=${repetition}): ${e}`
          );
        }
        if (payloadStr !== decrypted) {
          throw new Error(
            `our internal encryption/decryption failed for ${payloadStr}; encrypted=${encrypted}, decrypted=${decrypted}`
          );
        }

        const response = await apiFetch(
          '/api/1/journals/client_keys/test',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              journal_client_key_uid: key.uid,
              encrypted_payload: encrypted,
              expected_sha256: payloadSha256Hex,
            }),
          },
          user
        );
        if (!response.ok) {
          const body = await response.text();
          throw new Error(
            `server failed to decrypt ${payloadStr} (${response.status}): ${body}`
          );
        }
      }
    }
  }
};

/*
const cleanupTester = createValuesWithCallbacksEffect(
  [ctx.login.value, ctx.interests.visitor.value],
  () => {
    const userRaw = ctx.login.value.get();
    if (userRaw.state !== 'logged-in') {
      return;
    }
    const user = userRaw;

    if (ctx.interests.visitor.value.get().loading) {
      return;
    }

    const active = createWritableValueWithCallbacks(true);
    test();
    return () => {
      setVWC(active, false);
    };

    async function test() {
      if (Constants.expoConfig!.extra!.environment !== 'dev') {
        console.log(
          'not testing (not in dev): ',
          process.env.REACT_APP_ENVIRONMENT
        );
        return;
      }

      const clientKey = await getOrCreateClientKey(
        user,
        ctx.interests.visitor
      );
      const wrappedClientKey: WrappedJournalClientKey = {
        uid: clientKey.uid,
        key: await createFernet(clientKey.key),
      };
      console.log('starting testing');
      await testFernet(
        user,
        wrappedClientKey,
        {
          sizes: [0, 1, 8, 15, 16, 17, 63, 64, 65, 100, 1000, 1023, 1024],
          alphabets: ['ascii'],
          repetitions: 100,
        },
        active
      );
      console.log('done testing');
    }
  }
);
*/
