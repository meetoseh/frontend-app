/**
 * Given that we want to display a video at a given logical width and height,
 * and we have a video export at a given real width and height, this determines
 * the largest exact pixelPhysicalSize that is smaller or equal to what we have,
 * and then returns the amount of wasted space for what we have compare to one
 * which exactly maps to that pixelPhysicalSize.
 */
export const getEffectiveVideoTarget = (
  want: { width: number; height: number },
  have: { width: number; height: number }
): {
  pixelPhysicalSize: number;
  uselessArea: number;
  usefulArea: number;
} => {
  let pixelPhysicalSize = 1;
  let pixelsPerLogicalPixel = devicePixelRatio;
  while (true) {
    const wantWidth = Math.ceil(want.width * pixelsPerLogicalPixel);
    const wantHeight = Math.ceil(want.height * pixelsPerLogicalPixel);

    if (wantWidth <= have.width && wantHeight <= have.height) {
      const usefulArea = wantWidth * wantHeight;
      return {
        pixelPhysicalSize,
        usefulArea,
        uselessArea: have.width * have.height - usefulArea,
      };
    }

    pixelPhysicalSize++;
    pixelsPerLogicalPixel = devicePixelRatio / pixelPhysicalSize;
  }
};
