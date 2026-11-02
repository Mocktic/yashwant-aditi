// Plays the couple videos with a see-through background. Each MP4 holds the picture on its left
// half and the transparency on its right half (see tools/prepare_assets.py); one WebGL canvas
// combines them for whichever screen is showing. Without WebGL it returns null and the page
// keeps showing the stills.
const VERT = `attribute vec2 p; varying vec2 uv;
void main() { uv = vec2((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision mediump float; uniform sampler2D t; varying vec2 uv;
void main() {
  vec3 c = texture2D(t, vec2(uv.x * 0.5, uv.y)).rgb;
  float a = smoothstep(0.06, 0.94, texture2D(t, vec2(0.5 + uv.x * 0.5, uv.y)).r);
  gl_FragColor = vec4(c * a, a);
}`;

export function createAlphaVideo() {
  const canvas = document.createElement('canvas');
  canvas.className = 'couple__canvas';
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) {
    gl.texParameteri(gl.TEXTURE_2D, k, v);
  }

  let video = null;
  let onFirstFrame = null;

  function draw(v) {
    if (v !== video) return; // a newer video took over the canvas
    if (v.readyState >= 2 && v.videoWidth) {
      const w = v.videoWidth / 2, h = v.videoHeight;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (onFirstFrame) { onFirstFrame(); onFirstFrame = null; }
    }
    if (v.requestVideoFrameCallback && !v.paused) v.requestVideoFrameCallback(() => draw(v));
    else requestAnimationFrame(() => draw(v));
  }

  return {
    // show `v` inside `container`; `shown` runs once its first frame is on screen
    attach(v, container, shown) {
      video = v;
      onFirstFrame = shown;
      gl.clear(gl.COLOR_BUFFER_BIT);
      container.appendChild(canvas);
      draw(v);
    },
    detach() {
      video = null;
      onFirstFrame = null;
    },
  };
}
