# insecure-store

This file lists the keys we use within the insecure store. This refers to the
@react-native-async-storage/async-storage package, which uses:

- android: SQLite storage, capped at 6MB with a max per-entry size of about 2MB
- ios: flat files in Application Support, with small values inlined into a
  manifest file. No known storage limits using this technique. Excluded from
  iOS cloud backup.

## Keys

- `user_attributes`: goes to a jsonified value of UserAttributes from
  [LoginContext](../../src/shared/contexts/LoginContext.tsx)
