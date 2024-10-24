import { PropsWithChildren, ReactElement } from 'react';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { useStyleVWC } from '../hooks/useStyleVWC';
import { setVWC } from '../lib/setVWC';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { useReactManagedValueAsValueWithCallbacks } from '../hooks/useReactManagedValueAsValueWithCallbacks';
import { View, ViewStyle } from 'react-native';

/**
 * Renders a container with a fixed width matching the suggested width of the
 * content area for an app-like screen. Always displays flex, direction column,
 * align stretch, justify center (by default).
 */
export const ContentContainer = ({
  contentWidthVWC,
  justifyContent,
  alignSelf,
  children,
}: PropsWithChildren<{
  contentWidthVWC: ValueWithCallbacks<number>;
  justifyContent?: ViewStyle['justifyContent'];
  alignSelf?: ViewStyle['alignSelf'];
}>): ReactElement => {
  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  const contentStyleVWC = useMappedValuesWithCallbacks(
    [contentWidthVWC, useReactManagedValueAsValueWithCallbacks(justifyContent)],
    (): ViewStyle => ({
      width: contentWidthVWC.get(),
      justifyContent: justifyContent ?? 'center',
      alignSelf: alignSelf ?? 'center',
      alignItems: 'stretch',
    })
  );
  useStyleVWC(contentRef, contentStyleVWC);

  return (
    <View ref={(r) => setVWC(contentRef, r)} style={contentStyleVWC.get()}>
      {children}
    </View>
  );
};
