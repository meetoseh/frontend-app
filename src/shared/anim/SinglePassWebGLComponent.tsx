import {
  MutableRefObject,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useStateCompat as useState } from "../hooks/useStateCompat";
import { Callbacks, useWritableValueWithCallbacks } from "../lib/Callbacks";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { LayoutChangeEvent, PixelRatio } from "react-native";

/**
 * The basic render state for a WebGL component which uses a single render pass.
 */
export type RenderState<
  A extends string,
  U extends string,
  B extends string,
  T extends string
> = {
  /**
   * The WebGL context.
   */
  gl: ExpoWebGLRenderingContext;
  /**
   * The program used to render the component.
   */
  program: WebGLProgram;
  /**
   * The attribute names mapped to the attribute locations. Attributes are
   * typically used to pass per-vertex data to the vertex shader, e.g.,
   * a position offset or the texture coordinates corresponding to a vertex.
   */
  attributes: Record<A, number>;
  /**
   * The uniform names mapped to the uniform location. Uniforms are used
   * to pass data that's constant for the whole pass, e.g., the resolution
   * or opacity.
   */
  uniforms: Record<U, WebGLUniformLocation>;
  /**
   * The buffers used to store vertex data. Buffers are used to fill attributes
   * with data.
   */
  buffers: Record<B, WebGLBuffer>;
  /**
   * The textures used to store image data. Textures are bound in order,
   * and the order they are bound is stored in the `unit` field, starting
   * at 0 and incrementing by 1 for each texture. The texture unit is all
   * that is required in teh render pass, but the actual texture is used
   * for cleanup.
   */
  textures: Record<T, { unit: number; val: WebGLTexture }>;
  /**
   * Disposes of all unmanaged resources used by the render state. This
   * is called prior to a new render state being created.
   */
  dispose: () => void;
};

/**
 * Describes an object capable of rendering a WebGL component using a single
 * render pass and a configurable props like object P.
 */
export type SinglePassWebGLComponentRenderer<
  A extends string,
  U extends string,
  B extends string,
  T extends string,
  P extends object
> = {
  /**
   * Initializes the WebGL context and program, returning the initial render
   * state. This is typically only called once when the component is mounted,
   * and the returned dispose function is called when the component is
   * unmounted. However, it can be called arbitrarily often if the operating
   * system decides to dispose of the old WebGL context and create a new one.
   *
   * @param gl The new context to use.
   * @param props The props to initialize with. For static shaders this should
   *   be unused
   * @returns The immutable render state.
   */
  initialize: (
    gl: ExpoWebGLRenderingContext,
    props: P
  ) => RenderState<A, U, B, T>;

  /**
   * Renders the component using the given render state and props. This is
   * called when the props change.
   *
   * @param state The render state.
   * @param props The props to render with.
   * @param dpi The number of physical pixels per logical pixel when we go
   *   to render. This can be useful since props should always be specified
   *   in logical pixels.
   */
  render: (state: RenderState<A, U, B, T>, props: P, dpi: number) => void;

  /**
   * Many shaders can be more efficiently implemented by dynamically creating
   * the shader, rather than passing uniforms to a static shader. If this
   * function is defined, when the props change it's called to determine if
   * the old shader can be reused or if a new shader must be created. If
   * this is not specified, the shader is always reused.
   *
   * @param oldProps The old props.
   * @param newProps The new props.
   * @returns True if the shader must be recreated, false if it can be reused.
   */
  requiresReinitialize?: (oldProps: P, newProps: P) => boolean;
};

type SinglePassWebGLComponentProps<
  A extends string,
  U extends string,
  B extends string,
  T extends string,
  P extends object
> = {
  /**
   * The renderer to use to render the component.
   */
  renderer: SinglePassWebGLComponentRenderer<A, U, B, T, P>;

  /**
   * The props to render with. This is a function so that the value of the props
   * can change without triggering a full react rerender, since webgl components
   * are often animated.
   *
   * The result of this function should only change if propsChanged is invoked
   * shortly afterward with the new props or this function is changed.
   *
   * Note that changing this function will cause the entire WebGL context to be
   * rebuilt, while changing the result will only cause the component to be
   * rerendered.
   */
  props: () => P;

  /**
   * Invoking these callbacks will cause the component to be rerendered with
   * the current props, immediately. This should only be called at most once
   * per frame when animating.
   *
   * Note that changing this instance will cause the entire WebGL context to be
   * rebuilt, while invoking the callbacks will only cause the component to be
   * rerendered.
   */
  propsChanged: Callbacks<undefined>;

  /**
   * The size of the canvas in logical pixels. Changing this value may cause
   * the entire WebGL context to be rebuilt.
   */
  size: () => { width: number; height: number };

  /**
   * Must be called when the size changes.
   */
  sizeChanged: Callbacks<undefined>;
};

