import {
  CrudFetcherMapper,
  convertUsingMapper,
} from '../../../shared/lib/CrudFetcher';

/** Whats received from a `{"type": "string", "format": "image_uid"}` */
export type ScreenImageAPI = {
  /** Primary stable identifier for the image */
  uid: string;
  /** JWT for downloading the image playlist and images */
  jwt: string;
  /**
   * Thumbhash for the image at a standard size, which can be shown before
   * the playlist is downloaded
   */
  thumbhash: string;
};

export type ScreenImageParsed = ScreenImageAPI;

export const screenImageKeyMap: CrudFetcherMapper<ScreenImageParsed> = {};

/**
 * The standard representation of an image with a configurable size
 */
export type ScreenImageWithConfigurableSizeAPI = {
  /** The underlying image */
  image: ScreenImageAPI;

  /** The logical width in pixels */
  width: number;

  /** The logical height in pixels */
  height: number;
};

export type ScreenImageWithConfigurableSizeParsed =
  ScreenImageWithConfigurableSizeAPI;

export const screenImageWithConfigurableSizeKeyMap: CrudFetcherMapper<ScreenImageWithConfigurableSizeParsed> =
  {
    image: (_, value) => ({
      key: 'image',
      value: convertUsingMapper(value, screenImageKeyMap),
    }),
  };
