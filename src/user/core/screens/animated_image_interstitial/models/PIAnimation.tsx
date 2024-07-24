export type PIAnimationKeyPoint = {
  /**
   * Where the center of the image should be at this key point, relative
   * to the top left corner of the animation bounding box. The animation bounding
   * box is full width by the indicated reserved height in pixels.
   *
   * Thus, a value of 0 means to cut-off the left half of the image, 0.5 means
   * to center the image horizontally, and 1 means to cut-off the right half of the image.
   */
  x: number;
  /**
   * Where the center of the image should be at this key point, relative
   * to the top left corner of the animation bounding box. The animation bounding
   * box is full width by the indicated reserved height in pixels.
   *
   * Overflow is hidden, meaning a value of 0 cuts off the top half of the image,
   * 0.5 centers the image vertically within the animation box, and 1 cuts off the
   * bottom half of the image.
   */
  y: number;
  /**
   * The rotation in radians. The image is rotated around its center.
   */
  rotation: number;
  /**
   * The scale factor. 1 means no scaling, 2 means double the size, 0.5 means half the size.
   */
  scale: number;
  /**
   * The opacity of the image. 1 means fully opaque, 0 means fully transparent.
   */
  opacity: number;
};

export type PIEaseStandard = {
  /**
   * - `standard`: one of the preset eases. this should be preferred as they will generally
   *   be better optimized
   */
  type: 'standard';
  id:
    | 'ease'
    | 'ease-in'
    | 'ease-in-out'
    | 'ease-in-back'
    | 'ease-out-back'
    | 'ease-in-out-back'
    | 'ease-out'
    | 'linear';
};

export type PIEaseCustomCubicBezier = {
  /**
   * - `custom-cubic-bezier`: a custom bezier curve. this is generally slower than the standard
   *   eases and may be unstable for some parameter values.
   */
  type: 'custom-cubic-bezier';
  /**
   * True if this curve must be precomputed prior to playing the animation to avoid stuttering;
   * adds a significant delay to the animation start and a significant memory overhead.
   */
  precompute: boolean;
  /** first dimension of the second point (the first point is [0, 0]) */
  x1: number;
  /** second dimension of the second point */
  x2: number;
  /** first dimension of the third point */
  x3: number;
  /** second dimension of the third point */
  x4: number;
};

export type PIEase = PIEaseStandard | PIEaseCustomCubicBezier;

export type PIAnimationPart = {
  /**
   * The parameter being animated. If at a given time two animation parts are
   * animating the same parameter, the last one to start wins, with ties broken
   * by index
   */
  param: keyof PIAnimationKeyPoint;
  /** the value of the param when this animation part starts */
  initial: number;
  /** the value of the param when this animation part ends */
  final: number;
  /** the easing function to use for this animation part */
  ease: PIEase;
  /** the number of seconds from the start of the animation loop before this animation starts */
  delay: number;
  /** the duration this animation part plays in seconds */
  duration: number;
};

/**
 * Parameter independent animation; chosen to be somewhat short and
 * avoid name resolution conflicts
 */
export type PIAnimation = {
  /** The animation state at the start of the loop */
  start: PIAnimationKeyPoint;
  /** the parts to play. the animation repeats when all animation parts have finished */
  parts: PIAnimationPart[];
};
