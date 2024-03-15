import { View, ViewStyle } from 'react-native';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from './VariableStrategyProps';
import { RenderGuardedComponent } from '../components/RenderGuardedComponent';
import {
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { setVWC } from '../lib/setVWC';
import { useEffect } from 'react';
import { SvgLinearGradient, SvgLinearGradientState } from './SvgLinearGradient';

export type SvgLinearGradientBackgroundState = SvgLinearGradientState;

export type SvgLinearGradientBackgroundProps = {
  state: VariableStrategyProps<SvgLinearGradientBackgroundState>;
  containerStyle?: ViewStyle;
  refVWC?: WritableValueWithCallbacks<View | null>;
};

/**
 * Renders a n-stop linear gradient behind the children using react-native-svg
 * as the rendering engine. Skips rendering the svg when the stops are the same
 * color, for performance.
 *
 * This seems to be less likely to get a corrupted gradient compared to
 * the webgl version (LinearGradientBackground). Performance wise, it's
 * about the same.
 */
export const SvgLinearGradientBackground = ({
  state: stateRaw,
  containerStyle,
  refVWC: rawRefVWC,
  children,
}: React.PropsWithChildren<SvgLinearGradientBackgroundProps>) => {
  const stateVWC = useVariableStrategyPropsAsValueWithCallbacks(stateRaw);
  const realRefVWC = useWritableValueWithCallbacks<View | null>(() => null);

  useEffect(() => {
    if (rawRefVWC === undefined) {
      return;
    }

    const raw = rawRefVWC;
    realRefVWC.callbacks.add(onChange);
    onChange();
    return () => {
      realRefVWC.callbacks.remove(onChange);
    };

    function onChange() {
      setVWC(raw, realRefVWC.get());
    }
  }, [rawRefVWC, realRefVWC]);

  return (
    <View
      style={{ position: 'relative', ...containerStyle }}
      ref={(r) => setVWC(realRefVWC, r)}
    >
      <RenderGuardedComponent
        props={stateVWC}
        component={(state) => <SvgLinearGradient state={state} />}
      />
      {children}
    </View>
  );
};
