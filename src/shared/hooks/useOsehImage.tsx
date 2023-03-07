import { ReactElement, useEffect, useMemo, useState } from 'react';
import { PixelRatio } from 'react-native';
import { HTTP_API_URL } from '../lib/apiFetch';
import { convertUsingKeymap, CrudFetcherKeyMap } from '../lib/CrudFetcher';
import { removeUnmatchedKeysFromMap } from '../lib/removeUnmatchedKeys';
import * as FileSystem from 'expo-file-system';
import { describeError } from '../lib/describeError';

/**
 * Describes the minimum information required to reference a specific
 * image.
 */
export type OsehImageRef = {
  /** The uid of the image file */
  uid: string;
  /** A JWT which provides access to the image file */
  jwt: string;
};

export type OsehImageProps = {
  /**
   * The uid of the oseh image file. If null, no image is loaded until
   * the uid is set.
   */
  uid: string | null;

  /**
   * The JWT which provides access to the image file. May only be null if not is_public
   */
  jwt: string | null;

  /**
   * The width we want to display the image at. The URL will be selected based on this.
   */
  displayWidth: number;

  /**
   * The height we want to display the image at. The URL will be selected based on this.
   */
  displayHeight: number;

  /**
   * The alt text for the image
   */
  alt: string;

  /**
   * If set and true, the jwt is ignored and we request this as a public file instead.
   */
  isPublic?: boolean;

  /**
   * If provided, this will be called whenever we start or finish loading
   * the image. This can be used to display a splash screen while the image
   * is loading.
   *
   * @param loading True if we're loading, false otherwise
   * @param uid The uid of the image we're loading, or null if we don't know yet
   */
  setLoading?: ((this: void, loading: boolean, uid: string | null) => void) | null;
};

/**
 * An item within a playlist
 */
type PlaylistItem = {
  /**
   * URL where the item can be accessed
   */
  url: string;
  /**
   * The format of the item, e.g., 'jpeg'
   */
  format: string;
  /**
   * The width of the item in pixels
   */
  width: number;
  /**
   * The height of the item in pixels
   */
  height: number;
  /**
   * The size of the item in bytes
   */
  sizeBytes: number;
};

const playlistItemKeymap: CrudFetcherKeyMap<PlaylistItem> = {
  size_bytes: 'sizeBytes',
};

const playlistItemsEqual = (a: PlaylistItem | null, b: PlaylistItem | null): boolean => {
  if (a === b) {
    return true;
  }

  if (a === null || b === null) {
    return false;
  }

  return (
    a.url === b.url &&
    a.format === b.format &&
    a.width === b.width &&
    a.height === b.height &&
    a.sizeBytes === b.sizeBytes
  );
};

type PlaylistItemWithJWT = { item: PlaylistItem; jwt: string };

type Playlist = {
  /**
   * The uid of the image file this playlist is for, so we don't refetch the image
   * just because the jwt changed
   */
  uid: string;

  /**
   * The items in the playlist, broken out by format, where
   * the lists are sorted by size, ascending.
   */
  items: { [format: string]: PlaylistItem[] };
};

const playlistKeymap: CrudFetcherKeyMap<Playlist> = {
  items: (_, v: { [format: string]: any[] }) => ({
    key: 'items',
    value: Object.fromEntries(
      Object.entries(v).map(([key, val]) => [
        key,
        val.map((v) => convertUsingKeymap(v, playlistItemKeymap)),
      ])
    ),
  }),
};

const playlistsEqual = (a: Playlist | null, b: Playlist | null): boolean => {
  if (a === b) {
    return true;
  }

  if (a === null || b === null) {
    return false;
  }

  if (a.uid !== b.uid) {
    return false;
  }

  const aKeys = Object.keys(a.items);
  const bKeys = Object.keys(b.items);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (!bKeys.includes(key)) {
      return false;
    }

    const aItems = a.items[key];
    const bItems = b.items[key];

    if (aItems.length !== bItems.length) {
      return false;
    }

    for (let i = 0; i < aItems.length; i++) {
      if (!playlistItemsEqual(aItems[i], bItems[i])) {
        return false;
      }
    }
  }

  return true;
};

type PlaylistWithJWT = { playlist: Playlist; jwt: string };

/**
 * If webp support is available
 */
const USES_WEBP: Promise<boolean> = Promise.resolve(true);

/**
 * The required state information to display an oseh image. Useful when you want
 * to use a single image in multiple places, as the standard OsehImage component
 * will refetch the image state every time
 */
