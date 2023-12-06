import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
} from "react";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../../shared/lib/Callbacks";
import { ConfirmMergeAccountState } from "../ConfirmMergeAccountState";
import { ConfirmMergeAccountResources } from "../ConfirmMergeAccountResources";
import { useValueWithCallbacksEffect } from "../../../../../shared/hooks/useValueWithCallbacksEffect";
import { setVWC } from "../../../../../shared/lib/setVWC";
import { useTimedValueWithCallbacks } from "../../../../../shared/hooks/useTimedValue";
import { useMappedValuesWithCallbacks } from "../../../../../shared/hooks/useMappedValuesWithCallbacks";
import { View } from "react-native";
import { SvgLinearGradientBackground } from "../../../../../shared/anim/SvgLinearGradientBackground";
import { STANDARD_BLACK_GRAY_GRADIENT_SVG } from "../../../../../styling/colors";
import { FullscreenView } from "../../../../../shared/components/FullscreenView";
import { CloseButton } from "../../../../../shared/components/CloseButton";
import { useContentWidth } from "../../../../../shared/lib/useContentWidth";
import { styles } from "./styles";
import { StatusBar } from "expo-status-bar";
import {
  ModalContext,
  ModalsOutlet,
} from "../../../../../shared/contexts/ModalContext";

export const ConfirmMergeAccountWrapper = ({
  state,
  resources,
  closeDisabled,
  onDismiss,
  keepSessionOpen,
  children,
}: PropsWithChildren<{
  state: ValueWithCallbacks<ConfirmMergeAccountState>;
  resources: ValueWithCallbacks<ConfirmMergeAccountResources>;
  closeDisabled?: WritableValueWithCallbacks<boolean>;
  keepSessionOpen?: boolean;
  onDismiss?: WritableValueWithCallbacks<() => void>;
}>): ReactElement => {
  const modalContext = useContext(ModalContext);
  const accidentalClickThroughPrevention = useTimedValueWithCallbacks(
    true,
    false,
    2000
  );

  const rawCloseDisabled = useMappedValuesWithCallbacks(
    [state, accidentalClickThroughPrevention],
    () =>
      state.get().result === undefined ||
      state.get().confirmResult === undefined ||
      accidentalClickThroughPrevention.get()
  );

  const realCloseDisabled = useWritableValueWithCallbacks(() => false);
  useValueWithCallbacksEffect(rawCloseDisabled, (v) => {
    if (!v) {
      setVWC(realCloseDisabled, false);
      return undefined;
    }

    setVWC(realCloseDisabled, true);
    let timeout: NodeJS.Timeout | null = setTimeout(() => {
      timeout = null;
      setVWC(realCloseDisabled, false);
    }, 5000);

    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  });

  useEffect(() => {
    if (closeDisabled === undefined) {
      return;
    }

    realCloseDisabled.callbacks.add(copyValue);
    copyValue();
    return () => {
      realCloseDisabled.callbacks.remove(copyValue);
    };

    function copyValue() {
      if (closeDisabled !== undefined) {
        setVWC(closeDisabled, realCloseDisabled.get());
      }
    }
  }, [realCloseDisabled, closeDisabled]);

  const onCloseClick = useCallback(() => {
    if (realCloseDisabled.get()) {
      return;
    }

    resources.get().session?.storeAction("dismiss", null);
    if (!keepSessionOpen) {
      resources.get().session?.reset();
    }
    state.get().onDismissed();
  }, [resources, state, realCloseDisabled, keepSessionOpen]);
  if (onDismiss !== undefined) {
    setVWC(onDismiss, onCloseClick);
  }

  const contentWidth = useContentWidth();

  return (
    <View style={styles.container}>
      <SvgLinearGradientBackground
        state={{
          type: "react-rerender",
          props: STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
      >
        <FullscreenView style={styles.background} alwaysScroll>
          <CloseButton onPress={onCloseClick} />
          <View style={{ ...styles.content, width: contentWidth }}>
            {children}
          </View>
        </FullscreenView>
      </SvgLinearGradientBackground>
      <ModalsOutlet modals={modalContext.modals} />
      <StatusBar style="light" />
    </View>
  );
};
