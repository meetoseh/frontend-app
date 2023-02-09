import { useEffect, useMemo, useState } from 'react';
import { PixelRatio } from 'react-native';
import { HTTP_API_URL } from '../lib/apiFetch';
import * as FileSystem from 'expo-file-system';

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

/**
 * The required state information to display an oseh image. Useful when you want
 * to use a single image in multiple places, as the standard OsehImage component
 * will refetch the image state every time
 */
export type OsehImageState = {
  /**
   * The local url where the image can be accessed. This will be a file:// URI
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
 * A hook for loading an image from oseh. This hook will load the playlist
 * for the given uid, and then select the best image to display based on
 * the displayWidth and displayHeight props as well as device characteristics,
 * such as DPI. This will then download the image, but will not decode it,
 * before setting loading to false and setting the localUrl to the path to
 * the downloaded image.
 *
 * This does not redownload images that are still in the cache directory, which
 * is typically good enough for most use cases.
 *
 * @returns The state of the image which can be used by OsehImageFromState
 */
export const useOsehImageState = ({
  uid,
  jwt,
  displayWidth,
  displayHeight,
  alt,
  isPublic = false,
  setLoading = null,
}: OsehImageProps): OsehImageState => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [publicJwt, setPublicJwt] = useState<string | null>(null);
  const [item, setItem] = useState<PlaylistItem | null>(null);
  const [downloadedItem, setDownloadedItem] = useState<{
    localUrl: string;
    remoteUrl: string;
  } | null>(null);

  useEffect(() => {
    if (uid === null) {
      setPlaylist(null);
      return;
    }

    let alive = true;
    safeFetchPlaylist();
    return () => {
      alive = false;
    };

    async function safeFetchPlaylist() {
      try {
        await fetchPlaylist();
      } catch (e) {
        console.log('error fetching playlist', e);
      }
    }

    async function fetchPlaylist() {
      if (playlist?.uid === uid) {
        return;
      }

      const response = isPublic
        ? await fetch(`${HTTP_API_URL}/api/1/image_files/playlist/${uid}?public=1`, {
            method: 'GET',
          })
        : await fetch(`${HTTP_API_URL}/api/1/image_files/playlist/${uid}`, {
            method: 'GET',
            headers: { authorization: `bearer ${jwt}` },
          });
      if (!alive) {
        return;
      }
      if (!response.ok) {
        const text = await response.text();
        if (!alive) {
          return;
        }
        console.error("Couldn't fetch playlist", response, text);
        return;
      }

      const data = await response.json();
      if (!alive) {
        return;
      }

      if (response.headers.has('x-image-file-jwt')) {
        setPublicJwt(response.headers.get('x-image-file-jwt'));
      } else {
        setPublicJwt(null);
      }
      setPlaylist(data);
    }
  }, [uid, jwt, playlist?.uid, isPublic]);

  useEffect(() => {
    if (playlist === null) {
      setItem(null);
      return;
    }

    let alive = true;
    selectItem();
    return () => {
      alive = false;
    };

    async function selectItem() {
      if (!alive) {
        return;
      }
      if (playlist === null) {
        return;
      }

      const desiredImageSize = {
        width: PixelRatio.getPixelSizeForLayoutSize(displayWidth),
        height: PixelRatio.getPixelSizeForLayoutSize(displayHeight),
      };
      const desiredArea = desiredImageSize.width * desiredImageSize.height;

      const format = playlist.items.webp
        ? 'webp'
        : desiredArea <= 200 * 200 && playlist.items.png
        ? 'png'
        : 'jpeg';

      // items is already sorted by size, ascending
      let items = playlist.items[format];

      const itemByResolution: { [resolution: string]: PlaylistItem } = {};
      for (const item of items) {
        itemByResolution[`${item.width}x${item.height}`] = item;
      }
      items = Object.values(itemByResolution);

      const bestItem = items.reduce((best, item) => {
        if (best === null) {
          return item;
        }
        if (compareSizes(desiredImageSize, item, best) < 0) {
          return item;
        }
        return best;
      });

      if (
        bestItem.width !== desiredImageSize.width ||
        bestItem.height !== desiredImageSize.height
      ) {
        console.log(
          `image size mismatch for ${playlist.uid}; wanted ${desiredImageSize.width}x${desiredImageSize.height} but got ${bestItem.width}x${bestItem.height}`
        );
      }
      setItem(bestItem);
    }
  }, [playlist, displayWidth, displayHeight]);

  useEffect(() => {
    let active = true;
    fetchItemUrl();
    return () => {
      active = false;
    };

    async function fetchItemUrl() {
      if (item === null) {
        setDownloadedItem(null);
        return;
      }

      if (downloadedItem?.remoteUrl === item.url) {
        return;
      }

      const targetFolder = FileSystem.cacheDirectory + 'images/';
      const dirInfo = await FileSystem.getInfoAsync(targetFolder);
      if (!active) {
        return;
      }
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
        if (!active) {
          return;
        }
      }

      const targetFile = targetFolder + item.url.split('/').pop();
      const fileInfo = await FileSystem.getInfoAsync(targetFile);
      if (!active) {
        return;
      }
      if (!fileInfo.exists) {
        try {
          await FileSystem.downloadAsync(item.url, targetFile, {
            headers: { Authorization: `bearer ${publicJwt ?? jwt}` },
          });
        } catch (e) {
          console.error('Failed to download image', e);

          await FileSystem.deleteAsync(targetFile, { idempotent: true });
          return;
        }
      }

      setDownloadedItem({ localUrl: targetFile, remoteUrl: item.url });
    }
  }, [item, jwt, downloadedItem?.remoteUrl, publicJwt]);

  useEffect(() => {
    if (setLoading !== null) {
      setLoading(uid === null || downloadedItem === null, uid);
    }
  }, [downloadedItem, setLoading, uid]);

  return useMemo(() => {
    return {
      localUrl: downloadedItem?.localUrl ?? null,
      alt,
      displayWidth,
      displayHeight,
    };
  }, [downloadedItem?.localUrl, alt, displayWidth, displayHeight]);
};
