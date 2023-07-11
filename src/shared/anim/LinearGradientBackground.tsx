import { LayoutChangeEvent, View } from "react-native";
import { useCallback, useEffect, useRef } from "react";
import { useWritableValueWithCallbacks } from "../lib/Callbacks";
import {
  SinglePassWebGLComponent,
  SinglePassWebGLComponentRenderer,
} from "./SinglePassWebGLComponent";
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from "./VariableStrategyProps";

export type ColorStop = {
  /** 0-255 for RGB, 0-1 for opacity */
  color: [number, number, number, number];
  offset: number;
};

export type LinearGradientState = {
  stops: ColorStop[];
  angleDegreesClockwiseFromTop: number;
};

export type LinearGradientProps = {
  state: VariableStrategyProps<LinearGradientState>;
};

type Attributes = "position";
type Uniforms = "resolution";
type Buffers = "position";
type Textures = never;

const numToGLSLFloat = (num: number): string => {
  const result = num.toString(10);
  if (result.indexOf(".") === -1) {
    return `${result}.0`;
  }
  return result;
};

const vecToGLSLVec = (vec: number[]): string =>
  `vec${vec.length}(${vec.map(numToGLSLFloat).join(", ")})`;

const colorToGLSLPrecomputedColor = (
  color: [number, number, number, number]
): string => {
  return `vec4(${color
    .slice(0, 3)
    .map((n) => numToGLSLFloat(n / 255.0))
    .join(", ")}, 1.0) * ${numToGLSLFloat(color[3])}`;
};

/**
 * Creates a valid GLSL function body that computes the color at a given
 * position in the gradient, given a float t which is the position
 * along the gradient from 0 to 1.
 *
 * This requires the stops are sorted by ascending offset and have no
 * duplicate offsets.
 *
 * The result is branchless.
 *
 * @param stops The color stops in the gradient
 * @returns A GLSL function body
 */
const createComputeColorFunction = (stops: ColorStop[]): string => {
  if (stops.length === 0) {
    return "return vec4(0, 0, 0, 0);";
  }

  if (stops.length === 1) {
    return `return ${colorToGLSLPrecomputedColor(stops[0].color)};`;
  }

  // We break out the two-stop case so the pattern is clear. The two-stop
  // case has 3 intervals: [0, offset0), [offset0, offset1), [offset1, 1].
  // We will use a combination of the mix and step functions to make this
  // branchless:
  // https://thebookofshaders.com/glossary/?search=mix
  // https://thebookofshaders.com/glossary/?search=step
  const terms: string[] = [];
  if (stops[0].offset !== 0) {
    terms.push(
      `(1.0 - step(${numToGLSLFloat(
        stops[0].offset
      )}, t)) * ${colorToGLSLPrecomputedColor(stops[0].color)}`
    );
  }
  for (let i = 0; i < stops.length - 1; i++) {
    // from i to i + 1
    terms.push(
      `step(${numToGLSLFloat(stops[i].offset)}, t) ` +
        `* (1.0 - step(${numToGLSLFloat(stops[i + 1].offset)}, t)) ` +
        `* mix(${colorToGLSLPrecomputedColor(
          stops[i].color
        )}, ${colorToGLSLPrecomputedColor(stops[i + 1].color)}, ` +
        `(t - ${numToGLSLFloat(stops[i].offset)}) / ${numToGLSLFloat(
          stops[i + 1].offset - stops[i].offset
        )})`
    );
  }
  if (stops[stops.length - 1].offset !== 1) {
    const lastStep = stops.length - 1;
    terms.push(
      `step(${numToGLSLFloat(stops[lastStep].offset)}, t) ` +
        `* ${colorToGLSLPrecomputedColor(stops[lastStep].color)}`
    );
  }

  return `return ${terms.join(" + ")};`;
};

/**
 * Creates a GLSL function that computes the position of a given point
 * along the gradient.
 *
 * For example, for a horizontal gradient within a (100, 100) rectangle,
 * the point (30, 50) is 30% of the way along the gradient, i.e., this returns
 * 0.3
 *
 * Requires that the angle is already in [0, 360).
 *
 * The result is branchless.
 *
 * @param angleDegClockwiseFromTop The angle of the gradient in degrees clockwise from the top,
 *   within [0, 360)
 * @param posX The expression that results in the current x position
 * @param posY The expression that results in the current y position
 * @param resolutionX The width of the gradient
 * @param resolutionY The height of the gradient
 */
