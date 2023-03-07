import { ReactElement, useContext, useMemo } from 'react';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { useIsOsehPlus } from '../../shared/hooks/useIsOsehPlus';

export type SettingsHomeState = {
  /**
   * If the user has the `pro` entitlement, for Oseh+
   */
  isOsehPlus: boolean;
  /**
   * If specified, loading will never complete because an error occurred
   */
  error: ReactElement | null;
  /**
   * If everything has loaded successfully
   */
  loaded: boolean;
};

/**
 * A hook-like function which loads all the necessary state for the SettingsHome
 * screen. This hook allows a parent component to manage a splash screen, as if
 * each screen manages its own splash screen we will sometimes get splash screen
 * into splash screen.
 */
export const useSettingsHomeState = (): SettingsHomeState => {
  const loginContext = useContext(LoginContext);
  const isOsehPlus = useIsOsehPlus({ loginContext, force: false });

  return useMemo(
    () => ({
      loaded: !isOsehPlus.loading,
      isOsehPlus: isOsehPlus.value,
      error: isOsehPlus.error,
    }),
    [isOsehPlus]
  );
};
