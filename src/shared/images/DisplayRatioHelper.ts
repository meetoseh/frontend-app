/*
 * This helper is intended to adapt devicePixelRatio (web) and the PixelRatio module (react-native)
 * to a single interface, such that it's easy to verify a module is definitely not using
 * web-specific or native-specific pixel ratio logic via ctrl+f
 */

import { PixelRatio } from 'react-native';

/**
 * Converts the specific given number of logical x-axis pixels to the
 * corresponding number of x-axis device pixels
 */
export const convertLogicalWidthToPhysicalWidth = (width: number) =>
  PixelRatio.getPixelSizeForLayoutSize(width);

/**
 * Converts the specific given number of logical y-axis pixels to the
 * corresponding number of y-axis device pixels
 */
export const convertLogicalHeightToPhysicalHeight = (height: number) =>
  PixelRatio.getPixelSizeForLayoutSize(height);

/**
 * The pixel ratio for the x-axis, named to avoid "devicePixelRatio"
 * for ctrl+f purposes
 */
export const xAxisPhysicalPerLogical = PixelRatio.get();

/**
 * The pixel ratio for the y-axis, named to avoid "devicePixelRatio"
 * for ctrl+f purposes
 */
export const yAxisPhysicalPerLogical = PixelRatio.get();

/**
 * Converts a specific width and height from logical pixels to physical pixels.
 */
export const convertLogicalSizeToPhysicalSize = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): { width: number; height: number } => ({
  width: convertLogicalWidthToPhysicalWidth(width),
  height: convertLogicalHeightToPhysicalHeight(height),
});

/**
 * The greater of the two pixel ratios; the appropriate substitute
 * for "devicePixelRatio" if no additional information is available
 */
export const largestPhysicalPerLogical = Math.max(
  xAxisPhysicalPerLogical,
  yAxisPhysicalPerLogical
);
