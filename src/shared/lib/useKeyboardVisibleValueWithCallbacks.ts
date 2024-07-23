import { useEffect } from 'react';
import { ValueWithCallbacks, useWritableValueWithCallbacks } from './Callbacks';
import { Keyboard } from 'react-native';
import { setVWC } from './setVWC';

/**
 * A hook-like function to determine if the keyboard is visible
 * on screen; it's helpful to ensure theres an easy way to see
 * the next input while the keyboard is visible.
 *
 * @returns A value with callbacks that's true while the keyboard is
 *   visible, false otherwise
 * @see useKeyboardHeightValueWithCallbacks for an alternative
 */
export const useKeyboardVisibleValueWithCallbacks =
  (): ValueWithCallbacks<boolean> => {
    const result = useWritableValueWithCallbacks(() => false);

    useEffect(() => {
      const didShowListener = Keyboard.addListener('keyboardWillShow', () => {
        setVWC(result, true);
      });
      const didHideListener = Keyboard.addListener('keyboardWillHide', () => {
        setVWC(result, false);
      });
      setVWC(result, Keyboard.isVisible());
      return () => {
        didShowListener.remove();
        didHideListener.remove();
      };
    }, [result]);

    return result;
  };
