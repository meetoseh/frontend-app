import { PropsWithChildren, ReactElement, useEffect } from 'react';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { useStyleVWC } from '../hooks/useStyleVWC';
import { View, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ModalContext, Modals, ModalsOutlet } from '../contexts/ModalContext';
import { setVWC } from '../lib/setVWC';

/**
 * An element with the specified size positioned absolutely at the top-left of
 * the nearest parent. Never scrollable; use a content container or an explicit
 * ScrollView for scrolling.
 */
export const GridFullscreenContainer = ({
  windowSizeImmediate,
  statusBar,
  modals,
  children,
}: PropsWithChildren<{
  windowSizeImmediate: ValueWithCallbacks<{ width: number; height: number }>;
  /** True to configure the status bar, false not to */
  statusBar: boolean | 'light' | 'dark';
  /** True to provide a modal context to the children, false not to, or the Modals to provide */
  modals: boolean | WritableValueWithCallbacks<Modals>;
}>): ReactElement => {
  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const containerStyleVWC = useMappedValueWithCallbacks(
    windowSizeImmediate,
    (ws): ViewStyle => ({
      position: 'relative',
      top: 0,
      left: 0,
      height: ws.height,
      width: ws.width,
    })
  );
  useStyleVWC(containerRef, containerStyleVWC);

  const fallbackModalsVWC = useWritableValueWithCallbacks<Modals>(() => []);
  useEffect(() => {
    if (modals !== true) {
      setVWC(fallbackModalsVWC, []);
    }
  }, [modals]);

  return (
    <View ref={(r) => containerRef.set(r)} style={containerStyleVWC.get()}>
      {!!statusBar && (
        <StatusBar
          style={typeof statusBar === 'string' ? statusBar : 'light'}
        />
      )}
      {modals === false ? (
        children
      ) : (
        <ModalContext.Provider
          value={{ modals: modals === true ? fallbackModalsVWC : modals }}
        >
          {children}
        </ModalContext.Provider>
      )}
      {modals !== false && (
        <ModalsOutlet modals={modals === true ? fallbackModalsVWC : modals} />
      )}
    </View>
  );
};
