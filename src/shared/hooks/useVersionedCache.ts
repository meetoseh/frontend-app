import * as FileSystem from "expo-file-system";
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../lib/Callbacks";
import { useSingletonEffect } from "../lib/useSingletonEffect";
import { setVWC } from "../lib/setVWC";

/**
 * A hook-like function which should only be called by the top-level App, which
 * will clear the cache directory and write a file with the current version
 * number, unless the version number matches the one in the cache directory.
 *
 * @param version The version number of the app, updated at least as often as
 *   incompatibilities are introduced to the cache.
 * @returns A boolean which is true if the cache is ready to be used and false
 *   otherwise.
 */
export const useVersionedCache = (
  version: string
): ValueWithCallbacks<boolean> => {
  const result = useWritableValueWithCallbacks(() => false);

  useSingletonEffect((onDone) => {
    if (result.get()) {
      onDone();
      return;
    }

    cleanupCache().finally(() => {
      setVWC(result, true);
      onDone();
    });

    async function cleanupCache() {
      if (FileSystem.cacheDirectory === null) {
        return;
      }

      const cacheVersionFile = `${FileSystem.cacheDirectory}cacheVersion.txt`;

      const cacheVersonFileInfo = await FileSystem.getInfoAsync(
        cacheVersionFile
      );
      if (cacheVersonFileInfo.exists) {
        const cacheVersion = await FileSystem.readAsStringAsync(
          cacheVersionFile
        );
        if (cacheVersion === version) {
          return;
        }
      }

      await clearCache();
      await FileSystem.writeAsStringAsync(cacheVersionFile, version);
    }

    async function clearCache() {
      if (FileSystem.cacheDirectory === null) {
        return;
      }

      await deleteFolderContentsRecursively(FileSystem.cacheDirectory);
    }

    async function deleteFolderContentsRecursively(dir: string) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        return;
      }

      if (!dirInfo.isDirectory) {
        return;
      }

      const contents = await FileSystem.readDirectoryAsync(dir);
      for (const item of contents) {
        const itemPath = `${dir}${item}`;
        await FileSystem.deleteAsync(itemPath);
      }
    }
  }, []);

  return result;
};
