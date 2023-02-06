# SecureStore keys

This file lists the keys we use within the secure store. This refers to the
expo-secure-store package, which uses:

- android: SharedPreferences encrypted with Android's Keystore system
- ios: keychain services as generic password

This api has a limit of 2048 bytes, so generally a single value will
be split across multiple keys, using the following paradigm:

- `{base}-length` goes to the total length, in bytes, of the value.
  This is used to know when to stop reading the value, in particular
  when the content is an exact multiple of 2048 bytes
- `{base}-sha512` goes to the expected sha512 of the overall value,
  base64 encoded with trailing padding and without wrapping lines,
  without a trailing newline. This is used to detect if the value
  was corrupted, typically as a result of developer error.
- `{base}-{n}` goes to the nth segment, 0-indexed. The length of each
  segment is guarranteed to be the smaller of 2048 bytes or the remaining,
  whichever is shorter.

When using this convention the key will be marked paginated. Example:

- `example (paginated)`: some data

means that we are using `example-length`, `example-sha512`, `example-{n}`

See also:

- [deleteSecurePaginated](../../src/shared/lib/deleteSecurePaginated.tsx)
- [retrieveSecurePaginated](../../src/shared/lib/retrieveSecurePaginated.tsx)
- [storeSecurePaginated](../../src/shared/lib/storeSecurePaginated.tsx)

## Keys

- `id_token (paginated)`: goes to the id token jwt, if we have one
- `refresh_token (paginated)`: goes to the refresh token jwt, if we have one