const createComputeTExpression = (
  angleDegClockwiseFromTop: number,
  posX: string,
  posY: string,
  resolutionX: number,
  resolutionY: number
): string => {
  if (angleDegClockwiseFromTop === 0) {
    // Vertical up gradient
    return `(${numToGLSLFloat(resolutionY)} - ${posY}) / ${numToGLSLFloat(
      resolutionY
    )}`;
  }
  if (angleDegClockwiseFromTop === 90) {
    // Horizontal right gradient
    return `${posX} / ${numToGLSLFloat(resolutionX)}`;
  }
  if (angleDegClockwiseFromTop === 180) {
    // Vertical down gradient
    return `${posY} / ${numToGLSLFloat(resolutionY)}`;
  }
  if (angleDegClockwiseFromTop === 270) {
    // Horizontal left gradient
    return `(${numToGLSLFloat(resolutionX)} - ${posX}) / ${numToGLSLFloat(
      resolutionX
    )}`;
  }

  // This expression will compute a dot product along a vector in the direction
  // of the angle, but the ends won't be neat 0/1 values without adjustment.

  const unitVector = ((): [number, number] => {
    if (angleDegClockwiseFromTop < 90) {
      return [
        Math.sin((angleDegClockwiseFromTop * Math.PI) / 180),
        -Math.cos((angleDegClockwiseFromTop * Math.PI) / 180),
      ];
    }
    if (angleDegClockwiseFromTop < 180) {
      const phi = angleDegClockwiseFromTop - 90;
      return [Math.cos((phi * Math.PI) / 180), Math.sin((phi * Math.PI) / 180)];
    }
    if (angleDegClockwiseFromTop < 270) {
      const phi = angleDegClockwiseFromTop - 180;
      return [
        -Math.sin((phi * Math.PI) / 180),
        Math.cos((phi * Math.PI) / 180),
      ];
    }
    const phi = angleDegClockwiseFromTop - 270;
    return [-Math.cos((phi * Math.PI) / 180), -Math.sin((phi * Math.PI) / 180)];
  })();

  const corners = [
    [0, 0],
    [resolutionX, 0],
    [resolutionX, resolutionY],
    [0, resolutionY],
  ];
  const cornerDots = corners.map(
    ([x, y]) => x * unitVector[0] + y * unitVector[1]
  );
  const minDot = Math.min(...cornerDots);
  const maxDot = Math.max(...cornerDots);

  return `((${posX} * ${numToGLSLFloat(
    unitVector[0]
  )} + ${posY} * ${numToGLSLFloat(unitVector[1])}) - ${numToGLSLFloat(
    minDot
  )}) / ${numToGLSLFloat(maxDot - minDot)}`;
};

const LinearGradientRenderer: SinglePassWebGLComponentRenderer<
  Attributes,
  Uniforms,
  Buffers,
  Textures,
  LinearGradientState
