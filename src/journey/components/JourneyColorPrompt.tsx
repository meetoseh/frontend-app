import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { JourneyPromptProps } from '../models/JourneyPromptProps';
import { styles } from './JourneyColorPromptStyles';
import { JourneyPromptText } from './JourneyPromptText';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { easeInOut, easeOut } from '../../shared/lib/Bezier';
import { JourneyStats } from '../hooks/useStats';
import { apiFetch } from '../../shared/lib/apiFetch';
import {
  BezierAnimation,
  calculateAnimValue,
  getColor3fFromHex,
  updateAnim,
} from '../../shared/lib/BezierAnimation';

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

const OPACITY_NOT_ACTIVE = 0.4;
const OPACITY_ACTIVE = 1.0;

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
  journeyUid,
  journeyJwt,
  sessionUid,
}: JourneyPromptProps): ReactElement => {
  if (prompt.style !== 'color') {
    throw new Error('Invalid prompt style');
  }

  const [titleHeight, setTitleHeight] = useState(0);
  const screenSize = useScreenSize();

  const activeOptionIndexRef = useRef<number | null>(null);
  const fakingMoveRef = useRef<FakedMove | null>(null);

  const statsRef = useRef<JourneyStats>(stats);
  statsRef.current = stats;

  const loginContextRef = useRef(loginContext);
  loginContextRef.current = loginContext;

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
  }, [rowOptions, rowHeight]);

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

  const onColorPressed = useCallback(
    (idx: number) => {
      const oldIdx = activeOptionIndexRef.current;
      if (oldIdx === idx) {
        return;
      }

      if (oldIdx !== null) {
        const oldInfo = optionInfoRefs.current[oldIdx];
        oldInfo.opacity = OPACITY_NOT_ACTIVE;
        oldInfo.awaken?.();
      }
      const newInfo = optionInfoRefs.current[idx];
      newInfo.opacity = OPACITY_ACTIVE;
      newInfo.awaken?.();
      activeOptionIndexRef.current = idx;
      fakingMoveRef.current = {
        fromIndex: oldIdx,
        toIndex: idx,
        fakeEndsAt: journeyTime.time.current + 1500,
        cancelFakeToMin: ((statsRef.current.colorActive ?? [])[idx] ?? 0) + 1,
      };

      if (loginContextRef.current.state === 'logged-in') {
        apiFetch(
          '/api/1/journeys/events/respond_color_prompt',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              journey_uid: journeyUid,
              journey_jwt: journeyJwt,
              session_uid: sessionUid,
              journey_time: journeyTime.time.current / 1000,
              data: {
                index: idx,
              },
            }),
          },
          loginContextRef.current
        )
          .then((r) => {
            if (!r.ok) {
              console.error('Failed to send color prompt response', r.status, r.statusText);
              r.text().then((t) => console.error(t));
            }
          })
          .catch((e) => {
            console.error('Failed to send color prompt response', e);
          });
      }
    },
    [journeyTime.time, journeyUid, journeyJwt, sessionUid]
  );
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
      opacity: 0.4,
      awaken: null,
    }));
  }

  const boundGetOptionInfo = useMemo<(() => OptionInfo)[]>(() => {
    return prompt.colors.map((col, idx) => () => optionInfoRefs.current[idx]);
  }, [prompt.colors]);

  useEffect(() => {
    let mounted = true;
    requestAnimationFrame(animateStats);
    return () => {
      mounted = false;
    };

    function animateStats() {
      if (!mounted) {
        return;
      }

      const colorActive = statsRef.current.colorActive;
      if (colorActive === null) {
        requestAnimationFrame(animateStats);
        return;
      }
      const journeyNow = journeyTime.time.current;

      if (
        fakingMoveRef.current !== null &&
        (fakingMoveRef.current.fakeEndsAt <= journeyNow ||
          (colorActive[fakingMoveRef.current.toIndex] ?? 0) >=
            fakingMoveRef.current.cancelFakeToMin)
      ) {
        fakingMoveRef.current = null;
      }

      const effectiveColorActive =
        fakingMoveRef.current !== null
          ? (() => {
              const move = fakingMoveRef.current;
              if (move === null) {
                return colorActive;
              }

              const res = colorActive.slice();
              if (move.fromIndex !== null) {
                res[move.fromIndex] = Math.max((res[move.fromIndex] ?? 0) - 1, 0);
              }
              res[move.toIndex] = Math.max((res[move.toIndex] ?? 0) + 1, 0);
              return res;
            })()
          : colorActive;

      const total = effectiveColorActive.reduce((acc, cur) => acc + cur, 0);
      const targetHeights = effectiveColorActive.map((num) => {
        if (total === 0) {
          return 0;
        }
        return (num / total) * rowHeight;
      });

      for (let idx = 0; idx < optionInfoRefs.current.length && idx < targetHeights.length; idx++) {
        const info = optionInfoRefs.current[idx];
        const targetHeight = targetHeights[idx];
        if (info.height !== targetHeight) {
          info.height = targetHeight;
          info.awaken?.();
        }
      }
      requestAnimationFrame(animateStats);
    }
  }, [rowHeight, journeyTime.time]);

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
   * The color for the background when active. Must be specified as
   * a 7-character hex string, including the leading '#', e.g. '#ff0000'.
   */
  color: string;
  /**
   * The opacity to render at, 0-1, based on if the option is active.
   * This is the target value; the rendered value is interpolated.
   * After changing this value, awaken() should be called to animate
   * the change.
   */
  opacity: number;
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

