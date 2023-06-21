import { DownloadedItem } from './DownloadedItem';
import { PlaylistItem } from './Playlist';
import * as FileSystem from 'expo-file-system';

/**
 * Downloads the given playlist item. Returns a rejected promise if
 * there is a network error or the server returns a non-200 status code.
 *
 * @param item The item to download
 * @param jwt The JWT to use to authenticate the request
 * @param opts.abortSignal An abort signal to abort the request before it
 *   completes. Only available in some browsers.
 * @returns The downloaded item
 */
export const downloadItem = async (
  item: PlaylistItem,
  jwt: string,
  opts?: { abortSignal?: AbortSignal }
): Promise<DownloadedItem> => {
  const response = await fetch(item.url, {
    headers: { Authorization: `bearer ${jwt}` },
    ...(opts?.abortSignal === undefined ? {} : { signal: opts.abortSignal }),
  });
  if (!response.ok) {
    throw response;
  }

  const targetFolder = FileSystem.cacheDirectory + 'images/';
  const dirInfo = await FileSystem.getInfoAsync(targetFolder);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
  }

  const uidWithExt = item.url.split('/').pop();
  const targetFile = targetFolder + uidWithExt;
  const fileInfo = await FileSystem.getInfoAsync(targetFile);
  if (!fileInfo.exists) {
    try {
      await FileSystem.downloadAsync(item.url, targetFile, {
        headers: { Authorization: `bearer ${jwt}` },
      });
    } catch (e) {
      await FileSystem.deleteAsync(targetFile, { idempotent: true });
      throw e;
    }
  }

  return {
    remoteUrl: item.url,
    originalLocalUrl: targetFile,
    localUrl: targetFile,
  };
};