> = {
  initialize: (gl, props) => {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);

    const vert = gl.createShader(gl.VERTEX_SHADER);
    if (vert === null) {
      throw new Error("Failed to create vertex shader");
    }
    gl.shaderSource(
      vert,
      `
      #version 100
    
      attribute vec2 a_position;
    
      uniform vec2 u_resolution;

      varying vec2 v_position;
    
      void main(void) {
        gl_Position = vec4((a_position / u_resolution) * 2.0 - 1.0, 0.0, 1.0);
        v_position = a_position;
      }
      `
    );
    gl.compileShader(vert);
    const vertMessage = gl.getShaderInfoLog(vert);
    if (vertMessage !== null && vertMessage.length > 0) {
      throw new Error("Failed to compile vertex shader: " + vertMessage);
    }

    const frag = gl.createShader(gl.FRAGMENT_SHADER);
    if (frag === null) {
      throw new Error("Failed to create fragment shader");
    }

    gl.shaderSource(
      frag,
      `
      #version 100

      precision highp float;

      uniform vec2 u_resolution;

      varying vec2 v_position;

      vec4 computeColor(float t) {
        ${createComputeColorFunction(props.stops)}
      }

      void main(void) {
        gl_FragColor = computeColor(${createComputeTExpression(
          props.angleDegreesClockwiseFromTop,
          "v_position.x",
          "v_position.y",
          gl.drawingBufferWidth,
          gl.drawingBufferHeight
        )});
      }
      `
    );
    gl.compileShader(frag);
    const fragMessage = gl.getShaderInfoLog(frag);
    if (fragMessage !== null && fragMessage.length > 0) {
      throw new Error("Failed to compile fragment shader: " + fragMessage);
    }

    const program = gl.createProgram();
    if (program === null) {
      throw new Error("Failed to create program");
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);

    const positionBuffer = gl.createBuffer();
    if (positionBuffer === null) {
      throw new Error("Failed to create position buffer");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0,
        0,
        gl.drawingBufferWidth,
        0,
        0,
        gl.drawingBufferHeight,
        0,
        gl.drawingBufferHeight,
        gl.drawingBufferWidth,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ]),
      gl.STATIC_DRAW
    );
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    if (resolutionLocation === null) {
      throw new Error("Failed to get resolution location");
    }

    return {
      gl,
      program,
      attributes: {
        position: gl.getAttribLocation(program, "a_position"),
      },
      uniforms: {
        resolution: resolutionLocation,
      },
      buffers: {
        position: positionBuffer,
      },
      textures: {},
      dispose: () => {
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
      },
    };
  },
  render: (state, props, dpi) => {
    if (props.stops.length !== 2) {
      throw new Error("only 2-stop gradients are supported");
    }

    const gl = state.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(state.program);

    gl.enableVertexAttribArray(state.attributes.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.position);
    gl.vertexAttribPointer(state.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(
      state.uniforms.resolution,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(state.attributes.position);
    gl.flush();
    gl.endFrameEXP();
  },
  requiresReinitialize: (oldProps, newProps) => {
    let stopsSame = true;
    if (oldProps.stops !== newProps.stops) {
      if (oldProps.stops.length !== newProps.stops.length) {
        stopsSame = false;
      } else {
        for (let i = 0; i < oldProps.stops.length; i++) {
          const oldStop = oldProps.stops[i];
          const newStop = newProps.stops[i];

          if (
            oldStop.color[0] !== newStop.color[0] ||
            oldStop.color[1] !== newStop.color[1] ||
            oldStop.color[2] !== newStop.color[2] ||
            oldStop.color[3] !== newStop.color[3] ||
            oldStop.offset !== newStop.offset
          ) {
            stopsSame = false;
            break;
          }
        }
      }
    }

    return (
      !stopsSame ||
      oldProps.angleDegreesClockwiseFromTop !==
        newProps.angleDegreesClockwiseFromTop
    );
  },
};

/**
 * Displays a linear gradient background underneath the children. We use a
 * custom element to handle this rather than one of the many libraries
 * (expo-linear-gradient, react-native-linear-gradient) since none support
 * changing the gradient without triggering a full rerender, and a full rerender
 * is a non-starter performance wise for animating backgrounds.
 *
 * Originally the intention was to just use the GL context for 256x1 rendering,
 * then using the transform property on a standard view to stretch it to fit the
 * container. However, this doesn't work on Android, since skew isn't implemented
 * correctly there: https://github.com/facebook/react-native/issues/27649
 */
export const LinearGradientBackground = ({
  state: stateRaw,
  children,
}: React.PropsWithChildren<LinearGradientProps>) => {
  const containerRef = useRef<View>(null);
  const backgroundRef = useRef<View>(null);
  const trueSize = useWritableValueWithCallbacks<{
    width: number;
    height: number;
  }>(() => ({ width: 0, height: 0 }));
  const state = useVariableStrategyPropsAsValueWithCallbacks(stateRaw);

  const rerender = useCallback(() => {
    if (backgroundRef.current === null) {
      return;
    }

    const currentSize = trueSize.get();
    backgroundRef.current.setNativeProps({
      style: {
        position: "absolute",
        width: currentSize.width,
        height: currentSize.height,
      },
    });
  }, [trueSize]);

  const onContainerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (
        e.nativeEvent?.layout?.width !== undefined &&
        e.nativeEvent?.layout?.height !== undefined
      ) {
        const width = e.nativeEvent.layout.width;
        const height = e.nativeEvent.layout.height;
        trueSize.set({ width, height });
        trueSize.callbacks.call(undefined);
      }
    },
    [trueSize]
  );

  useEffect(() => {
    let active = true;
    state.callbacks.add(rerenderIfActive);
    trueSize.callbacks.add(rerenderIfActive);

    return () => {
      if (active) {
        active = false;
        state.callbacks.remove(rerenderIfActive);
        trueSize.callbacks.remove(rerenderIfActive);
      }
    };

    function rerenderIfActive() {
      if (active) {
        rerender();
      }
    }
  }, [state, trueSize, rerender]);

  return (
    <View
      style={{ position: "relative" }}
      ref={containerRef}
      onLayout={onContainerLayout}
    >
      <View
        style={{
          position: "absolute",
        }}
        ref={backgroundRef}
      >
        <SinglePassWebGLComponent
          renderer={LinearGradientRenderer}
          props={state.get}
          propsChanged={state.callbacks}
          size={trueSize.get}
          sizeChanged={trueSize.callbacks}
        />
      </View>
      {children}
    </View>
  );
};
