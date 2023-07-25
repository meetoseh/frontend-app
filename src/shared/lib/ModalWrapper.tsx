import { PropsWithChildren, ReactElement } from "react";
import { Pressable, ViewStyle } from "react-native";
import { styles } from "./ModalWrapperStyles";
import { useWindowSize } from "../hooks/useWindowSize";

type ModalProps = {
  /**
   * Called when the user clicks outside the modal
   */
  onClosed: () => void;

  /**
   * If true, the modal will not have any padding or border radius. Helpful
   * if you want to style that part yourself, or set a background color.
   * Default false.
   */
  minimalStyling?: boolean | undefined;

  /**
   * Styling to apply to the inner container, if desired
   */
  innerContainerStyle?: ViewStyle | undefined;
};

/**
 * Wraps the children in the standard modal wrapper. This is typically used
 * when injecting into the modal context.
 */
export const ModalWrapper = ({
  children,
  onClosed,
  minimalStyling = undefined,
  innerContainerStyle = undefined,
}: PropsWithChildren<ModalProps>): ReactElement => {
  if (minimalStyling === undefined) {
    minimalStyling = false;
  }

  const windowSize = useWindowSize();

  return (
    <Pressable
      style={{
        ...styles.container,
        ...(minimalStyling ? styles.minimalContainer : styles.normalContainer),
        width: windowSize.width,
        height: windowSize.height,
      }}
      onPress={() => onClosed()}
    >
      <Pressable
        style={Object.assign(styles.innerContainer, innerContainerStyle)}
      >
        {children}
      </Pressable>
    </Pressable>
  );
};
