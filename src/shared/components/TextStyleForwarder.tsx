import { StyleProp, TextStyle } from 'react-native';
import {
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { ReactElement } from 'react';

/**
 * Most of the time the lack of cascading styles isn't too big an
 * issue, but when text styles are highly dynamic (like in buttons),
 * it can involve quite a bit of boilerplate. This helps by creating
 * a writable value with callbacks for a text style prop in-line,
 * rather than having to do it in a separate area.
 */
export const TextStyleForwarder = ({
  component,
}: {
  component: (
    style: WritableValueWithCallbacks<StyleProp<TextStyle>>
  ) => ReactElement;
}) => {
  const styleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  return component(styleVWC);
};
