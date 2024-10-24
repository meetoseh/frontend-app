import { Bezier } from '../../../../shared/lib/Bezier';
import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';
import { setVWC } from '../../../../shared/lib/setVWC';
import { initImage } from '../../lib/initImage';
import { OsehScreen } from '../../models/Screen';
import { screenImageWithConfigurableSizeKeyMap } from '../../models/ScreenImage';
import { screenTextContentMapper } from '../../models/ScreenTextContentMapped';
import { AnimatedImageInterstitial } from './AnimatedImageInterstitial';
import {
  AnimatedImageInterstitialAPIParams,
  AnimatedImageInterstitialMappedParams,
} from './AnimatedImageInterstitialParams';
import { AnimatedImageInterstitialResources } from './AnimatedImageInterstitialResources';
import { convertScreenConfigurableTriggerWithOldVersion } from '../../models/ScreenConfigurableTrigger';

/**
 * An animated screen consisting of two images being moved, rotated, scaled, and faded.
 * This allows for a relatively large amount of variety given the simplicity
 */
export const AnimatedImageInterstitialScreen: OsehScreen<
  'animated_image_interstitial',
  AnimatedImageInterstitialResources,
  AnimatedImageInterstitialAPIParams,
  AnimatedImageInterstitialMappedParams
> = {
  slug: 'animated_image_interstitial',
  paramMapper: (params) => ({
    ...params,
    image1: convertUsingMapper(
      params.image1,
      screenImageWithConfigurableSizeKeyMap
    ),
    image2: convertUsingMapper(
      params.image2,
      screenImageWithConfigurableSizeKeyMap
    ),
    assumedContentHeight: params.assumed_content_height,
    content: convertUsingMapper(params.content, screenTextContentMapper),
    trigger: convertScreenConfigurableTriggerWithOldVersion(
      params.trigger,
      params.triggerv75
    ),
    __mapped: true,
  }),
  initInstanceResources: (ctx, screen, refreshScreen) => {
    const activeVWC = createWritableValueWithCallbacks(true);

    const image1 = initImage({
      ctx,
      screen,
      refreshScreen,
      paramMapper: (params) => params.image1.image,
      sizeMapper: () => ({
        width: screen.parameters.image1.width,
        height: screen.parameters.image1.height,
      }),
    });

    const image2 = initImage({
      ctx,
      screen,
      refreshScreen,
      paramMapper: (params) => params.image2.image,
      sizeMapper: () => ({
        width: screen.parameters.image2.width,
        height: screen.parameters.image2.height,
      }),
    });

    const precomputedBeziers = createWritableValueWithCallbacks(new Map());

    const cleanupBezierComputer = (() => {
      const active = createWritableValueWithCallbacks(true);
      findAndComputeAcrossFrames();
      return () => {
        setVWC(active, false);
      };

      async function findAndComputeAcrossFrames() {
        if (!active.get()) {
          return;
        }

        const seen = new Set<string>();
        const remaining: [string, Bezier][] = [];
        for (const part of screen.parameters.animation1.parts) {
          if (
            part.ease.type === 'custom-cubic-bezier' &&
            part.ease.precompute
          ) {
            const key = [part.ease.x1, part.ease.x2, part.ease.x3, part.ease.x4]
              .map((v) => v.toFixed(3))
              .join(',');
            if (!seen.has(key)) {
              seen.add(key);
              remaining.push([
                key,
                new Bezier([
                  [0, 0],
                  [part.ease.x1, part.ease.x2],
                  [part.ease.x3, part.ease.x4],
                  [1, 1],
                ]),
              ]);
            }
          }
        }

        const maxWorkBeforeBreakMS = 4;
        let lastBreakAt = performance.now();
        function delayer(): undefined | Promise<void> {
          if (!active.get()) {
            throw new Error('cancelled');
          }

          const now = performance.now();
          if (now - lastBreakAt > maxWorkBeforeBreakMS) {
            return waitUntilNextFrame().then(() => {
              lastBreakAt = performance.now();
            });
          }
          return undefined;
        }

        const finished = precomputedBeziers.get();
        while (true) {
          if (!active.get()) {
            return;
          }

          const popped = remaining.pop();
          if (popped === undefined) {
            break;
          }
          const [key, bezier] = popped;
          if (finished.has(key)) {
            continue;
          }

          let precomputed: number[];
          try {
            precomputed = await bezier.precomputeWithDelay(1e-5, delayer);
          } catch (e) {
            if (e instanceof Error && e.message === 'cancelled') {
              return;
            }

            throw e;
          }

          if (!active.get()) {
            return;
          }

          bezier.precomputed = precomputed;
          finished.set(key, bezier);
          precomputedBeziers.callbacks.call(undefined);
        }
      }

      async function waitUntilNextFrame() {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    })();

    return {
      ready: createWritableValueWithCallbacks(true),
      imageSizeImmediate1: image1.sizeImmediate,
      image1: image1.image,
      imageSizeImmediate2: image2.sizeImmediate,
      image2: image2.image,
      precomputedBeziers,
      dispose: () => {
        setVWC(activeVWC, false);
        image1.dispose();
        image2.dispose();
        cleanupBezierComputer();
      },
    };
  },
  component: (props) => <AnimatedImageInterstitial {...props} />,
};
