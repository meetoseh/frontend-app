import { LoginContextValueLoggedIn } from '../contexts/LoginContext';
import { Visitor } from '../hooks/useVisitorValueWithCallbacks';
import { createWritableValueWithCallbacks } from '../lib/Callbacks';
import { createFernet, Fernet } from '../lib/fernet';
import { hmacSha256 } from '../lib/hmacSha256';
import { powmod } from '../lib/powmod';
import { VISITOR_SOURCE } from '../lib/visitorSource';
import { waitForValueWithCallbacksConditionCancelable } from '../lib/waitForValueWithCallbacksCondition';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from '@craftzdog/react-native-buffer';
import { DisplayableError } from '../lib/errors';
import {
  createSmartAPIFetch,
  createTypicalSmartAPIFetchMapper,
} from '../lib/smartApiFetch';

/**
 * Describes a Journal Client Key, which allows us to add an additional
 * layer of encryption when transferring journal entries to/from the server
 */
export type JournalClientKey = {
  /** The unique identifier for this key */
  uid: string;
  /** The fernet key */
  key: string;
};

export type WrappedJournalClientKey = {
  /** The unique identifier for this key */
  uid: string;
  /** The fernet key */
  key: Fernet;
};

const storageLock = createWritableValueWithCallbacks(false);
const withStorageLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  while (true) {
    await waitForValueWithCallbacksConditionCancelable(storageLock, (v) => !v)
      .promise;
    if (!storageLock.get()) {
      break;
    }
  }
  storageLock.set(true);
  storageLock.callbacks.call(undefined);
  try {
    return await fn();
  } finally {
    storageLock.set(false);
    storageLock.callbacks.call(undefined);
  }
};

/**
 * Gets the current journal client key, or creates a new one if none is available
 */
export const getOrCreateClientKey = async (
  user: LoginContextValueLoggedIn,
  visitor: Visitor
): Promise<JournalClientKey> => {
  return withStorageLock(async () => {
    const existing = await getClientKey(user);
    if (existing !== null) {
      return existing;
    }

    const created = await createClientKey(user, visitor);
    await storeClientKey(user, created);
    return created;
  });
};

/**
 * Like `getOrCreateClientKey` in that it gets or creates a client key, but
 * it also wraps the raw secret key in a Fernet object so that it can be used
 */
export const getOrCreateWrappedClientKey = async (
  user: LoginContextValueLoggedIn,
  visitor: Visitor
): Promise<WrappedJournalClientKey> => {
  let raw;
  try {
    raw = await getOrCreateClientKey(user, visitor);
  } catch (e) {
    const err =
      e instanceof DisplayableError
        ? e
        : new DisplayableError(
            'client',
            'setup encryption',
            'failed to get key'
          );
    throw err;
  }

  let key;
  try {
    key = await createFernet(raw.key);
  } catch (e) {
    const err =
      e instanceof DisplayableError
        ? e
        : new DisplayableError(
            'client',
            'setup encryption',
            'failed to create fernet key'
          );
    throw err;
  }

  return { key, uid: raw.uid };
};

const getClientKey = async (
  user: LoginContextValueLoggedIn
): Promise<JournalClientKey | null> => {
  const stored = await SecureStore.getItemAsync('journalClientKey');
  if (stored === null) {
    return null;
  }

  const parsed: { user: string; key: JournalClientKey } = JSON.parse(stored);
  if (parsed.user !== user.userAttributes.sub) {
    await SecureStore.deleteItemAsync('journalClientKey');
    return null;
  }

  return parsed.key;
};

const storeClientKey = async (
  user: LoginContextValueLoggedIn,
  key: JournalClientKey
): Promise<void> => {
  await SecureStore.setItemAsync(
    'journalClientKey',
    JSON.stringify({ user: user.userAttributes.sub, key })
  );
};

const GROUP_14_PRIME = BigInt(
  '32317006071311007300338913926423828248817941241140239112842009751400741706634354222619689417363569347117901737909704191754605873209195028853758986185622153212175412514901774520270235796078236248884246189477587641105928646099411723245426622522193230540919037680524235519125679715870117001058055877651038861847280257976054903569732561526167081339361799541336476559160368317896729073178384589680639671900977202194168647225871031411336429319536193471636533209717077448227988588565369208645296636077250268955505928362751121174096972998068410554359584866583291642136218231078990999448652468262416972035911852507045361090559'
);
const GROUP_14_GENERATOR = BigInt(2);

