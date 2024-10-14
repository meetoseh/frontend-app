import { ReactElement, useEffect } from 'react';
import { OsehImageExportCropped } from '../../../../../shared/images/OsehImageExportCropped';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { ScreenContext } from '../../../hooks/useScreenContext';
import { createChainedImageFromRef } from '../../../lib/createChainedImageFromRef';
import { createValueWithCallbacksEffect } from '../../../../../shared/hooks/createValueWithCallbacksEffect';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { GridImageBackground } from '../../../../../shared/components/GridImageBackground';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';

/**
 * Shows a content width x 120px image
 */
export const JournalCardTopBackgroundImage = ({
  uid,
  jwt,
  ctx,
}: {
  uid: string;
  jwt: string;
  ctx: ScreenContext;
}): ReactElement => {
  const thumbhashVWC = useWritableValueWithCallbacks<string | null>(() => null);
  const imageVWC = useWritableValueWithCallbacks<OsehImageExportCropped | null>(
    () => null
  );

  useEffect(() => {
    const inner = createChainedImageFromRef({
      ctx,
      getRef: () => ({
        data: createWritableValueWithCallbacks({
          type: 'success',
          data: { uid, jwt },
          error: undefined,
          reportExpired: () => {},
        }),
        release: () => {},
      }),
      sizeMapper: () => ({
        width: ctx.contentWidth.get(),
        height: 120,
      }),
    });

    const cleanupThumbhashAttacher = createValueWithCallbacksEffect(
      inner.thumbhash,
      (th) => {
        setVWC(thumbhashVWC, th);
        return undefined;
      }
    );
    const cleanupImageAttacher = createValueWithCallbacksEffect(
      inner.image,
      (im) => {
        setVWC(imageVWC, im);
        return undefined;
      }
    );
    return () => {
      cleanupThumbhashAttacher();
      cleanupImageAttacher();
      inner.dispose();
      setVWC(imageVWC, null);
    };
  }, [uid, jwt, ctx, thumbhashVWC, imageVWC]);

  return (
    <GridImageBackground
      image={imageVWC}
      thumbhash={thumbhashVWC}
      size={useMappedValueWithCallbacks(ctx.contentWidth, (cw) => ({
        width: cw,
        height: 120,
      }))}
      borderRadius={{
        topLeft: 10,
        topRight: 10,
        bottomLeft: 0,
        bottomRight: 0,
      }}
    />
  );
};
