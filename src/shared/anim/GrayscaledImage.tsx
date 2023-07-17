import { useMappedValuesWithCallbacks } from "../hooks/useMappedValuesWithCallbacks";
import { useReactManagedValueAsValueWithCallbacks } from "../hooks/useReactManagedValueAsValueWithCallbacks";
import {
  SinglePassWebGLComponent,
  SinglePassWebGLComponentRenderer,
} from "./SinglePassWebGLComponent";
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from "./VariableStrategyProps";

type GrayscaleProps = {
  strength: VariableStrategyProps<number>;
  width: number;
  height: number;
  imageUri: string;
};

type Attributes = "position";
type Uniforms = "strength" | "imageSampler";
type Buffers = "position";
type Textures = "image";
type GrayscaledImageState = {
  imageUri: string;
  strength: number;
};

const GrayscaledImageRenderer: SinglePassWebGLComponentRenderer<
  Attributes,
  Uniforms,
  Buffers,
  Textures,
  GrayscaledImageState
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

        varying vec2 v_texcoord;
  
        void main(void) {
          gl_Position = vec4(a_position * 2.0 - 1.0, 0.0, 1.0);
          v_texcoord = a_position;
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
        
        uniform sampler2D u_image;
        uniform float u_strength;

        varying vec2 v_texcoord;
  
        void main(void) {
            vec4 imgColorNotPremultiplied = texture2D(u_image, v_texcoord);
            float avg = (
              imgColorNotPremultiplied.r + 
              imgColorNotPremultiplied.g + 
              imgColorNotPremultiplied.b
            ) / 3.0;
            gl_FragColor = vec4(
              mix(
                imgColorNotPremultiplied.rgb, 
                vec3(avg, avg, avg), 
                u_strength
              ), 
              1.0
            ) * imgColorNotPremultiplied.a;
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
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW
    );

    const strengthLocation = gl.getUniformLocation(program, "u_strength");
    if (strengthLocation === null) {
      throw new Error("Failed to get strength location");
    }

    gl.activeTexture(gl.TEXTURE0);
    const imageTexture = gl.createTexture();
    if (imageTexture === null) {
      throw new Error("Failed to create image texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, {
      localUri: props.imageUri,
    } as any);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const imageSamplerLocation = gl.getUniformLocation(program, "u_image");
    if (imageSamplerLocation === null) {
      throw new Error("Failed to get image sampler location");
    }

    return {
      gl,
      program,
      attributes: {
        position: gl.getAttribLocation(program, "a_position"),
      },
      uniforms: {
        strength: strengthLocation,
        imageSampler: imageSamplerLocation,
      },
      buffers: {
        position: positionBuffer,
      },
      textures: {
        image: { unit: 0, val: imageTexture },
      },
      dispose: () => {
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
      },
    };
  },
  render: (state, props, dpi) => {
    const gl = state.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(state.program);

    gl.enableVertexAttribArray(state.attributes.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.position);
    gl.vertexAttribPointer(state.attributes.position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(state.uniforms.strength, props.strength);
    gl.uniform1i(state.uniforms.imageSampler, state.textures.image.unit);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(state.attributes.position);
    gl.flush();
    gl.endFrameEXP();
  },
};

/**
 * Applies a grayscale filter of the given strength to the image specified
 * by the given url. This renders the image at a fixed width and height.
 * When combined with ViewShot from react-native-view-shot, this can be used
 * in the same way as filter: grayscale in css: see GrayscaledView.
 *
 * This does not automatically ease the strength; it is up to the caller to
 * animate the strength if desired.
 */
export const GrayscaledImage = ({
  strength,
  width,
  height,
  imageUri,
}: GrayscaleProps) => {
  const strengthVWC = useVariableStrategyPropsAsValueWithCallbacks(strength);
  const imageUriVWC = useReactManagedValueAsValueWithCallbacks(imageUri);
  const propsVWC = useMappedValuesWithCallbacks(
    [strengthVWC, imageUriVWC],
    () => ({ strength: strengthVWC.get(), imageUri: imageUriVWC.get() }),
    {
      outputEqualityFn: (a, b) =>
        a.strength === b.strength && a.imageUri === b.imageUri,
    }
  );

  const size = useReactManagedValueAsValueWithCallbacks(
    { width, height },
    (a, b) => a.width === b.width && a.height === b.height
  );

  return (
    <SinglePassWebGLComponent
      renderer={GrayscaledImageRenderer}
      props={propsVWC.get}
      propsChanged={propsVWC.callbacks}
      size={size.get}
      sizeChanged={size.callbacks}
    />
  );
};
