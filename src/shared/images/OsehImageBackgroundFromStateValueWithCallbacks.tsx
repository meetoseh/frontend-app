import { PropsWithChildren, ReactElement, useEffect, useRef } from "react";
import { ValueWithCallbacks } from "../lib/Callbacks";
import { OsehImageState } from "./OsehImageState";
import { ImageStyle, View, ViewStyle } from "react-native";
import { styles } from "./OsehImageBackgroundFromStateValueWithCallbacksStyles";
import { RenderGuardedComponent } from "../components/RenderGuardedComponent";
import { OsehImageFromState } from "./OsehImageFromState";

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
 */
export const OsehImageBackgroundFromStateValueWithCallbacks = ({
  children,
  state,
  style,
  imageStyle,
}: PropsWithChildren<{
  state: ValueWithCallbacks<OsehImageState>;
  /**
   * Additional styles to apply to the view containing the children.
   */
  style?: ViewStyle | undefined;
  /**
   * Additional styles to apply to the image.
   */
  imageStyle?: ImageStyle | undefined;
}>): ReactElement => {
  const containerRef = useRef<View>(null);

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
    }
  }, [state]);

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
      <View style={Object.assign({}, styles.childrenContainer, style)}>
        {children}
      </View>
    </View>
  );
};
