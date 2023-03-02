import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { JourneyPromptProps } from '../models/JourneyPromptProps';
import { styles } from './JourneyColorPromptStyles';
import { JourneyPromptText } from './JourneyPromptText';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';

const minRowHeight = 48;
const rowGap = 32;
const minColorRowsHeight = 128;

const columnWidth = 48;
const columnGap = 32;

const colorRowsHorizontalPadding = styles.colorRows.paddingLeft + styles.colorRows.paddingRight;

const computeRowHeightForNumRows = (containerHeight: number, numRows: number): number => {
  const totalGap = rowGap * (numRows - 1);
  const totalHeight = containerHeight - totalGap;
  return totalHeight / numRows;
};

const computeMaxColumnsForContainerWidth = (containerWidth: number): number => {
  const maxColumns = Math.floor((containerWidth + columnGap) / (columnWidth + columnGap));
  return maxColumns;
};

type ColorOpt = {
  color: string;
  index: number;
};

/**
 * Displays the statistics and allows the user to answer a color prompt,
 * where there are several colors to choose from and the user can change
 * his answer for the duration of the lobby.
 */
export const JourneyColorPrompt = ({
  prompt,
  setHeight: setOuterHeight,
  stats,
  journeyTime,
  loginContext,
  journeyLobbyDurationSeconds,
  journeyUid,
  journeyJwt,
  sessionUid,
}: JourneyPromptProps): ReactElement => {
  if (prompt.style !== 'color') {
    throw new Error('Invalid prompt style');
  }

  const [titleHeight, setTitleHeight] = useState(0);
  const screenSize = useScreenSize();

  const rowOptions: ColorOpt[][] = useMemo(() => {
    const desiredNumColumns = computeMaxColumnsForContainerWidth(
      screenSize.width - colorRowsHorizontalPadding
    );
    const numColumns = Math.min(desiredNumColumns, prompt.colors.length);

    const result = [];
    let row: ColorOpt[] = [];
    for (let i = 0; i < prompt.colors.length; i++) {
      row.push({
        color: prompt.colors[i],
        index: i,
      });
      if (row.length >= numColumns) {
        result.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      result.push(row);
    }
    return result;
  }, [prompt.colors, screenSize.width]);

  const rowHeight = useMemo<number>(() => {
    const desiredRowHeight = computeRowHeightForNumRows(minColorRowsHeight, rowOptions.length);
    return Math.max(minRowHeight, desiredRowHeight);
  }, [rowOptions]);

  const rowStyles = useMemo<ViewStyle[]>(() => {
    return rowOptions.map((row) => {
      const rowWidth = row.length * columnWidth + (row.length - 1) * columnGap;

      return Object.assign({}, styles.colorRow, {
        height: rowHeight,
        maxHeight: rowHeight,
        minHeight: rowHeight,
        flexBasis: rowHeight,
        width: rowWidth,
        maxWidth: rowWidth,
        minWidth: rowWidth,
      });
    });
  }, [rowOptions]);

  const colorRowsHeight = rowHeight * rowOptions.length + rowGap * (rowOptions.length - 1);
  const colorRowsStyle = useMemo<ViewStyle>(() => {
    return Object.assign({}, styles.colorRows, {
      colorRowsHeight,
      maxHeight: colorRowsHeight,
      minHeight: colorRowsHeight,
      flexBasis: colorRowsHeight,
    });
  }, [colorRowsHeight]);

  const height = useMemo(() => {
    if (titleHeight <= 0) {
      return 0;
    }

    return titleHeight + colorRowsHeight + styles.colorRows.marginTop;
  }, [titleHeight, colorRowsHeight]);

  useEffect(() => {
    if (setOuterHeight) {
      setOuterHeight(height);
    }
  }, [setOuterHeight, height]);

  const containerStyle = useMemo<ViewStyle>(() => {
    if (height <= 0) {
      return styles.container;
    }

    return Object.assign({}, styles.container, {
      height,
      maxHeight: height,
      minHeight: height,
      flexBasis: height,
    });
  }, [height]);

  const onColorPressed = useCallback((idx: number) => {
    console.log('pressed color idx ' + idx);
  }, []);
  const onColorPressedRef = useRef(onColorPressed);
  onColorPressedRef.current = onColorPressed;

  const optionInfoRefs = useRef<OptionInfo[]>([]);
  if (optionInfoRefs.current.length !== prompt.colors.length) {
    optionInfoRefs.current = prompt.colors.map((col, idx) => ({
      height: 0,
      active: false,
      color: col,
      onPress: () => {
        onColorPressedRef.current(idx);
      },
      awaken: null,
    }));
  }

  const boundGetOptionInfo = useMemo<(() => OptionInfo)[]>(() => {
    return prompt.colors.map((col, idx) => () => optionInfoRefs.current[idx]);
  }, [prompt.colors]);

  return (
    <View style={containerStyle}>
      <JourneyPromptText text={prompt.text} setHeight={setTitleHeight} />
      <View style={colorRowsStyle}>
        {rowOptions.map((row, rowIndex) => (
          <View key={rowIndex} style={rowStyles[rowIndex]}>
            {row.map((opt) => (
              <Option
                key={opt.index}
                infoRef={boundGetOptionInfo[opt.index]}
                width={columnWidth}
                height={rowHeight}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

type OptionInfo = {
  /**
   * The height of the background for the option, which should be
   * based on the percentage of people who have chosen this option.
   * This is the target height; the rendered height is interpolated.
   * After changing this value, awaken() should be called to
   * animate the change.
   */
  height: number;
  /**
   * If this is the currently active option for the user. This impacts
   * primarily the opacity of the item. This is the target value; the
   * rendered value is interpolated. After changing this value,
   * awaken() should be called to animate the change.
   */
  active: boolean;
  /**
   * The color for the background when active.
   */
  color: string;
  /**
   * The function to call when the option is pressed. Whatever value
   * this has when the component is pressed will be called. This is
   * set by the parent of the component.
   */
  onPress: (() => void) | null;
  /**
   * If the component is not already animating, this function will
   * cause the component to animate to the current target values.
   * This is set by the component.
   */
  awaken: (() => void) | null;
};

type OptionProps = {
  /**
   * A function which can get the current info for the option. The returned
   * value is assumed to be mutated rather than infoRef() returning a new
   * value each time. The component will mutate the returned value as well.
   *
   * If the returned value must be replaced, then this can be handled
   * by changing the infoRef function itself which will cause the component
   * to recheck the value.
   */
  infoRef: () => OptionInfo;

  /**
   * The width of the option. This is set by the parent of the component
   * and uses standard state management.
   */
  width: number;

  /**
   * The height of the option. This is set by the parent of the component
   * and uses standard state management.
   */
  height: number;
};

const Option = ({ infoRef, width: outerWidth, height: outerHeight }: OptionProps): ReactElement => {
  const glContextRef = useRef<ExpoWebGLRenderingContext | null>(null);

  const onGlContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glContextRef.current = gl;
  }, []);

  useEffect(() => {
    let mounted = true;
    let awake = true;
    let handlingGl: {
      gl: ExpoWebGLRenderingContext;
      state: OptionGlState;
      bufferWidth: number;
      bufferHeight: number;
      destroy: () => void;
    } | null = null;
    const info = infoRef();

    info.awaken = awaken;
    requestAnimationFrame(animate);
    return () => {
      if (!mounted) {
        return;
      }

      mounted = false;
      info.awaken = null;
      if (handlingGl !== null) {
        handlingGl.destroy();
        handlingGl = null;
      }
    };

    function awaken() {
      if (awake) {
        return;
      }
      awake = true;
      requestAnimationFrame(animate);
    }

    function onGoingToSleep() {
      if (!awake) {
        return;
      }

      awake = false;
    }

    function animate() {
      if (!mounted) {
        return;
      }

      const gl = glContextRef.current;
      if (gl === null) {
        requestAnimationFrame(animate);
        return;
      }

      if (
        handlingGl === null ||
        handlingGl.gl.contextId !== gl.contextId ||
        handlingGl.bufferWidth !== gl.drawingBufferWidth ||
        handlingGl.bufferHeight !== gl.drawingBufferHeight
      ) {
        if (handlingGl !== null) {
          handlingGl.destroy();
        }

        const [state, destroy] = initializeGl(gl);
        handlingGl = {
          gl,
          state,
          bufferWidth: gl.drawingBufferWidth,
          bufferHeight: gl.drawingBufferHeight,
          destroy,
        };
      }

      applyStyle(
        gl,
        handlingGl.state,
        0.4,
        {
          width: gl.drawingBufferWidth,
          outlineHeight: gl.drawingBufferHeight,
          fillHeight: (gl.drawingBufferHeight / outerHeight) * info.height,
        },
        info.color
      );
      onGoingToSleep();
    }

    function initializeGl(gl: ExpoWebGLRenderingContext): [OptionGlState, () => void] {
      console.log(
        'initializing gl with buffer size',
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        'and context id',
        gl.contextId
      );

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);

      const vert = gl.createShader(gl.VERTEX_SHADER);
      if (vert === null) {
        throw new Error('Failed to create vertex shader');
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
        throw new Error('Failed to compile vertex shader: ' + vertMessage);
      }

      const frag = gl.createShader(gl.FRAGMENT_SHADER);
      if (frag === null) {
        throw new Error('Failed to create fragment shader');
      }
      gl.shaderSource(
        frag,
        `
        #version 100

        uniform vec2 u_resolution;
        uniform float u_radius;
        uniform vec3 u_color;

        varying vec2 v_position;

        void main(void) {
          float edgeSmoothness = 1.0;
          vec2 center = u_resolution / 2.0;
          vec2 positionAsIfTopRight = abs(v_position - center) + center;
          vec2 vecCircleCenterToPosition = positionAsIfTopRight - (u_resolution - vec2(u_radius, u_radius));
          float distanceFromCircleCenter = length(vecCircleCenterToPosition);
          bool isTopRightOfCircle = vecCircleCenterToPosition.x > 0.0 && vecCircleCenterToPosition.y > 0.0;
          float opacity = 1.0 - float(isTopRightOfCircle) * smoothstep(u_radius, u_radius + edgeSmoothness, distanceFromCircleCenter);
          gl_FragColor = vec4(u_color, 1.0) * opacity;
        }
        `
      );
      gl.compileShader(frag);
      const fragMessage = gl.getShaderInfoLog(frag);
      if (fragMessage !== null && fragMessage.length > 0) {
        throw new Error('Failed to compile fragment shader: ' + fragMessage);
      }

      const program = gl.createProgram();
      if (program === null) {
        throw new Error('Failed to create program');
      }
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);

      const positionBuffer = gl.createBuffer();
      if (positionBuffer === null) {
        throw new Error('Failed to create position buffer');
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

      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      if (resolutionLocation === null) {
        throw new Error('Failed to get resolution location');
      }

      const radiusLocation = gl.getUniformLocation(program, 'u_radius');
      if (radiusLocation === null) {
        throw new Error('Failed to get radius location');
      }

      const colorLocation = gl.getUniformLocation(program, 'u_color');
      if (colorLocation === null) {
        throw new Error('Failed to get color location');
      }

      return [
        {
          program,
          locs: {
            position: gl.getAttribLocation(program, 'a_position'),
            resolution: resolutionLocation,
            radius: radiusLocation,
            color: colorLocation,
          },
          buffers: {
            position: positionBuffer,
          },
        },
        () => {
          console.log('destroying gl', gl.contextId);
          gl.deleteBuffer(positionBuffer);
          gl.deleteProgram(program);
        },
      ];
    }

    /**
     * @param opacity 0-1
     * @param size in logical px
     * @param color as a 7-character hex string, e.g., #ff0000
     */
    function applyStyle(
      gl: ExpoWebGLRenderingContext,
      glState: OptionGlState,
      opacity: number,
      size: { width: number; outlineHeight: number; fillHeight: number },
      color: string
    ) {
      console.log('applying style');
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(glState.program);

      gl.enableVertexAttribArray(glState.locs.position);
      gl.bindBuffer(gl.ARRAY_BUFFER, glState.buffers.position);
      gl.vertexAttribPointer(glState.locs.position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(glState.locs.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(glState.locs.radius, (gl.drawingBufferWidth / outerWidth) * 10.0);

      const colorParts = getColor3fFromHex(color);
      gl.uniform3f(glState.locs.color, colorParts[0], colorParts[1], colorParts[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.flush();
      gl.endFrameEXP();
    }
  }, [infoRef, outerWidth, outerHeight]);

  const glViewStyle = useMemo(
    () => ({ width: outerWidth, height: outerHeight }),
    [outerWidth, outerHeight]
  );

  return <GLView style={glViewStyle} onContextCreate={onGlContextCreate} />;
};

type OptionGlState = {
  program: WebGLProgram;
  locs: {
    position: number;
    resolution: WebGLUniformLocation;
    radius: WebGLUniformLocation;
    color: WebGLUniformLocation;
  };
  buffers: {
    position: WebGLBuffer;
  };
};

/**
 * Converts the given 7-character color hex string, e.g., #ff0000, to a
 * 3-element array of floats, e.g., [1.0, 0.0, 0.0].
 * @param color The color hex string.
 * @returns The color as a 3-element array of floats, each from 0.0 to 1.0.
 */
function getColor3fFromHex(color: string): number[] {
  if (color.length !== 7) {
    throw new Error('Invalid color hex string: ' + color);
  }
  const r = parseInt(color.substring(1, 3), 16) / 255.0;
  const g = parseInt(color.substring(3, 5), 16) / 255.0;
  const b = parseInt(color.substring(5, 7), 16) / 255.0;
  return [r, g, b];
}
