import { useEffect } from 'react';
import { ValueWithCallbacks, useWritableValueWithCallbacks } from './Callbacks';
import { Keyboard, Platform } from 'react-native';
import { setVWC } from './setVWC';

/**
 * A hook-like function to determine the amount of screen real estate hidden
 * by the virtual keyboard. Note that this will cover botBarHeight.
 *
 * @returns A value with callbacks that's true while the keyboard is
 *   visible, false otherwise
 * @see useKeyboardVisibleValueWithCallbacks for an alternative
 */
export const useKeyboardHeightValueWithCallbacks =
  (): ValueWithCallbacks<number> => {
    const result = useWritableValueWithCallbacks(() => 0);

    useEffect(() => {
      const willShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
        // ios only
        setVWC(result, e.endCoordinates.height);
      });
      const didShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
        setVWC(
          result,
          e.endCoordinates.height + Platform.select({ android: 24, default: 0 })
        );
      });
      const willHideListener = Keyboard.addListener('keyboardWillHide', () => {
        setVWC(result, 0);
      });
      const didHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setVWC(result, 0);
      });
      setVWC(
        result,
        Keyboard.isVisible() ? Keyboard.metrics()?.height ?? 0 : 0
      );
      return () => {
        willShowListener.remove();
        didShowListener.remove();
        willHideListener.remove();
        didHideListener.remove();
      };
    }, [result]);

    return result;
  };
