import { PropsWithChildren, ReactElement, useCallback, useMemo } from "react";
import { useStateCompat as useState } from "../hooks/useStateCompat";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  LayoutRectangle,
  Pressable,
  View,
} from "react-native";
import { useWindowSize as useScreenSize } from "../hooks/useWindowSize";
import { useTopBarHeight } from "../hooks/useTopBarHeight";
import { styles } from "./SimpleModalContainerStyles";

type SimpleModalContainerProps = {
  /**
   * Called when the user presses outside the modal.
   */
  onDismiss: () => void;
};

/**
 * A barebones modal container, which darkens outside the modal and can be
 * dismissed by pressing outside the modal. It's important that the childrens
 * height be set tightly.
 */
export const SimpleModalContainer = ({
  onDismiss,
  children,
}: PropsWithChildren<SimpleModalContainerProps>): ReactElement => {
  const screenSize = useScreenSize();
  const topBarHeight = useTopBarHeight();
  const [innerContainerBounds, setInnerContainerBounds] =
    useState<LayoutRectangle | null>(null);

  const outerContainerStyle = useMemo(() => {
    return Object.assign({}, styles.outerContainer, {
      top: topBarHeight,
      width: screenSize.width,
      height: screenSize.height - topBarHeight,
    });
  }, [screenSize.width, screenSize.height, topBarHeight]);

  const innerContainerStyle = useMemo(() => {
    return {};
  }, []);

  const onInnerContainerLayout = useCallback((event: LayoutChangeEvent) => {
    if (!event.nativeEvent) {
      return;
    }

    setInnerContainerBounds(event.nativeEvent.layout);
  }, []);

  const onOuterContainerPress = useCallback(
    (e: GestureResponderEvent) => {
      if (!e.nativeEvent) {
        return;
      }

      if (!innerContainerBounds) {
        return;
      }

      const ex = e.nativeEvent.pageX;
      const ey = e.nativeEvent.pageY;

      const bounds = innerContainerBounds;

      if (
        ex < bounds.x ||
        ex > bounds.x + bounds.width ||
        ey < bounds.y ||
        ey > bounds.y + bounds.height
      ) {
        onDismiss();
      }
    },
    [onDismiss, innerContainerBounds]
  );

  return (
    <Pressable onPress={onOuterContainerPress} style={outerContainerStyle}>
      <View onLayout={onInnerContainerLayout} style={innerContainerStyle}>
        {children}
      </View>
    </Pressable>
  );
};
