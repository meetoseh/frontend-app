import {
  PropsWithChildren,
  ReactElement,
  RefObject,
  useEffect,
  useRef,
} from "react";
import { ValueWithCallbacks } from "../lib/Callbacks";
import { OsehImageState } from "./OsehImageState";
import { ImageStyle, ScrollView, View, ViewStyle } from "react-native";
import { styles } from "./OsehImageBackgroundFromStateValueWithCallbacksStyles";
import { RenderGuardedComponent } from "../components/RenderGuardedComponent";
import { OsehImageFromState } from "./OsehImageFromState";
import { useIsEffectivelyTinyScreen } from "../hooks/useIsEffectivelyTinyScreen";

/**
 * Uses the standard rendering for the given oseh image state, using a placeholder
 * before the image is available. Accepts children which are rendered on top of
 * the image.
 *
 * If an imageStyle is specified, it should not include the width and height, as
 * those are set by the state. However, if it does, it will override the state's
 * values.
 *
 * Note that this is much more efficient than the standard
 * OsehImageBackgroundFromState via RenderGuardedComponent - this will
 * reduce the number of child rerenders caused by the image changing.
 *
 * For accessibility, if font scaling is enabled, the body becomes scrollable
 */
export const OsehImageBackgroundFromStateValueWithCallbacks = ({
  children,
  state,
  style,
  styleVWC,
  imageStyle,
  disableAccessibilityScrolling,
}: PropsWithChildren<{
  state: ValueWithCallbacks<OsehImageState>;
  /**
   * Additional styles to apply to the view containing the children.
   */
  style?: ViewStyle | undefined;
  /**
   * If specified, added after the style without rerendering the children.
   */
  styleVWC?: ValueWithCallbacks<ViewStyle>;
  /**
   * Additional styles to apply to the image.
   */
  imageStyle?: ImageStyle | undefined;
  /**
   * If true, disables accessibility scrolling on the body. This should only
   * be used if there is a scrollable container inside the body.
   */
  disableAccessibilityScrolling?: boolean;
}>): ReactElement => {
  const containerRef = useRef<View>(null);
  const childContainerRef = useRef<View | ScrollView>(null);
  const isTinyScreen =
    useIsEffectivelyTinyScreen() && disableAccessibilityScrolling !== true;

  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }
    let active = true;
    const ref = containerRef.current;
    const renderedSize: { width: number; height: number } = {
      width: state.get().displayWidth,
      height: state.get().displayHeight,
    };
    state.callbacks.add(handleStateChange);
    return () => {
      if (!active) {
        return;
      }
      active = false;
      state.callbacks.remove(handleStateChange);
    };

    function handleStateChange() {
      if (!active) {
        return;
      }
      const newSize = {
        width: state.get().displayWidth,
        height: state.get().displayHeight,
      };
      if (
        renderedSize.width === newSize.width &&
        renderedSize.height === newSize.height
      ) {
        return;
      }
      renderedSize.width = newSize.width;
      renderedSize.height = newSize.height;
      ref.setNativeProps({
        style: {
          ...styles.container,
          width: newSize.width,
          height: newSize.height,
        },
      });

      if (isTinyScreen && childContainerRef.current !== null) {
        childContainerRef.current.setNativeProps({
          style: {
            width: newSize.width,
            height: newSize.height,
          },
        });
      }
    }
  }, [state]);

  useEffect(() => {
    if (childContainerRef.current === null || styleVWC === undefined) {
      return;
    }

    const ref = childContainerRef.current;
    styleVWC.callbacks.add(handleStyleChange);
    state.callbacks.add(handleStyleChange);
    handleStyleChange();
    return () => {
      styleVWC.callbacks.remove(handleStyleChange);
      state.callbacks.remove(handleStyleChange);
    };

    function handleStyleChange() {
      const contentContainerStyle = Object.assign(
        {},
        styles.childrenContainer,
        style,
        styleVWC?.get(),
        {
          width: state.get().displayWidth,
        },
        isTinyScreen
          ? {
              paddingBottom: 40,
              minHeight: state.get().displayHeight,
            }
          : {
              height: state.get().displayHeight,
            }
      );

      if (isTinyScreen) {
        ref.setNativeProps({
          contentContainerStyle: contentContainerStyle,
        });
      } else {
        ref.setNativeProps({
          style: contentContainerStyle,
        });
      }
    }
  }, [style, styleVWC, isTinyScreen]);

  return (
    <View
      style={{
        ...styles.container,
        width: state.get().displayWidth,
        height: state.get().displayHeight,
      }}
      ref={containerRef}
    >
      <RenderGuardedComponent
        props={state}
        component={(img) => (
          <OsehImageFromState
            state={img}
            style={Object.assign({}, styles.imageContainer, imageStyle)}
            pointerEvents="none"
          />
        )}
      />
      {!isTinyScreen && (
        <View
          ref={childContainerRef as RefObject<View>}
          style={Object.assign(
            {},
            styles.childrenContainer,
            style,
            styleVWC?.get(),
            {
              width: state.get().displayWidth,
              height: state.get().displayHeight,
            }
          )}
        >
          {children}
        </View>
      )}
      {isTinyScreen && (
        <ScrollView
          ref={childContainerRef as RefObject<ScrollView>}
          style={{
            width: state.get().displayWidth,
            height: state.get().displayHeight,
          }}
          contentContainerStyle={Object.assign(
            {},
            styles.childrenContainer,
            style,
            styleVWC?.get(),
            {
              paddingBottom: 40,
              width: state.get().displayWidth,
              minHeight: state.get().displayHeight,
            }
          )}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
};
