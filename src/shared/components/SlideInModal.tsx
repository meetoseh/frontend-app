import { PropsWithChildren, ReactElement, useEffect } from "react";
import { WritableValueWithCallbacks } from "../lib/Callbacks";
import { Modal, View } from "react-native";
import { CloseButton } from "./CloseButton";
import { styles } from "./SlideInModalStyles";
import { FullscreenView } from "./FullscreenView";
import { setVWC } from "../lib/setVWC";
import { useIsEffectivelyTinyScreen } from "../hooks/useIsEffectivelyTinyScreen";

type SlideInModalProps = {
  /** The title for the modal */
  title: string;

  /**
   * Called after the user clicks the x or the background to close the modal
   * and all animations for closing the modal have completed.
   */
  onClosed: () => void;

  /**
   * Called potentially multiple times whenever the closing animation begins.
   * Not guarranteed to be called before onClosed.
   */
  onClosing?: () => void;

  /**
   * Updated witha callback that plays the closing animation and then calls
   * onClosed when finished
   */
  requestClose?: WritableValueWithCallbacks<() => void>;

  /**
   * If specified, we write true to this value while we
   * are animating the component or the user is dragging.
   * Can be used to disable components or scrolling to
   * improve performance.
   */
  animating?: WritableValueWithCallbacks<boolean>;
};

/**
 * A container which, when added to the DOM, slides up form the bottom.
 * The user can dismiss the container either by clicking above the
 * container or by clicking a close button
 *
 * When the container is fully open, the background is heavily dimmed.
 * While the user is dragging the dimming is reduced to allow them to
 * see the content behind the container.
 */
export const SlideInModal = ({
  onClosed,
  animating,
  requestClose,
  children,
}: PropsWithChildren<SlideInModalProps>): ReactElement => {
  useEffect(() => {
    if (animating !== undefined) {
      setVWC(animating, false);
    }
  }, [animating]);

  useEffect(() => {
    if (requestClose !== undefined) {
      setVWC(requestClose, onClosed);
    }
  }, [requestClose, onClosed]);

  const isTinyScreen = useIsEffectivelyTinyScreen();

  return (
    <Modal
      animationType="slide"
      visible={true}
      onRequestClose={onClosed}
      presentationStyle={isTinyScreen ? "fullScreen" : "pageSheet"}
    >
      {isTinyScreen ? (
        <FullscreenView alwaysScroll={true} style={styles.container}>
          <CloseButton onPress={onClosed} variant="light" />
          {children}
        </FullscreenView>
      ) : (
        <View style={{ ...styles.container, ...styles.containerLarge }}>
          <CloseButton onPress={onClosed} variant="light" />
          {children}
        </View>
      )}
    </Modal>
  );
};