/**
 * Renders a single-pass WebGL component onto a canvas, with a way to rerender
 * without causing a full react rerender.
 *
 * The props for this component would typically be animated using the
 * `AnimationLoop`.
 *
 * This component is designed that browsers will always provide a canvas whose
 * backing store is the same size as the number of physical pixels within the
 * canvas, rather than logical pixels, provided enough gpu memory is available.
 */
export function SinglePassWebGLComponent<
  A extends string,
  U extends string,
  B extends string,
  T extends string,
  P extends object
>({
  renderer,
  props,
  propsChanged,
  size,
  sizeChanged,
}: SinglePassWebGLComponentProps<A, U, B, T, P>): ReactElement {
  const [remounting, setRemounting] = useState(false);
  const remountDone = useRef<Callbacks<undefined>>() as MutableRefObject<
    Callbacks<undefined>
  >;
  if (remountDone.current === undefined) {
    remountDone.current = new Callbacks();
  }

  const [renderedSize, setRenderedSize] = useState<{
    width: number;
    height: number;
  }>(() => size());
  const glContext =
    useWritableValueWithCallbacks<ExpoWebGLRenderingContext | null>(() => null);
  const onGlContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      glContext.set(gl);
      glContext.callbacks.call(undefined);
    },
    [glContext]
  );
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (e.nativeEvent?.layout?.width === undefined) {
        return;
      }

      if (remounting) {
        return;
      }

      const shownSize = {
        width: e.nativeEvent.layout.width,
        height: e.nativeEvent.layout.height,
      };
      if (
        Math.abs(renderedSize.width - shownSize.width) >= 1 ||
        Math.abs(renderedSize.height - shownSize.height) >= 1
      ) {
        const onDoneRemounting = () => {
          remountDone.current.remove(onDoneRemounting);
          setRemounting(false);
        };
        remountDone.current.add(onDoneRemounting);
        setRemounting(true);
      }
    },
    [renderedSize, remounting]
  );

  useEffect(() => {
    const dpi = PixelRatio.get();
    let state: RenderState<A, U, B, T> | null = null;
    let renderedProps: P | null = null;
    let active = true;
    const rerender = () => {
      if (!active) {
        return;
      }

      if (state !== null) {
        if (
          renderedProps !== null &&
          renderer.requiresReinitialize !== undefined &&
          renderer.requiresReinitialize(renderedProps, props())
        ) {
          refreshState();
        }
        renderedProps = props();
        renderer.render(state, renderedProps, dpi);
      }
    };

    const refreshState = () => {
      if (!active) {
        return;
      }

      if (state !== null) {
        state.dispose();
        state = null;
        renderedProps = null;
      }

      const newContext = glContext.get();
      if (newContext !== null) {
        state = renderer.initialize(newContext, props());
      }
    };

    const contextChanged = () => {
      refreshState();
      rerender();
    };

    propsChanged.add(rerender);
    glContext.callbacks.add(contextChanged);
    refreshState();
    rerender();

    return () => {
      if (active) {
        active = false;
        propsChanged.remove(rerender);
        glContext.callbacks.remove(contextChanged);
        if (state !== null) {
          state.dispose();
          state = null;
        }
      }
    };
  }, [renderer, props, propsChanged, glContext]);

  useEffect(() => {
    sizeChanged.add(handleSizeChanged);
    handleSizeChanged();
    return () => {
      sizeChanged.remove(handleSizeChanged);
    };

    function handleSizeChanged() {
      const { width, height } = size();
      setRenderedSize((rendered) => {
        if (rendered.width === width && rendered.height === height) {
          return rendered;
        }

        return { width, height };
      });
    }
  }, [size, sizeChanged]);

  if (remounting) {
    remountDone.current.call(undefined);
    return <></>;
  }

  if (renderedSize.width <= 0 || renderedSize.height <= 0) {
    return <></>;
  }

  return (
    <GLView
      onLayout={onLayout}
      style={{
        width: renderedSize.width,
        height: renderedSize.height,
        flexGrow: 0,
        flexShrink: 0,
      }}
      onContextCreate={onGlContextCreate}
    />
  );
}