export type OsehImageState = {
  /**
   * The local url where the image can be accessed
   */
  localUrl: string | null;

  /**
   * The width we want to display the image at. The URL will be selected based on this.
   */
  displayWidth: number;

  /**
   * The height we want to display the image at. The URL will be selected based on this.
   */
  displayHeight: number;

  /**
   * The alt text for the image
   */
  alt: string;

  /**
   * True if the image is loading, false otherwise
   */
  loading: boolean;

  /**
   * If an error prevented us from loading the image, this will be set to the
   * an element describing the error, otherwise it will be null
   */
  error: ReactElement | null;
};

/**
 * The information we need about an item that we have successfully
 * downloaded.
 */
type DownloadedItem = {
  /**
   * A URI where the resource can be accessed locally (either memory
   * or disk)
   */
  localUrl: string;

  /**
   * The URI we fetched the resource from, primarily for avoiding
   * refetching the same resource
   */
  remoteUrl: string;
};

const downloadedItemsEqual = (a: DownloadedItem | null, b: DownloadedItem | null): boolean => {
  if (a === b) {
    return true;
  }

  if (a === null || b === null) {
    return false;
  }

  return a.localUrl === b.localUrl && a.remoteUrl === b.remoteUrl;
};

/**
 * Gets how many useful pixels there are if you have an image
 * of the given width and height, and you want to display it
 * at the given display width and height.
 *
 * For example, if you have an image of 1000x1000 pixels, and
 * you want an image of 100x100 pixels, then there are 100x100
 * useful pixels on a cover crop, as you will take the center
 * 100x100 pixels of the image.
 *
 * If you have an image of 1000x1000 pixels, and you want an
 * image of 500x2000 pixels, there are 500x1000 useful pixels
 *
 * This is one part of the calculation of determining which
 * image to use.
 *
 * @param have The width and height of the image you are considering
 * @param want The width and height of the image you want to display
 */
const getUsefulArea = (
  have: { width: number; height: number },
  want: { width: number; height: number }
) => {
  const effectiveHave = {
    width: Math.min(have.width, want.width),
    height: Math.min(have.height, want.height),
  };

  return effectiveHave.width * effectiveHave.height;
};

/**
 * Gets how many useless pixels there are if you have an image
 * of the given width and height, and you want to display it
 * at the given display width and height.
 *
 * When thinking of this calculation, it's helpful to imagine
 * we are cropping to the the top-left rather than the center;
 * one can be easily convinced this doesn't effect the answer,
 * since we use the same area either way.
 *
 * For example, if you have an image of 1000x1000 pixels, and
 * you want an image of 100x100 pixels, then there are 3 rectangles
 * which are useless: 900x100 on the right, 900x900 square
 * bottom right, and 100x900 below. Thus the total useless area is
 * (900x100) + (900x900) + (100x900) = 990,000 pixels. This is the
 * same as subtracting the useful area: 1000x1000 - 100x100
 *
 * If you have an image of 200x200 and want 300x100, then the useless
 * area is below: 200x100 = 20,000 pixels. Alternatively, it's the
 * (200*200) total pixels - (200*100) useful pixels = 20,000 pixels.
 *
 * @param have The width and height of the image you are considering
 * @param want The width and height of the image you want to display
 */
const getUselessArea = (
  have: { width: number; height: number },
  want: { width: number; height: number }
) => {
  return have.width * have.height - getUsefulArea(have, want);
};

/**
 * Compares available images to determine which is the best when
 * you want to display an image of the given width and height.
 *
 * @param want The width and height of the image you want to display
 * @param a The first option to compare
 * @param b The second option to compare
 * @return negative if a is better, positive if b is better, 0 if they are equal
 */
const compareSizes = (
  want: { width: number; height: number },
  a: { width: number; height: number },
  b: { width: number; height: number }
): number => {
  // first by useful area (larger is better), then by
  // useless area (smaller is better)
  const usefulAreaA = getUsefulArea(a, want);
  const usefulAreaB = getUsefulArea(b, want);
  if (usefulAreaA !== usefulAreaB) {
    return usefulAreaB - usefulAreaA;
  }

  const uselessAreaA = getUselessArea(a, want);
  const uselessAreaB = getUselessArea(b, want);
  return uselessAreaA - uselessAreaB;
};

/**
 * Fetches the playlist information for a given private playlist. Returns
 * a rejected promise if there is a network error or the server returns
 * a non-200 status code.
 *
 * @param uid The uid of the playlist to fetch
 * @param jwt The JWT to use to authenticate the request
 * @returns The playlist information
 */
