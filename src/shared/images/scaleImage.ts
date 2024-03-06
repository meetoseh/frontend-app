import * as FileSystem from 'expo-file-system';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const scaleImageUnsafe = async (
  src: string,
  srcSize: { width: number; height: number },
  scaleTo: { width: number; height: number },
  cacheableIdentifier: string,
  isVector: boolean
): Promise<string> => {
  const targetFolder = FileSystem.cacheDirectory + 'scaled-images/';
  const dirInfo = await FileSystem.getInfoAsync(targetFolder);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
  }

  const format =
    scaleTo.width * scaleTo.height < 600 * 600
      ? SaveFormat.PNG
      : SaveFormat.JPEG;
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
    unmodified.width === scaleTo.width &&
    unmodified.height === scaleTo.height
  ) {
    return src;
  }

  const imgWidth = unmodified.width;
  const imgHeight = unmodified.height;

  let manipulation: {
    rescale?: { width: number; height: number };
    resultSize: { width: number; height: number };
  } = { resultSize: { width: imgWidth, height: imgHeight } };

  if (
    manipulation.resultSize.width !== scaleTo.width ||
    manipulation.resultSize.height !== scaleTo.height
  ) {
    manipulation.rescale = { width: scaleTo.width, height: scaleTo.height };
    manipulation.resultSize = { width: scaleTo.width, height: scaleTo.height };
  }

  const result = await manipulateAsync(
    src,
    [
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
 * Scales the image at the given url to the given size, returning
 * a promise which resolves to a url where the scaled image can
 * be downloaded.
 *
 * Unlike scaleImageUnsafe, which shouldn't be used directly, if
 * something goes wrong this returns the original image url.
 *
 * @param src The url of the image to scale
 * @param srcSize The expected natural size of the image, primarily for vector
 *   images
 * @param scaleTo The size to scale the image to
 * @param cacheableIdentifier A unique string which identifies the source
 *   image and the scale settings. For the web this is unused, but for
 *   the apps it's used as a filename.
 * @param isVector true if the src points to a vector image, i.e., we can
 *   scale it arbitrarily without loss of quality. false if the src points
 *   to a raster image, i.e., we can't scale it arbitrarily without loss
 *   of quality.
 */
export const scaleImage = async (
  src: string,
  srcSize: { width: number; height: number },
  scaleTo: { width: number; height: number },
  cacheableIdentifier: string,
  isVector: boolean
): Promise<string> => {
  try {
    return await scaleImageUnsafe(
      src,
      srcSize,
      scaleTo,
      cacheableIdentifier,
      isVector
    );
  } catch (e) {
    console.error('Error scaling image', e);
    return src;
  }
};
