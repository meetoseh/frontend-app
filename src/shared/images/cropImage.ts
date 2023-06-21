import * as FileSystem from 'expo-file-system';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

const cropImageUnsafe = async (
  src: string,
  cropTo: { width: number; height: number },
  cacheableIdentifier: string
): Promise<string> => {
  const targetFolder = FileSystem.cacheDirectory + 'cropped-images/';
  const dirInfo = await FileSystem.getInfoAsync(targetFolder);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
  }

  const format = cropTo.width * cropTo.height < 600 * 600 ? SaveFormat.PNG : SaveFormat.JPEG;
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
    console.error(`Failed to delete useless artifact file at ${unmodified.uri}: ${e}`);
  }
  if (unmodified.width === cropTo.width && unmodified.height === cropTo.height) {
    return src;
  }

  const imgWidth = unmodified.width;
  const imgHeight = unmodified.height;
  const leftCrop = Math.floor((imgWidth - cropTo.width) / 2);
  const topCrop = Math.floor((imgHeight - cropTo.height) / 2);

  const result = await manipulateAsync(
    src,
    [{ crop: { originX: leftCrop, originY: topCrop, ...cropTo } }],
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
 * @param cropTo The size to crop the image to
 * @param cacheableIdentifier A unique string which identifies the source
 *   image and the crop settings. For the web this is unused, but for
 *   the apps it's used as a filename.
 */
export const cropImage = async (
  src: string,
  cropTo: { width: number; height: number },
  cacheableIdentifier: string
): Promise<string> => {
  try {
    return await cropImageUnsafe(src, cropTo, cacheableIdentifier);
  } catch (e) {
    console.error('Error cropping image', e);
    return src;
  }
};