const opacityAnimationDuration = 350;
const heightAnimationDuration = 350;
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
    let renderedOpacity: number = info.opacity;
    let renderedHeight: number = info.height;
    let opacityAnim: BezierAnimation | null = null;
    let heightAnim: BezierAnimation | null = null;

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
      if (awake || !mounted) {
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

    function animate(now: DOMHighResTimeStamp) {
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

      opacityAnim = updateAnim({
        now,
        current: renderedOpacity,
        target: info.opacity,
        oldAnim: opacityAnim,
        duration: opacityAnimationDuration,
        ease: easeInOut,
      });
      heightAnim = updateAnim({
        now,
        current: renderedHeight,
        target: info.height,
        oldAnim: heightAnim,
        duration: heightAnimationDuration,
        ease: easeOut,
      });

      renderedOpacity = opacityAnim !== null ? calculateAnimValue(opacityAnim, now) : info.opacity;
      renderedHeight = heightAnim !== null ? calculateAnimValue(heightAnim, now) : info.height;
      applyStyle(
        gl,
        handlingGl.state,
        renderedOpacity,
        {
          fillHeight: renderedHeight,
        },
        info.color
      );

      if (opacityAnim === null && heightAnim === null) {
        onGoingToSleep();
      } else {
        requestAnimationFrame(animate);
      }
    }

    function initializeGl(gl: ExpoWebGLRenderingContext): [OptionGlState, () => void] {
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
        uniform float u_thickness;
        uniform float u_fillHeight;
        uniform vec4 u_color;

        varying vec2 v_position;

        void main(void) {
          float edgeSmoothness = 1.0;
          vec2 center = u_resolution / 2.0;
          vec2 positionAsIfTopRight = abs(v_position - center) + center;
          vec2 vecCircleCenterToPosition = positionAsIfTopRight - (u_resolution - vec2(u_radius, u_radius));
          float distanceFromCircleCenter = length(vecCircleCenterToPosition);
          bool isTopRightOfCircle = vecCircleCenterToPosition.x > 0.0 && vecCircleCenterToPosition.y > 0.0;
          bool isBottomLeftOfCircle = vecCircleCenterToPosition.x < 0.0 && vecCircleCenterToPosition.y < 0.0;
          bool isTopLeftOfCircle = vecCircleCenterToPosition.x < 0.0 && vecCircleCenterToPosition.y > 0.0;
          bool isBottomRightOfCircle = vecCircleCenterToPosition.x > 0.0 && vecCircleCenterToPosition.y < 0.0;
          bool isInFill = v_position.y < u_fillHeight;
          float opacity = (
            1.0 
            // outer edge of circle
            - float(isTopRightOfCircle) * smoothstep(u_radius, u_radius + edgeSmoothness, distanceFromCircleCenter)
            // inner edge of circle
            - float(isTopRightOfCircle) * float(!isInFill) * (1.0 - smoothstep(u_radius - u_thickness - edgeSmoothness, u_radius - u_thickness, distanceFromCircleCenter))
            // bottom left is always not visible
            - float(isBottomLeftOfCircle) * float(!isInFill)
            // top left uses border thickness relative to the top
            - float(isTopLeftOfCircle) * float(!isInFill) * (1.0 - smoothstep(u_resolution.y - u_thickness - edgeSmoothness, u_resolution.y - u_thickness, positionAsIfTopRight.y))
            // bottom right uses border thickness relative to the right
            - float(isBottomRightOfCircle) * float(!isInFill) * (1.0 - smoothstep(u_resolution.x - u_thickness - edgeSmoothness, u_resolution.x - u_thickness, positionAsIfTopRight.x))
          );
          gl_FragColor = vec4(u_color.xyz, 1.0) * opacity * u_color.a;
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

      const thicknessLocation = gl.getUniformLocation(program, 'u_thickness');
      if (thicknessLocation === null) {
        throw new Error('Failed to get thickness location');
      }

      const fillHeightLocation = gl.getUniformLocation(program, 'u_fillHeight');
      if (fillHeightLocation === null) {
        throw new Error('Failed to get fillHeight location');
      }

      return [
        {
          program,
          locs: {
            position: gl.getAttribLocation(program, 'a_position'),
            resolution: resolutionLocation,
            radius: radiusLocation,
            color: colorLocation,
            thickness: thicknessLocation,
            fillHeight: fillHeightLocation,
          },
          buffers: {
            position: positionBuffer,
          },
        },
        () => {
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
      size: { fillHeight: number },
      color: string
    ) {
      const dpi = gl.drawingBufferWidth / outerWidth;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(glState.program);

      gl.enableVertexAttribArray(glState.locs.position);
      gl.bindBuffer(gl.ARRAY_BUFFER, glState.buffers.position);
      gl.vertexAttribPointer(glState.locs.position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(glState.locs.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(glState.locs.radius, dpi * 10.0);
      gl.uniform1f(glState.locs.thickness, dpi * 2.0);
      gl.uniform1f(glState.locs.fillHeight, dpi * size.fillHeight);

      const colorParts = getColor3fFromHex(color);
      gl.uniform4f(glState.locs.color, colorParts[0], colorParts[1], colorParts[2], opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.flush();
      gl.endFrameEXP();
    }
  }, [infoRef, outerWidth, outerHeight]);

  const sizeStyle = useMemo(
    () => ({ width: outerWidth, height: outerHeight }),
    [outerWidth, outerHeight]
  );

  const onPress = useCallback(() => {
    const info = infoRef();
    if (info.onPress) {
      info.onPress();
    }
  }, [infoRef]);

  return (
    <Pressable style={sizeStyle} onPress={onPress}>
      <GLView style={sizeStyle} onContextCreate={onGlContextCreate} />
    </Pressable>
  );
};

type OptionGlState = {
  program: WebGLProgram;
  locs: {
    position: number;
    resolution: WebGLUniformLocation;
    radius: WebGLUniformLocation;
    color: WebGLUniformLocation;
    thickness: WebGLUniformLocation;
    fillHeight: WebGLUniformLocation;
  };
  buffers: {
    position: WebGLBuffer;
  };
};

type FakedMove = {
  fromIndex: number | null;
  toIndex: number;

  fakeEndsAt: DOMHighResTimeStamp;
  cancelFakeToMin: number;
};