const fetchPrivatePlaylist = async (uid: string, jwt: string): Promise<Playlist> => {
  const response = await fetch(`${HTTP_API_URL}/api/1/image_files/playlist/${uid}`, {
    method: 'GET',
    headers: { authorization: `bearer ${jwt}` },
  });

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();
  return convertUsingKeymap(data, playlistKeymap);
};

/**
 * Fetches the playlist information for a given public playlist. Returns
 * a rejected promise if there is a network error or the server returns
 * a non-200 status code.
 *
 * Public playlists still require a jwt to access the individual exports,
 * but the response includes the jwt to use in the header. Thus, this
 * also returns the jwt to use for fetching the individual exports.
 *
 * @param uid The uid of the playlist to fetch
 * @returns The playlist information and the jwt to use to fetch the individual exports
 */
const fetchPublicPlaylist = async (uid: string): Promise<{ playlist: Playlist; jwt: string }> => {
  const response = await fetch(`${HTTP_API_URL}/api/1/image_files/playlist/${uid}?public=1`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw response;
  }

  const jwt = response.headers.get('x-image-file-jwt');
  if (jwt === null) {
    throw new Error('Public playlist response did not include JWT in x-image-file-jwt header');
  }

  const data = await response.json();
  const playlist = convertUsingKeymap(data, playlistKeymap);
  return { playlist, jwt };
};

/**
 * Selects the format available in the given playlist by preference
 * based on the actual width and height we want to display the final
 * exported image at.
 *
 * @param playlist The playlist to select from
 * @param usesWebp Whether the device supports webp
 * @param want The width and height of the image we want to display
 * @returns The format to use
 */
function selectFormat<T extends Playlist>(
  playlist: T,
  usesWebp: boolean,
  want: { width: number; height: number }
): string & keyof T['items'] {
  const area = want.width * want.height;

  if (usesWebp && playlist.items.webp) {
    return 'webp';
  }

  if (area <= 200 * 200 && playlist.items.png) {
    return 'png';
  }

  return 'jpeg';
}

/**
 * Selects the best item within the given list of options, given
 * that we want to render it at the given width and height.
 *
 * @param items The list of items to choose from, must be non-empty
 */
const selectBestItemFromItems = (
  items: PlaylistItem[],
  want: { width: number; height: number }
): PlaylistItem => {
  if (items.length === 0) {
    throw new Error('Cannot select best item from empty list');
  }

  let best = items[0];
  for (let i = 1; i < items.length; i++) {
    if (compareSizes(want, items[i], best) < 0) {
      best = items[i];
    }
  }
  return best;
};

/**
 * Selects the best item from the given playlist, given that we want
 * to render it at the given width and height and if the device supports
 * webp.
 *
 * @param playlist The playlist to select from
 * @param usesWebp Whether the device supports webp
 * @param want The width and height of the image we want to display
 * @returns The best item to use
 */
const selectBestItem = (
  playlist: Playlist,
  usesWebp: boolean,
  want: { width: number; height: number }
): PlaylistItem => {
  const format = selectFormat(playlist, usesWebp, want);
  return selectBestItemFromItems(playlist.items[format], want);
};

/**
 * Downloads the given playlist item. Returns a rejected promise if
 * there is a network error or the server returns a non-200 status code.
 *
 * @param item The item to download
 * @param jwt The JWT to use to authenticate the request
 * @returns The downloaded item
 */
const downloadItem = async (item: PlaylistItem, jwt: string): Promise<DownloadedItem> => {
  const response = await fetch(item.url, {
    headers: { Authorization: `bearer ${jwt}` },
  });
  if (!response.ok) {
    throw response;
  }

  const targetFolder = FileSystem.cacheDirectory + 'images/';
  const dirInfo = await FileSystem.getInfoAsync(targetFolder);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
  }

  const targetFile = targetFolder + item.url.split('/').pop();
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
    localUrl: targetFile,
  };
};

/**
 * A hook for loading an image from oseh. This hook will load the playlist
 * for the given uid, and then select the best image to display based on
 * the displayWidth and displayHeight props as well as device characteristics,
 * such as DPI. This will then download the image, but will not decode it,
 * before setting loading to false and setting the localUrl to the downloaded
 * image blob.
 *
 * @returns The state of the image which can be used by OsehImageFromState
 */
