/**
 * Draws a video the way a computer sees it: an ordered dither of square pixels. Dark space stays
 * empty; the suit and the Earth's limb fill in, and the brightest dots move from teal to light ink.
 */

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uVideo;
uniform vec2 uResolution;
uniform vec2 uVideoSize;
uniform float uDot;
uniform vec3 uInk;
uniform vec3 uAccent;
out vec4 outColor;

// Ordered (Bayer) dithering thresholds: an 8 x 8 pattern built from 2 x 2 steps.
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

// Cover-fit the video into the canvas, centred, like object-fit: cover.
vec2 videoUv(vec2 p) {
  float canvasAspect = uResolution.x / uResolution.y;
  float videoAspect = uVideoSize.x / uVideoSize.y;
  if (canvasAspect > videoAspect) p.y = (p.y - 0.5) * (videoAspect / canvasAspect) + 0.5;
  else p.x = (p.x - 0.5) * (canvasAspect / videoAspect) + 0.5;
  p.y = 1.0 - p.y;
  return p;
}

float luma(vec2 p) {
  return dot(texture(uVideo, videoUv(p)).rgb, vec3(0.299, 0.587, 0.114));
}

float level(vec2 p) {
  return smoothstep(0.2, 0.95, luma(p));
}

// Quieter behind the headline at the top centre and along the top edge under the floating bar,
// so the words and the logo stay readable. (y runs upward.)
float calm(vec2 p) {
  float d = length((p - vec2(0.5, 0.84)) * vec2(1.0, 2.2));
  float headline = mix(0.35, 1.0, smoothstep(0.18, 0.55, d));
  float bar = mix(1.0, 0.15, smoothstep(0.86, 0.96, p.y));
  return headline * bar;
}

void main() {
  vec2 dotCell = floor(gl_FragCoord.xy / uDot);
  vec2 dotCentre = (dotCell + 0.5) * uDot / uResolution;
  float dotLevel = level(dotCentre) * calm(dotCentre);
  float on = step(bayer8(dotCell) + 0.02, dotLevel);
  vec2 inDot = fract(gl_FragCoord.xy / uDot);
  float square = step(0.18, inDot.x) * step(0.18, inDot.y);
  float alpha = on * square * mix(0.45, 0.9, dotLevel);
  vec3 colour = mix(uAccent, uInk, smoothstep(0.55, 1.0, dotLevel));
  outColor = vec4(colour * alpha, alpha);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed to compile");
  }
  return shader;
}

/** Null until the value is a hex colour, such as while the stylesheet is still loading. */
function hexToRgb(value: string): [number, number, number] | null {
  const hex = value.trim().replace("#", "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export interface DitherRenderer {
  draw(): void;
  resize(): void;
  /** Returns false when a colour isn't available yet, so the caller can try again. */
  setColours(ink: string, accent: string): boolean;
  dispose(): void;
}

/** Returns null when WebGL2 is unavailable, so the caller can show the poster instead. */
export function createDitherRenderer(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  dotCss: () => number,
): DitherRenderer | null {
  const gl = canvas.getContext("webgl2", {
    premultipliedAlpha: true,
    alpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle that covers the whole canvas.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const makeTexture = (unit: number) => {
    const texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };
  const videoTexture = makeTexture(0);
  gl.uniform1i(uniform("uVideo"), 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniform("uResolution"), canvas.width, canvas.height);
      gl.uniform1f(uniform("uDot"), Math.max(2, Math.round(dotCss() * ratio)));
    },
    setColours(ink, accent) {
      const inkRgb = hexToRgb(ink);
      const accentRgb = hexToRgb(accent);
      if (!inkRgb || !accentRgb) return false;
      gl.uniform3fv(uniform("uInk"), inkRgb);
      gl.uniform3fv(uniform("uAccent"), accentRgb);
      return true;
    },
    draw() {
      if (video.readyState < 2) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.uniform2f(uniform("uVideoSize"), video.videoWidth, video.videoHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
