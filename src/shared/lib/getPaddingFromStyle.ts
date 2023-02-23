type Paddable = {
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
};

type Padding = [number, number, number, number];

/**
 * Gets the padding from a style object, using 0 as the default value
 * and preferring more specific padding values over the generic one.
 *
 * @param style The style object to get the padding from
 * @returns The padding as an array of [top, right, bottom, left]
 */
export const getPaddingFromStyle = (style: Paddable): Padding => {
  const padding = style.padding ?? 0;
  const paddingTop = style.paddingTop ?? padding;
  const paddingRight = style.paddingRight ?? padding;
  const paddingBottom = style.paddingBottom ?? padding;
  const paddingLeft = style.paddingLeft ?? padding;

  return [paddingTop, paddingRight, paddingBottom, paddingLeft];
};
