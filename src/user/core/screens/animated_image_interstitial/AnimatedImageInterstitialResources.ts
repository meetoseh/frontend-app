import { OsehImageExportCropped } from '../../../../shared/images/OsehImageExportCropped';
import { Bezier } from '../../../../shared/lib/Bezier';
import { ValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { ScreenResources } from '../../models/Screen';

export type AnimatedImageInterstitialResources = ScreenResources & {
  /**
   * The display size the first image is targeting, updated without a debounce
   * delay. The actual image content may not match this size until a debounce
   * period or longer.
   */
  imageSizeImmediate1: ValueWithCallbacks<{ width: number; height: number }>;

  /**
   * The first image to use
   */
  image1: ValueWithCallbacks<OsehImageExportCropped | null>;

  /**
   * The display size the second image is targeting, updated without a debounce
   * delay. The actual image content may not match this size until a debounce
   * period or longer.
   */
  imageSizeImmediate2: ValueWithCallbacks<{ width: number; height: number }>;

  /**
   * The second image to use
   */
  image2: ValueWithCallbacks<OsehImageExportCropped | null>;

  /**
   * The precomputed beziers, where the key is formed by the stringified middle
   * 2 controls points, separated with commas, and the value is the precomputed
   * bezier. When animating, any custom beziers that require precomputation but
   * aren't in this list should be replaced with a linear interpolation.
   *
   * example key: 0.38,0,0.72,1.1
   */
  precomputedBeziers: ValueWithCallbacks<Map<string, Bezier>>;
};
