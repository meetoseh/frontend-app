import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { apiFetch } from '../../shared/lib/apiFetch';
import { easeOut } from '../../shared/lib/Bezier';
import { BezierAnimation, calculateAnimValue, updateAnim } from '../../shared/lib/BezierAnimation';
import { kFormatter } from '../../shared/lib/kFormatter';
import { JourneyPromptProps } from '../models/JourneyPromptProps';
import { styles } from './JourneyPressPromptStyles';
import { JourneyPromptText } from './JourneyPromptText';

const titleButtonSpacing = 32;
const buttonSize = 210;
const buttonInfoSpacing = 32;

/**
 * Displays a press prompt for a user, where they can press (and hold) a button
 */
export const JourneyPressPrompt = ({
  prompt,
  stats,
  setHeight: setOuterHeight,
  loginContext,
  journeyUid,
  journeyJwt,
  sessionUid,
  journeyTime,
}: JourneyPromptProps): ReactElement => {
  if (prompt.style !== 'press') {
    throw new Error('Invalid prompt style');
  }

  const [titleHeight, setTitleHeight] = useState(0);
  const [infoHeight, setInfoHeight] = useState(0);
  const [pressing, setPressing] = useState(false);

  const height = useMemo(() => {
    if (titleHeight === 0 || infoHeight === 0) {
      return 0;
    }

    return titleHeight + titleButtonSpacing + buttonSize + buttonInfoSpacing + infoHeight;
  }, [titleHeight, infoHeight]);

  useEffect(() => {
    if (setOuterHeight) {
      setOuterHeight(height);
    }
  }, [height, setOuterHeight]);

  const containerStyle = useMemo(() => {
    if (height === 0) {
      return styles.container;
    }

    return Object.assign({}, styles.container, {
      height: height,
      maxHeight: height,
      minHeight: height,
      flexBase: height,
    });
  }, [height]);

  const pressButtonInfo = useRef<PressButtonInfo>();
  if (pressButtonInfo.current === undefined) {
    pressButtonInfo.current = {
      awaken: null,
      ripple: null,
    };
  }

  const getCurrentInfo = useCallback((): PressButtonInfo => {
    if (pressButtonInfo.current === undefined) {
      throw new Error('Unexpected undefined press button info');
    }
    return pressButtonInfo.current;
  }, []);

  useEffect(() => {
    const pressing = stats.pressActive ?? 0;
    const newRipple = pressing <= 10 ? null : pressing <= 100 ? 'weak' : 'strong';
    const info = getCurrentInfo();
    if (info.ripple !== newRipple) {
      info.ripple = newRipple;
      info.awaken?.();
    }
  }, [stats.pressActive, getCurrentInfo]);

  const onPressStartOrEnd = useCallback(
    async (start: boolean) => {
      if (loginContext.state !== 'logged-in') {
        console.log('not sending press event; not logged in');
        return;
      }

      try {
        const response = await apiFetch(
          `/api/1/journeys/events/respond_press_prompt/${start ? 'start' : 'end'}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              journey_uid: journeyUid,
              journey_jwt: journeyJwt,
              session_uid: sessionUid,
              journey_time: journeyTime.time.current / 1000,
              data: {},
            }),
          },
          loginContext
        );

        if (!response.ok) {
          throw response;
        }
      } catch (e) {
        if (e instanceof TypeError) {
          console.error('failed to send press event; could not connect to server:', e);
        } else if (e instanceof Response) {
          const data = await e.json();
          console.error('failed to send press event; server rejected request:', data);
        } else {
          console.error('failed to send press event; unknown error:', e);
        }
      }
    },
    [journeyUid, journeyJwt, sessionUid, journeyTime.time, loginContext]
  );

  const onPressIn = useCallback(() => {
    if (pressing) {
      return;
    }
    setPressing(true);
    onPressStartOrEnd(true);
  }, [onPressStartOrEnd, pressing]);
  const onPressOut = useCallback(() => {
    if (!pressing) {
      return;
    }
    setPressing(false);
    onPressStartOrEnd(false);
  }, [onPressStartOrEnd, pressing]);

  const onInfoLayout = useCallback((event: LayoutChangeEvent) => {
    if (!event.nativeEvent || event.nativeEvent.layout.height <= 0) {
      setInfoHeight(styles.info.fontSize);
      return;
    }

    setInfoHeight(event.nativeEvent.layout.height);
  }, []);

  const infoText = useMemo(() => {
    if (stats.pressActive === null || stats.press === null) {
      return null;
    }

    if (pressing) {
      if (stats.pressActive <= 1) {
        return 'You are resonating.';
      }

      if (stats.pressActive === 2) {
        return '1 person is resonating with you.';
      }
      return `${kFormatter(stats.pressActive - 1)} people are resonating with you.`;
    }

    if (stats.press === 1) {
      return `${stats.press} person has resonated.`;
    }

    return `${kFormatter(stats.press)} people have resonated.`;
  }, [stats.pressActive, stats.press, pressing]);

  return (
    <View style={containerStyle}>
      <JourneyPromptText text={prompt.text} setHeight={setTitleHeight} />
      <PressButton
        size={buttonSize}
        getCurrentInfo={getCurrentInfo}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      />
      <Text style={styles.info} onLayout={onInfoLayout}>
        {infoText}
      </Text>
    </View>
  );
};

type PressButtonInfo = {
  /**
   * Set by the component, this is a reference to the function that can be
   * called to ensure animations are running. Fields which are set by the
   * parent component must call this function after they are set.
   */
  awaken: (() => void) | null;

  /**
   * The ripple animation to use. If null, no ripple animation is used.
   * Set by the parent component; after being set, the awaken function
   * must be called.
   */
  ripple: 'weak' | 'strong' | null;
};

type PressButtonProps = {
  /**
   * The size of the container for the button in logical pixels. The button
   * is always a square in terms of its size. The button is centered, and there
   * is padding within the container to allow for certain animations.
   */
  size: number;

  /**
   * The function to call when the button starts being pressed. The button
   * animation updates automatically.
   */
  onPressIn: () => void;

  /**
   * The function to call when the button stops being pressed. The button
   * animation updates automatically.
   */
  onPressOut: () => void;

  /**
   * A function which returns a PressButtonInfo which will be mutated by
   * the component to keep it up to date. The function is only called once
   * unless it is changed, and changing it causes an expensive re-render.
   * Hence this should usually return the current value of a ref.
   */
  getCurrentInfo: () => PressButtonInfo;
};

/**
 * A button that can be pressed and held in a particularly juicy way. The
 * ripple animation should be configured based on how many users are
 * pressing the button, or some other similar metric.
 */
const PressButton = ({
  size,
  getCurrentInfo,
  onPressIn: onOuterPressIn,
  onPressOut: onOuterPressOut,
}: PressButtonProps): ReactElement => {
  const glContextRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const pressingRef = useRef(false);
  const awakenRef = useRef<(() => void) | null>(null);

  const onGlContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glContextRef.current = gl;
    awakenRef.current?.();
  }, []);

  const onPressIn = useCallback(() => {
    pressingRef.current = true;
    awakenRef.current?.();
    onOuterPressIn();
  }, [onOuterPressIn]);

  const onPressOut = useCallback(() => {
    pressingRef.current = false;
    awakenRef.current?.();
    onOuterPressOut();
  }, [onOuterPressOut]);

  const sizeStyle = useMemo(
    () => ({
      width: size,
      height: size,
    }),
    [size]
  );

  useEffect(() => {
    const info = getCurrentInfo();
    awakenRef.current = awaken;
    info.awaken = awaken;
    let mounted = true;
    let awake = true;
    let handlingGl: {
      gl: ExpoWebGLRenderingContext;
      state: PressButtonGlState;
      bufferWidth: number;
      bufferHeight: number;
      destroy: () => void;
    } | null = null;
    let colorGraynessAnim: BezierAnimation | null = null;
    let colorGrayness = 1.0;

    requestAnimationFrame(animate);
    return () => {
      if (!mounted) {
        return;
      }

      mounted = false;
      if (handlingGl !== null) {
        handlingGl.destroy();
        handlingGl = null;
      }
      info.awaken = null;
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

      colorGraynessAnim = updateAnim({
        now,
        current: colorGrayness,
        target: pressingRef.current ? 0.8 : 1.0,
        oldAnim: colorGraynessAnim,
        duration: 350,
        ease: easeOut,
      });

      if (colorGraynessAnim !== null) {
        colorGrayness = calculateAnimValue(colorGraynessAnim, now);
      }

      applyStyle(
        gl,
        handlingGl.state,
        [colorGrayness, colorGrayness, colorGrayness],
        (now / 1000.0) % 1.0,
        info.ripple === 'weak' ? 0.5 : info.ripple === 'strong' ? 1.0 : 0.0
      );

      if (colorGraynessAnim === null && info.ripple === null) {
        onGoingToSleep();
      } else {
        requestAnimationFrame(animate);
      }
    }

    function initializeGl(gl: WebGLRenderingContext): [PressButtonGlState, () => void] {
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
        #define PI 3.1415926538
        #define RIPPLE_FREQUENCY 8.0
        #define EDGE_SMOOTHNESS 2.0

        uniform vec2 u_resolution;
        uniform float u_outerRadius;
        uniform float u_innerRadius;
        uniform vec3 u_color;
        uniform float u_rippleIntensity;
        uniform float u_rippleTime;

        varying vec2 v_position;

        vec4 getTwoCircleButtonColor() {
          vec2 center = u_resolution * 0.5;
          float distance = length(v_position - center);
          bool inInner = distance < u_innerRadius;
          float opacity = (
            float(!inInner) * 0.4 * (1.0 - smoothstep(u_outerRadius - EDGE_SMOOTHNESS, u_outerRadius, distance))
            + float(inInner) * (1.0 - 0.6 * smoothstep(u_innerRadius - EDGE_SMOOTHNESS, u_innerRadius, distance))
          );

          return vec4(u_color, 1.0) * opacity;
        }

        vec4 getRippleColor() {
          vec2 center = u_resolution * 0.5;
          float distance = length(v_position - center);
          float distancePercentOfMax = distance / u_outerRadius;
          float preventRipplesOnCircleComponent = float(distance >= u_outerRadius);
          float distanceComponent = sin(distancePercentOfMax * PI * 2.0 * RIPPLE_FREQUENCY - u_rippleTime * PI * 2.0);
          float preventPartialRipplesComponent = 1.0 - smoothstep(u_outerRadius, u_resolution.x / 2.0, distance);

          float opacity = (
            preventRipplesOnCircleComponent 
            * preventPartialRipplesComponent
            * u_rippleIntensity 
            * distanceComponent
          );
          return vec4(u_color, 1.0) * opacity * 0.4;
        }

        void main(void) {
          vec4 button = getTwoCircleButtonColor();
          vec4 ripple = getRippleColor();

          // ripple on top of the button
          gl_FragColor = vec4(
            (1.0 - ripple.a) * button.rgb + ripple.rgb,
            1.0 - (1.0 - button.a) * (1.0 - ripple.a)
          );
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

      const outerRadiusLocation = gl.getUniformLocation(program, 'u_outerRadius');
      if (outerRadiusLocation === null) {
        throw new Error('Failed to get u_outerRadius location');
      }

      const innerRadiusLocation = gl.getUniformLocation(program, 'u_innerRadius');
      if (innerRadiusLocation === null) {
        throw new Error('Failed to get u_innerRadius location');
      }

      const colorLocation = gl.getUniformLocation(program, 'u_color');
      if (colorLocation === null) {
        throw new Error('Failed to get u_color location');
      }

      const rippleIntensityLocation = gl.getUniformLocation(program, 'u_rippleIntensity');
      if (rippleIntensityLocation === null) {
        throw new Error('Failed to get u_rippleIntensity location');
      }

      const rippleTimeLocation = gl.getUniformLocation(program, 'u_rippleTime');
      if (rippleTimeLocation === null) {
        throw new Error('Failed to get u_rippleTime location');
      }

      return [
        {
          program,
          locs: {
            position: gl.getAttribLocation(program, 'a_position'),
            resolution: resolutionLocation,
            outerRadius: outerRadiusLocation,
            innerRadius: innerRadiusLocation,
            color: colorLocation,
            rippleIntensity: rippleIntensityLocation,
            rippleTime: rippleTimeLocation,
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

    function applyStyle(
      gl: ExpoWebGLRenderingContext,
      glState: PressButtonGlState,
      color: number[],
      rippleTime: number,
      rippleIntensity: number
    ) {
      const dpi = gl.drawingBufferWidth / size;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(glState.program);

      gl.enableVertexAttribArray(glState.locs.position);
      gl.bindBuffer(gl.ARRAY_BUFFER, glState.buffers.position);
      gl.vertexAttribPointer(glState.locs.position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(glState.locs.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(glState.locs.outerRadius, Math.floor(size / 2 - 30) * dpi);
      gl.uniform1f(glState.locs.innerRadius, Math.floor((size / 2 - 30) * 0.5) * dpi);
      gl.uniform3f(glState.locs.color, color[0], color[1], color[2]);
      gl.uniform1f(glState.locs.rippleIntensity, rippleIntensity);
      gl.uniform1f(glState.locs.rippleTime, rippleTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.flush();
      gl.endFrameEXP();
    }
  }, [getCurrentInfo, size]);

  return (
    <Pressable style={sizeStyle} onPressIn={onPressIn} onPressOut={onPressOut}>
      <GLView style={sizeStyle} onContextCreate={onGlContextCreate} />
    </Pressable>
  );
};

type PressButtonGlState = {
  program: WebGLProgram;
  locs: {
    position: number;
    resolution: WebGLUniformLocation;
    outerRadius: WebGLUniformLocation;
    innerRadius: WebGLUniformLocation;
    color: WebGLUniformLocation;
    rippleIntensity: WebGLUniformLocation;
    rippleTime: WebGLUniformLocation;
  };
  buffers: {
    position: WebGLBuffer;
  };
};
