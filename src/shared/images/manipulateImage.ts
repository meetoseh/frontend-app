import * as FileSystem from 'expo-file-system';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const manipulateImageUnsafe = async (
  src: string,
  srcSize: { width: number; height: number },
  crop:
    | { left: number; top: number; width: number; height: number }
    | undefined,
  rescale: { width: number; height: number } | undefined,
  cacheableIdentifier: string
): Promise<string> => {
  if (
    !Number.isSafeInteger(srcSize.width) ||
    !Number.isSafeInteger(srcSize.height)
  ) {
    throw new Error('unsafe source size (only integers are allowed)');
  }
  if (crop !== undefined) {
    if (
      !Number.isSafeInteger(crop.left) ||
      !Number.isSafeInteger(crop.top) ||
      !Number.isSafeInteger(crop.width) ||
      !Number.isSafeInteger(crop.height)
    ) {
      throw new Error('unsafe crop (only integers are allowed)');
    }
  }
  if (rescale !== undefined) {
    if (
      !Number.isSafeInteger(rescale.width) ||
      !Number.isSafeInteger(rescale.height)
    ) {
      throw new Error('unsafe rescale (only integers are allowed)');
    }
  }

  {
    let size = { width: srcSize.width, height: srcSize.height };
    if (crop !== undefined) {
      if (crop.width === size.width && crop.height === size.height) {
        crop = undefined;
      } else {
        size = { width: crop.width, height: crop.height };
      }
    }

    if (rescale !== undefined) {
      if (rescale.width === size.width && rescale.height === size.height) {
        rescale = undefined;
      } else {
        size = { width: rescale.width, height: rescale.height };
      }
    }
  }

  const finalWidthRaw = rescale?.width ?? crop?.width;
  const finalHeightRaw = rescale?.height ?? crop?.height;
  if (finalWidthRaw === undefined || finalHeightRaw === undefined) {
    return src;
  }
  const targetFolder = FileSystem.cacheDirectory + 'cropped-images/';
  const dirInfo = await FileSystem.getInfoAsync(targetFolder);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
  }

  const format =
    finalWidthRaw * finalHeightRaw < 600 * 600
      ? SaveFormat.PNG
      : SaveFormat.JPEG;
  const ext = format === SaveFormat.PNG ? 'png' : 'jpeg';

  const targetFile = targetFolder + cacheableIdentifier + '.' + ext;
  const fileInfo = await FileSystem.getInfoAsync(targetFile);
  if (fileInfo.exists) {
    return targetFile;
  }

  const result = await manipulateAsync(
    src,
    [
      ...(crop
        ? [
            {
              crop: {
                originX: crop.left,
                originY: crop.top,
                width: crop.width,
                height: crop.height,
              },
            },
          ]
        : []),
      ...(rescale
        ? [
            {
              resize: {
                width: rescale.width,
                height: rescale.height,
              },
            },
          ]
        : []),
    ],
    { compress: 1, format }
  );
  await FileSystem.moveAsync({ from: result.uri, to: targetFile });
  return targetFile;
};

/**
 * Renders the image at `srcSize` (which should be the natural size of the image;
 * for vector images, this is the size of the container to render the vector image
 * for rasterization). Then crops according to `crop`, and finally rescales according
 * to `rescale`.
 *
 * If neither `crop` nor `rescale` are provided, just returns the original url.
 *
 * If an error occurs, logs it and returns the original url.
 *
 * Note that all sizes are in _physical_ pixels (not logical pixels, i.e., CSS pixels).
 *
 * @param src The URL of the image to crop and rescale.
 * @param srcSize The size of the image at `src` in physical pixels. Note that if
 *   the image is vector-based, this acts as the size of the container to render the
 *   vector image in. Otherwise, should be the images natural size.
 * @param crop The crop to apply to the image, or undefined if no crop is needed.
 * @param rescale The size to rescale the image to, or undefined if no rescale is needed.
 * @param cacheableIdentifier Unused on web; for native, used in the name of the file to
 *   save on disk.
 */
export const manipulateImage = async (
  src: string,
  srcSize: { width: number; height: number },
  crop:
    | { left: number; top: number; width: number; height: number }
    | undefined,
  rescale: { width: number; height: number } | undefined,
  cacheableIdentifier: string
): Promise<string> => {
  try {
    return await manipulateImageUnsafe(
      src,
      srcSize,
      crop,
      rescale,
      cacheableIdentifier
    );
  } catch (e) {
    console.error('Error cropping image', e);
    return src;
  }
};
