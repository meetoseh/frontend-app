import * as FileSystem from 'expo-file-system';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const cropImageUnsafe = async (
  src: string,
  srcSize: { width: number; height: number },
  cropTo: { width: number; height: number },
  cacheableIdentifier: string,
  isVector: boolean
): Promise<string> => {
  const targetFolder = FileSystem.cacheDirectory + 'cropped-images/';
  const dirInfo = await FileSystem.getInfoAsync(targetFolder);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
  }

  const format =
    cropTo.width * cropTo.height < 600 * 600 ? SaveFormat.PNG : SaveFormat.JPEG;
  const ext = format === SaveFormat.PNG ? 'png' : 'jpeg';

  const targetFile = targetFolder + cacheableIdentifier + '.' + ext;
  const fileInfo = await FileSystem.getInfoAsync(targetFile);
  if (fileInfo.exists) {
    return targetFile;
  }

  const unmodified = await manipulateAsync(src);
  try {
    if (unmodified.uri !== src) {
      await FileSystem.deleteAsync(unmodified.uri);
    }
  } catch (e) {
    console.error(
      `Failed to delete useless artifact file at ${unmodified.uri}: ${e}`
    );
  }
  if (
    unmodified.width === cropTo.width &&
    unmodified.height === cropTo.height
  ) {
    return src;
  }

  const imgWidth = unmodified.width;
  const imgHeight = unmodified.height;

  // we will center-crop to the correct aspect ratio,
  // then scale down to the correct size

  const imgAspectRatio = imgWidth / imgHeight;
  const expectedAspectRatio = cropTo.width / cropTo.height;

  let manipulation: {
    crop?: { left: number; top: number; width: number; height: number };
    rescale?: { width: number; height: number };
    resultSize: { width: number; height: number };
  } = { resultSize: { width: imgWidth, height: imgHeight } };

  if (expectedAspectRatio > imgAspectRatio) {
    // we want it to be wider, so we crop the top and bottom
    const expectedHeight = Math.min(
      imgHeight,
      Math.round(imgWidth / expectedAspectRatio)
    );

    if (expectedHeight < imgHeight) {
      const amtToCrop = imgHeight - expectedHeight;
      const cropFromTop = Math.floor(amtToCrop / 2);
      manipulation.crop = {
        left: 0,
        top: cropFromTop,
        width: imgWidth,
        height: expectedHeight,
      };
      manipulation.resultSize.height = expectedHeight;
    }
  } else if (expectedAspectRatio < imgAspectRatio) {
    // we want it to be taller, so we crop the left and right
    const expectedWidth = Math.min(
      imgWidth,
      Math.round(imgHeight * expectedAspectRatio)
    );

    if (expectedWidth < imgWidth) {
      const amtToCrop = imgWidth - expectedWidth;
      const cropFromLeft = Math.floor(amtToCrop / 2);
      manipulation.crop = {
        left: cropFromLeft,
        top: 0,
        width: expectedWidth,
        height: imgHeight,
      };
      manipulation.resultSize.width = expectedWidth;
    }
  }

  if (
    manipulation.resultSize.width !== cropTo.width ||
    manipulation.resultSize.height !== cropTo.height
  ) {
    manipulation.rescale = { width: cropTo.width, height: cropTo.height };
    manipulation.resultSize = { width: cropTo.width, height: cropTo.height };
  }

  const result = await manipulateAsync(
    src,
    [
      ...(manipulation.crop
        ? [
            {
              crop: {
                originX: manipulation.crop.left,
                originY: manipulation.crop.top,
                width: manipulation.crop.width,
                height: manipulation.crop.height,
              },
            },
          ]
        : []),
      ...(manipulation.rescale
        ? [
            {
              resize: {
                width: manipulation.rescale.width,
                height: manipulation.rescale.height,
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
 * Crops the image at the given url to the given size, returning
 * a promise which resolves to a url where the cropped image can
 * be downloaded.
 *
 * Unlike cropImageUnsafe, which shouldn't be used directly, if
 * something goes wrong this returns the original image url.
 *
 * @param src The url of the image to crop
 * @param srcSize The expected natural size of the image, primarily for vector
 *   images
 * @param cropTo The size to crop the image to
 * @param cacheableIdentifier A unique string which identifies the source
 *   image and the crop settings. For the web this is unused, but for
 *   the apps it's used as a filename.
 * @param isVector true if the src points to a vector image, i.e., we can
 *   scale it arbitrarily without loss of quality. false if the src points
 *   to a raster image, i.e., we can't scale it arbitrarily without loss
 *   of quality.
 */
export const cropImage = async (
  src: string,
  srcSize: { width: number; height: number },
  cropTo: { width: number; height: number },
  cacheableIdentifier: string,
  isVector: boolean
): Promise<string> => {
  try {
    return await cropImageUnsafe(
      src,
      srcSize,
      cropTo,
      cacheableIdentifier,
      isVector
    );
  } catch (e) {
    console.error('Error cropping image', e);
    return src;
  }
};
