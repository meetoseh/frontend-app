import {
  MutableRefObject,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useRef,
} from "react";
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  View,
} from "react-native";
import { CarouselInfo } from "../hooks/useCarouselInfo";
import { styles } from "./CarouselStyles";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
} from "../lib/Callbacks";

type CarouselProps = {
  /**
   * Information about how the carousel should be displayed.
   */
  info: ValueWithCallbacks<CarouselInfo>;

  /**
   * Where we report panning state to, which should be forwarded to the
   * carousel info.
   */
  panning: WritableValueWithCallbacks<boolean>;

  /**
   * The function to use to pan the carousel
   * @param offset The new desired offset
   */
  panCarouselTo: (offset: number) => void;

  /**
   * Unlike in regular react, the stacked pressables in the carousel do
   * not propagate nicely. It's better to not have any pressables and use
   * this function when it's called to determine if one of the items was
   * pressed, via the measure() functions
   *
   * @param pageX The pageX of the press event
   * @param pageY The pageY of the press event
   */
  handleCarouselTapped: (pageX: number, pageY: number) => void;
};

/**
 * Renders a carousel of items, where the children represent the items. There
 * should be just as many children as there are items in the carousel, and
 * they should have the correct size and gap. The carousel will wrap them in
 * a flex container with flex-flow row nowrap.
 */
export const Carousel = ({
  info: infoVWC,
  panning: panningVWC,
  panCarouselTo,
  handleCarouselTapped,
  children,
}: PropsWithChildren<CarouselProps>): ReactElement => {
  const outerRef = useRef<View>(null);
  const innerRef = useRef<View>(null);

  // location & size
  useEffect(() => {
    if (outerRef.current === null || innerRef.current === null) {
      return;
    }

    const outer = outerRef.current;
    const inner = innerRef.current;

    let renderedPos: number | null = null;
    let renderedSize: {
      outerWidth: number;
      visibleWidth: number;
      height: number;
    } | null = null;
    infoVWC.callbacks.add(handleInfoEvent);

    return () => {
      infoVWC.callbacks.remove(handleInfoEvent);
    };

    function handleInfoEvent() {
      const pos = infoVWC.get().carouselOffset;
      const size = {
        outerWidth: infoVWC.get().computed.outerWidth,
        visibleWidth: infoVWC.get().computed.visibleWidth,
        height: infoVWC.get().computed.height,
      };

      if (
        renderedPos !== pos ||
        renderedSize === null ||
        renderedSize.height !== size.height ||
        renderedSize.outerWidth !== size.outerWidth
      ) {
        inner.setNativeProps({
          style: {
            ...styles.inner,
            left: pos,
            width: size.outerWidth,
            height: size.height,
          },
        });
      }

      if (
        renderedSize === null ||
        size.visibleWidth !== renderedSize.visibleWidth ||
        size.height !== renderedSize.height ||
        size.outerWidth !== renderedSize?.outerWidth
      ) {
        outer.setNativeProps({
          style: {
            ...styles.outer,
            width: size.visibleWidth,
            height: size.height,
          },
        });
      }

      renderedPos = pos;
      renderedSize = size;
    }
  }, [infoVWC]);

  const panResponderHandlers = useRef<{
    start: () => void;
    move: (
      evt: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => void;
    end: (
      evt: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => void;
  }>();
  const panResponder =
    useRef<PanResponderInstance>() as MutableRefObject<PanResponderInstance>;
  if (panResponder.current === undefined) {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderStart: () => {
        panResponderHandlers.current?.start();
      },
      onPanResponderMove: (evt, gestureState) => {
        panResponderHandlers.current?.move(evt, gestureState);
      },
      onPanResponderEnd: (evt, gestureState) => {
        panResponderHandlers.current?.end(evt, gestureState);
      },
    });
  }

  // panning
  useEffect(() => {
    if (outerRef.current === null) {
      return;
    }

    let carouselOffsetAtPanStart: number = infoVWC.get().carouselOffset;
    let panStartAt: number = 0;
    panResponderHandlers.current = {
      start: () => {
        if (infoVWC.get().panning) {
          return;
        }

        carouselOffsetAtPanStart = infoVWC.get().carouselOffset;
        panStartAt = Date.now();
      },
      move: (evt, gestureState) => {
        if (gestureState.dx === 0) {
          return;
        }

        const oldInfo = infoVWC.get();
        if (
          !oldInfo.panning &&
          Math.abs(gestureState.dx) < 5 &&
          Date.now() - panStartAt < 250
        ) {
          return;
        }

        if (!panningVWC.get()) {
          panningVWC.set(true);
          panningVWC.callbacks.call(undefined);
        }

        const newOffset = carouselOffsetAtPanStart + gestureState.dx;
        if (newOffset !== oldInfo.carouselOffset) {
          panCarouselTo(newOffset);
        }
      },
      end: (evt, gestureState) => {
        if (!infoVWC.get().panning) {
          if (evt.nativeEvent?.pageX !== undefined) {
            handleCarouselTapped(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          }
          return;
        }

        const finalPanLoc = carouselOffsetAtPanStart + gestureState.dx;
        if (infoVWC.get().carouselOffset !== finalPanLoc) {
          panCarouselTo(finalPanLoc);
        }
        panningVWC.set(false);
        panningVWC.callbacks.call(undefined);
      },
    };
    return () => {
      panResponderHandlers.current = undefined;

      if (panningVWC.get()) {
        panningVWC.set(false);
        panningVWC.callbacks.call(undefined);
      }
    };
  }, [infoVWC, panningVWC, panCarouselTo, handleCarouselTapped]);

  return (
    <View
      ref={outerRef}
      style={{
        ...styles.outer,
        width: infoVWC.get().computed.visibleWidth,
        height: infoVWC.get().computed.height,
      }}
      {...panResponder.current.panHandlers}
    >
      <View
        ref={innerRef}
        style={{
          ...styles.inner,
          left: infoVWC.get().carouselOffset,
          width: infoVWC.get().computed.outerWidth,
          height: infoVWC.get().computed.height,
        }}
      >
        {children}
      </View>
    </View>
  );
};
