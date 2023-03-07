import { ReactElement, useContext, useMemo } from 'react';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { useIsOsehPlus } from '../../shared/hooks/useIsOsehPlus';
import { OsehImageState, useOsehImageState } from '../../shared/hooks/useOsehImage';
import { useScreenSize } from '../../shared/hooks/useScreenSize';

export type UpgradeValuePropsState = {
  /**
   * If some of the state still needs time to have an accurate value.
   */
  loading: boolean;

  /**
   * If the user already has oseh+
   */
  isOsehPlus: boolean;

  /**
   * The background image for the screen
   */
  background: OsehImageState;

  /**
   * If an error has occurred that will prevent this from exiting the
   * loading state, an element describing the error, otherwise null.
   */
  error: ReactElement | null;
};

/**
 * A hook-like function which fetches everything required to show the upgrade
 * value props screen without a spinner. If `loading` is true, the screen should
 * show a spinner.
 */
export const useUpgradeValuePropsState = (): UpgradeValuePropsState => {
  const loginContext = useContext(LoginContext);
  const isOsehPlus = useIsOsehPlus({ loginContext, force: true });
  const dims = useScreenSize();

  const imageProps = useMemo(
    () => ({
      uid: 'oseh_if_hH68hcmVBYHanoivLMgstg',
      jwt: null,
      displayWidth: dims.width,
      displayHeight: dims.height,
      alt: '',
      isPublic: true,
    }),
    [dims.width, dims.height]
  );
  const imageBackground = useOsehImageState(imageProps);

  return useMemo(
    () => ({
      loading: isOsehPlus.loading || imageBackground.loading,
      isOsehPlus: isOsehPlus.value,
      background: imageBackground,
      error: isOsehPlus.error ?? imageBackground.error,
    }),
    [isOsehPlus, imageBackground]
  );
};