const createClientKey = async (
  user: LoginContextValueLoggedIn,
  visitor: Visitor
): Promise<JournalClientKey> => {
  const ourPrivateKey = await Crypto.getRandomBytesAsync(256);
  const ourPrivateKeyNumber = BigInt(
    '0x' +
      Array.from(ourPrivateKey)
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
  );
  const ourPublicKey = powmod(
    GROUP_14_GENERATOR,
    ourPrivateKeyNumber,
    GROUP_14_PRIME
  );
  const ourPublicKeyAsBytes = Buffer.alloc(256);
  for (let i = 0; i < 256; i++) {
    ourPublicKeyAsBytes[i] = Number(
      (ourPublicKey >> BigInt(8 * (255 - i))) & BigInt(0xff)
    );
  }
  const ourPublicKeyAsStandardBase64 = ourPublicKeyAsBytes.toString('base64');

  const initialVisitor = await waitForValueWithCallbacksConditionCancelable(
    visitor.value,
    (v) => !v.loading
  ).promise;
  if (initialVisitor.loading) {
    throw new Error('Visitor is still loading');
  }

  const responseGetter = createSmartAPIFetch({
    path: '/api/1/journals/client_keys/',
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(initialVisitor.uid === null
          ? {}
          : {
              Visitor: initialVisitor.uid,
            }),
      },
      body: JSON.stringify({
        platform: VISITOR_SOURCE,
        client_dh_public_key: ourPublicKeyAsStandardBase64,
      }),
    },
    user: () => ({ user }),
    retryer: 'default',
    mapper: createTypicalSmartAPIFetchMapper({
      mapJSON: (v) =>
        v as {
          uid: string;
          server_dh_public_key: string;
          salt: string;
          visitor: string;
        },
      action: 'create journal client key',
    }),
  });
  const responseDone = waitForValueWithCallbacksConditionCancelable(
    responseGetter.state,
    (s) => s.type === 'error' || s.type === 'success' || s.type === 'released'
  );
  await responseDone.promise;

  const finalState = responseGetter.state.get();
  if (finalState.type !== 'released') {
    responseGetter.sendMessage({ type: 'release' });
  }

  if (finalState.type !== 'success') {
    if (finalState.type === 'error') {
      throw finalState.error;
    }
    throw new DisplayableError(
      'client',
      'create journal client key',
      `unexpected request state: ${finalState.type}`
    );
  }

  const data = finalState.value;
  if (data.visitor !== initialVisitor.uid) {
    visitor.setVisitor(data.visitor);
  }

  const serverPublicKeyAsBytes = Buffer.from(
    data.server_dh_public_key,
    'base64'
  );
  const serverPublicKey = BigInt('0x' + serverPublicKeyAsBytes.toString('hex'));

  const initialKeyMaterial = powmod(
    serverPublicKey,
    ourPrivateKeyNumber,
    GROUP_14_PRIME
  );

  const initialKeyMaterialAsBytes = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    initialKeyMaterialAsBytes[i] = Number(
      (initialKeyMaterial >> BigInt(8 * (255 - i))) & BigInt(0xff)
    );
  }

  const saltAsBytes = Buffer.from(data.salt, 'base64');
  const pseudoRandomKey = await hmacSha256(
    saltAsBytes,
    initialKeyMaterialAsBytes
  );
  const fernetKeyData = await hkdfExpand(new Uint8Array(pseudoRandomKey), 32);
  const fernetKeyBase64Url = Buffer.prototype.toString
    .call(fernetKeyData, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return {
    uid: data.uid,
    key: fernetKeyBase64Url,
  };
};

const hkdfExpand = async (
  prk: Uint8Array,
  length: number
): Promise<Uint8Array> => {
  const t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  let i = 0;
  while (okm.length < length) {
    i++;
    const hmacData = new Uint8Array(t.length + 1);
    hmacData.set(t);
    hmacData[t.length] = i;
    const hmac = await hmacSha256(prk, hmacData);
    const newOkm = new Uint8Array(okm.length + hmac.byteLength);
    newOkm.set(okm);
    newOkm.set(new Uint8Array(hmac), okm.length);
    okm = newOkm;
  }
  return okm.slice(0, length);
};

/**
 * Deletes the current journal client key if it exists and has the given uid,
 * otherwise does nothing.
 */
export const deleteClientKey = async (uid: string): Promise<void> => {
  return withStorageLock(async () => {
    const stored = await SecureStore.getItemAsync('journalClientKey');
    if (stored === null) {
      return;
    }

    const parsed: { user: string; key: JournalClientKey } = JSON.parse(stored);
    if (parsed.key.uid !== uid) {
      return;
    }

    await SecureStore.deleteItemAsync('journalClientKey');
  });
};

/**
 * Deletes journal client keys regardless of where they are
 */
export const purgeClientKeys = async (): Promise<void> => {
  return withStorageLock(async () => {
    await SecureStore.deleteItemAsync('journalClientKey');
  });
};