export const useOsehImageState = (props: OsehImageProps): OsehImageState => {
  const memodProps = useMemo(() => [props], [props]);
  return useOsehImageStates(memodProps)[0];
};

/**
 * A variant of useOsehImageState that can be used to load multiple images
 * in a single effect. This is useful when the number of images being loaded
 * may change, but the images still need to be reused. This will only reload
 * the images that actually change.
 *
 * Returns the image states in the order of the items array. Items with no
 * uid will be stuck loading.
 */
export const useOsehImageStates = (images: OsehImageProps[]): OsehImageState[] => {
  const [playlists, setPlaylists] = useState<Map<string, PlaylistWithJWT>>(new Map());
  const [bestItems, setBestItems] = useState<Map<string, PlaylistItemWithJWT>>(new Map());
  const [downloadedItems, setDownloadedItems] = useState<Map<string, DownloadedItem>>(new Map());
  const [errors, setErrors] = useState<Map<string, ReactElement>>(new Map());

  const uidsToImages = useMemo(() => {
    const map: Map<string, OsehImageProps> = new Map();
    for (const img of images) {
      if (img.uid !== null) {
        map.set(img.uid, img);
      }
    }
    return map;
  }, [images]);

  useEffect(() => {
    let active = true;
    fetchPlaylists();
    return () => {
      active = false;
    };

    async function fetchPlaylist(
      props: OsehImageProps,
      old: PlaylistWithJWT | null
    ): Promise<PlaylistWithJWT | null> {
      if (props.uid === null) {
        return null;
      }

      if (old !== null && old.playlist.uid === props.uid) {
        return old;
      }

      if (props.isPublic) {
        return await fetchPublicPlaylist(props.uid);
      }

      if (props.jwt === null) {
        throw new Error('Cannot fetch private playlist without JWT');
      }

      return { playlist: await fetchPrivatePlaylist(props.uid, props.jwt), jwt: props.jwt };
    }

    async function fetchPlaylists() {
      const newPlaylists = removeUnmatchedKeysFromMap(playlists, uidsToImages);
      let madeChanges = newPlaylists.size !== playlists.size;

      const newErrors = new Map<string, ReactElement>();

      const promises: Promise<void>[] = [];
      const uids: string[] = [];
      uidsToImages.forEach((props, uid) => {
        const old = newPlaylists.get(uid) ?? null;
        uids.push(uid);
        promises.push(
          fetchPlaylist(props, old)
            .then((playlist) => {
              if (!active) {
                return;
              }

              if (playlist === null || old === null) {
                madeChanges ||= playlist !== old;
              } else {
                madeChanges ||=
                  !playlistsEqual(playlist.playlist, old.playlist) || playlist.jwt !== old.jwt;
              }

              if (playlist === null) {
                newPlaylists.delete(uid);
              } else {
                newPlaylists.set(uid, playlist);
              }
            })
            .catch(async (e) => {
              throw await describeError(e);
            })
        );
      });

      const settled = await Promise.allSettled(promises);
      if (!active) {
        return;
      }

      settled.forEach((p, idx) => {
        if (p.status === 'rejected') {
          console.error('Failed to fetch playlist', uids[idx], p.reason);
          if (newPlaylists.has(uids[idx])) {
            newPlaylists.delete(uids[idx]);
            madeChanges = true;
          }
          newErrors.set(uids[idx], p.reason);
        }
      });

      if (madeChanges) {
        setPlaylists(newPlaylists);
      }

      setErrors(newErrors);
    }
  }, [uidsToImages, playlists]);

  useEffect(() => {
    let active = true;
    fetchBestItems();
    return () => {
      active = false;
    };

    async function fetchBestItems() {
      const usesWebp = await USES_WEBP;
      if (!active) {
        return;
      }

      const newBestItems = removeUnmatchedKeysFromMap(bestItems, playlists);
      let madeChanges = newBestItems.size !== bestItems.size;

      playlists.forEach((playlist, uid) => {
        const props = uidsToImages.get(uid) ?? null;
        if (props === null) {
          if (newBestItems.has(uid)) {
            newBestItems.delete(uid);
            madeChanges = true;
          }
          return;
        }

        const want = {
          width: PixelRatio.getPixelSizeForLayoutSize(props.displayWidth),
          height: PixelRatio.getPixelSizeForLayoutSize(props.displayHeight),
        };
        const old = newBestItems.get(uid) ?? null;
        const bestItem = selectBestItem(playlist.playlist, usesWebp, want);
        if (old === null || old.jwt !== playlist.jwt || !playlistItemsEqual(old.item, bestItem)) {
          newBestItems.set(uid, { item: bestItem, jwt: playlist.jwt });
          madeChanges = true;
        }
      });

      if (madeChanges) {
        setBestItems(newBestItems);
      }
    }
  }, [uidsToImages, playlists, bestItems]);

  useEffect(() => {
    let active = true;
    fetchDownloadedItems();
    return () => {
      active = false;
    };

    async function fetchDownloadedItem(
      item: PlaylistItemWithJWT,
      old: DownloadedItem | null
    ): Promise<DownloadedItem> {
      if (old !== null && old.remoteUrl === item.item.url) {
        return old;
      }

      return downloadItem(item.item, item.jwt);
    }

    async function fetchDownloadedItems() {
      const newDownloadedItems = removeUnmatchedKeysFromMap(downloadedItems, bestItems);
      let madeChanges = newDownloadedItems.size !== downloadedItems.size;

      const newErrors = new Map<string, ReactElement>();
      const changedDownloaded = new Set<string>();

      const promises: Promise<void>[] = [];
      const uids: string[] = [];
      bestItems.forEach((item, uid) => {
        const old = newDownloadedItems.get(uid) ?? null;
        uids.push(uid);
        promises.push(
          fetchDownloadedItem(item, old)
            .then((downloadedItem) => {
              if (!active) {
                return;
              }

              const changed = !downloadedItemsEqual(downloadedItem, old);
              if (changed) {
                changedDownloaded.add(uid);
              }
              madeChanges ||= changed;
              if (downloadedItem === null) {
                newDownloadedItems.delete(uid);
              } else {
                newDownloadedItems.set(uid, downloadedItem);
              }
            })
            .catch((e) => {
              throw describeError(e);
            })
        );
      });

      const settled = await Promise.allSettled(promises);
      if (!active) {
        return;
      }

      settled.forEach((p, idx) => {
        if (p.status === 'rejected') {
          console.error('Failed to download item', uids[idx], p.reason);
          if (newDownloadedItems.has(uids[idx])) {
            newDownloadedItems.delete(uids[idx]);
            madeChanges = true;
          }
          newErrors.set(uids[idx], p.reason);
        }
      });

      if (madeChanges) {
        setDownloadedItems(newDownloadedItems);
      }

      setErrors((old) => {
        const res = new Map<string, ReactElement>(old);
        for (const uid of changedDownloaded) {
          res.delete(uid);
        }
        for (const [uid, err] of newErrors) {
          res.set(uid, err);
        }
        return res;
      });
    }
  }, [bestItems, downloadedItems]);

  /**
   * Calls isLoading callback if set
   */
  useEffect(() => {
    images.forEach((img) => {
      if (img.setLoading === null || img.setLoading === undefined) {
        return;
      }

      if (img.uid === null) {
        img.setLoading(true, null);
        return;
      }

      const downloadedItem = downloadedItems.get(img.uid);
      if (
        downloadedItem === null ||
        downloadedItem === undefined ||
        downloadedItem.localUrl === null
      ) {
        img.setLoading(true, img.uid);
        return;
      }

      img.setLoading(false, img.uid);
    });
  }, [images, downloadedItems]);

  /**
   * Clear old errors
   */
  useEffect(() => {
    const newErrors = removeUnmatchedKeysFromMap(errors, uidsToImages);
    if (newErrors.size !== errors.size) {
      setErrors(newErrors);
    }
  }, [uidsToImages, errors]);

  return useMemo<OsehImageState[]>(() => {
    return images.map((img) => {
      if (img.uid === null) {
        return {
          localUrl: null,
          alt: img.alt,
          displayWidth: img.displayWidth,
          displayHeight: img.displayHeight,
          loading: true,
          error: null,
        };
      }

      const downloadedItem = downloadedItems.get(img.uid);
      const error = errors.get(img.uid) ?? null;
      if (downloadedItem === null || downloadedItem === undefined) {
        return {
          localUrl: null,
          alt: img.alt,
          displayWidth: img.displayWidth,
          displayHeight: img.displayHeight,
          loading: true,
          error,
        };
      }

      const localUrl = downloadedItem.localUrl ?? null;

      return {
        localUrl: localUrl,
        alt: img.alt,
        displayWidth: img.displayWidth,
        displayHeight: img.displayHeight,
        loading: localUrl === null,
        error,
      };
    });
  }, [images, downloadedItems, errors]);
};
