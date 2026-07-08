/* BLØB.haus — GPU neural-cellular-automaton engine.
   The local rule runs in a fragment shader, every cell in parallel.
   Shared by the full player page and the homepage tamagotchi. */

export type Meta = {
  C: number;
  IN: number;
  HID: number;
  COND: number;
  SIZE: number;
  N: number;
  classes: string[];
  fire_rate: number;
  use_axons?: boolean;
};

type NumArray = number[] | Float32Array;

export type WeightsJson = {
  meta: Meta;
  w1: NumArray;
  w2: NumArray;
  b1: NumArray;
  b2: NumArray;
  embed: NumArray;
};

/* uint16-quantized weights (nca_weights.q16.json): 8× smaller on the wire,
   max reconstruction error ~3e-5 — lossless in practice */
export type QuantizedWeights = {
  meta: Meta;
  q: 16;
  arrays: Record<
    "w1" | "w2" | "b1" | "b2" | "embed",
    { lo: number; hi: number; n: number; b64: string }
  >;
};

function dequantizeArray(a: {
  lo: number;
  hi: number;
  n: number;
  b64: string;
}): Float32Array {
  const bin = atob(a.b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const u16 = new Uint16Array(bytes.buffer, 0, a.n);
  const out = new Float32Array(a.n);
  const span = (a.hi - a.lo) / 65535;
  for (let i = 0; i < a.n; i++) out[i] = a.lo + u16[i] * span;
  return out;
}

export function normalizeWeights(
  data: WeightsJson | QuantizedWeights,
): WeightsJson {
  if ((data as QuantizedWeights).q === 16) {
    const q = data as QuantizedWeights;
    return {
      meta: q.meta,
      w1: dequantizeArray(q.arrays.w1),
      w2: dequantizeArray(q.arrays.w2),
      b1: dequantizeArray(q.arrays.b1),
      b2: dequantizeArray(q.arrays.b2),
      embed: dequantizeArray(q.arrays.embed),
    };
  }
  return data as WeightsJson;
}

/* quantized first, raw as fallback */
export async function fetchWeights(): Promise<WeightsJson | null> {
  for (const url of ["/nca_weights.q16.json", "/nca_weights.json"]) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      return normalizeWeights(await r.json());
    } catch {}
  }
  return null;
}

export type Params = {
  A: number;
  B: number;
  t: number;
  fire: number;
  speed: number;
  /** run the sim every Nth animation frame (1 = every frame) */
  stepEvery: number;
};

export type LoadOpts = {
  /** run the trained local rule on a larger world than it was trained on —
      NCAs are translation-invariant, so this Just Works */
  gridSize?: number;
  /** number of initial life seeds (1 = single center seed) */
  seeds?: number;
  /** canvas pixels per cell (default: auto ~560px) */
  canvasScale?: number;
  /** background color for dead cells, "#rrggbb" (default white) */
  background?: string;
};

export type Player = {
  loadModel: (data: WeightsJson, o?: LoadOpts) => Meta | null;
  setPlaying: (v: boolean) => void;
  seed: () => void;
  damageCenter: () => void;
  /** wound the substrate at grid coords (cells), custom radius in cells */
  damageAtCell: (x: number, y: number, r?: number) => void;
  poke: (clientX: number, clientY: number) => void;
  params: Params;
  destroy: () => void;
};

export function createPlayer(
  cv: HTMLCanvasElement,
  onErr: (t: string) => void,
  onStat: (t: string) => void,
  opts?: { preserveDrawingBuffer?: boolean },
): Player | null {
  const gl = cv.getContext("webgl2", {
    antialias: false,
    // hosts that mirror this canvas elsewhere (e.g. into a Phaser texture)
    // need the buffer to survive past the frame
    preserveDrawingBuffer: opts?.preserveDrawingBuffer ?? false,
  });
  if (!gl) {
    onErr("WebGL2 is not available in this browser.");
    return null;
  }
  if (!gl.getExtension("EXT_color_buffer_float")) {
    onErr(
      "EXT_color_buffer_float not supported — cannot render to float textures on this GPU.",
    );
    return null;
  }

  let M: Meta | null = null;
  let GS = 0; // simulation grid size (may exceed the trained SIZE)
  let seedCount = 1;
  let readIdx = 0;
  let playing = false;
  let raf = 0;
  let frameCount = 0;
  const texSets: (WebGLTexture[] | null)[] = [null, null];
  const fbos: (WebGLFramebuffer | null)[] = [null, null];
  const wtex: Record<string, WebGLTexture> = {};
  let quadVAO: WebGLVertexArrayObject | null = null;
  const prog: Record<string, any> = {};
  const params: Params = {
    A: 0,
    B: 0,
    t: 0,
    fire: 0.5,
    speed: 4,
    stepEvery: 1,
  };

  function compile(type: number, src: string) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(s);
      onErr("Shader compile error:\n" + log);
      throw new Error(log ?? "compile");
    }
    return s;
  }

  function program(vsSrc: string, fsSrc: string) {
    const p = gl!.createProgram()!;
    gl!.attachShader(p, compile(gl!.VERTEX_SHADER, vsSrc));
    gl!.attachShader(p, compile(gl!.FRAGMENT_SHADER, fsSrc));
    gl!.linkProgram(p);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
      onErr("Link error:\n" + gl!.getProgramInfoLog(p));
      throw new Error("link");
    }
    return p;
  }

  function stateTex(W: number, H: number, data: Float32Array | null) {
    const t = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.RGBA32F,
      W,
      H,
      0,
      gl!.RGBA,
      gl!.FLOAT,
      data,
    );
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return t;
  }

  function weightTex(W: number, H: number, arr: NumArray) {
    const t = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.R32F,
      W,
      H,
      0,
      gl!.RED,
      gl!.FLOAT,
      new Float32Array(arr),
    );
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return t;
  }

  function makeFBO(texs: WebGLTexture[]) {
    const fb = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fb);
    for (let i = 0; i < 4; i++)
      gl!.framebufferTexture2D(
        gl!.FRAMEBUFFER,
        gl!.COLOR_ATTACHMENT0 + i,
        gl!.TEXTURE_2D,
        texs[i],
        0,
      );
    gl!.drawBuffers([
      gl!.COLOR_ATTACHMENT0,
      gl!.COLOR_ATTACHMENT1,
      gl!.COLOR_ATTACHMENT2,
      gl!.COLOR_ATTACHMENT3,
    ]);
    const st = gl!.checkFramebufferStatus(gl!.FRAMEBUFFER);
    if (st !== gl!.FRAMEBUFFER_COMPLETE)
      onErr("Framebuffer incomplete: 0x" + st.toString(16));
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    return fb;
  }

  function makeQuad() {
    const vao = gl!.createVertexArray()!;
    gl!.bindVertexArray(vao);
    const vbo = gl!.createBuffer()!;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, vbo);
    gl!.bufferData(
      gl!.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl!.STATIC_DRAW,
    );
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
    gl!.bindVertexArray(null);
    return vao;
  }

  const VS = `#version 300 es
layout(location=0) in vec2 pos;
out vec2 uv;
void main(){ uv = pos*0.5+0.5; gl_Position = vec4(pos,0.0,1.0); }`;

  function updateFS(m: Meta, W: number) {
    const { IN, HID, COND } = m;
    const base = 3 * m.C;
    const condFill = Array.from(
      { length: COND },
      (_, k) =>
        `  inp[${base + k}] = mix(texelFetch(embt, ivec2(${k}, A),0).r, texelFetch(embt, ivec2(${k}, B),0).r, t);`,
    ).join("\n");
    const w2line = (g: number) =>
      `h*vec4(texelFetch(w2t,ivec2(o,${4 * g}),0).r,texelFetch(w2t,ivec2(o,${4 * g + 1}),0).r,texelFetch(w2t,ivec2(o,${4 * g + 2}),0).r,texelFetch(w2t,ivec2(o,${4 * g + 3}),0).r)`;
    const b2v = (g: number) =>
      `vec4(texelFetch(b2t,ivec2(${4 * g},0),0).r,texelFetch(b2t,ivec2(${4 * g + 1},0),0).r,texelFetch(b2t,ivec2(${4 * g + 2},0),0).r,texelFetch(b2t,ivec2(${4 * g + 3},0),0).r)`;
    return `#version 300 es
precision highp float; precision highp int;
uniform sampler2D s0,s1,s2,s3;
uniform sampler2D w1t,w2t,b1t,b2t,embt;
uniform int A,B;
uniform float t, fire, rndseed;
layout(location=0) out vec4 O0;
layout(location=1) out vec4 O1;
layout(location=2) out vec4 O2;
layout(location=3) out vec4 O3;
const int W=${W};
const int H=${W};
const int IN=${IN};
const int HID=${HID};
float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec4 a[9]; vec4 b[9]; vec4 c[9]; vec4 d[9];
  for (int dy=-1; dy<=1; dy++){
    for (int dx=-1; dx<=1; dx++){
      int j = (dy+1)*3 + (dx+1);
      ivec2 q = p + ivec2(dx,dy);
      if (q.x<0 || q.x>=W || q.y<0 || q.y>=H){ a[j]=vec4(0.0); b[j]=vec4(0.0); c[j]=vec4(0.0); d[j]=vec4(0.0); }
      else { a[j]=texelFetch(s0,q,0); b[j]=texelFetch(s1,q,0); c[j]=texelFetch(s2,q,0); d[j]=texelFetch(s3,q,0); }
    }
  }
  float mx = 0.0;
  for (int j=0;j<9;j++) mx = max(mx, a[j].a);
  float life = mx > 0.1 ? 1.0 : 0.0;

  float inp[IN];
  vec4 sx, sy, id;
  sx=(-(a[0])-2.0*a[3]-a[6]+a[2]+2.0*a[5]+a[8])*0.125; sy=(-(a[0])-2.0*a[1]-a[2]+a[6]+2.0*a[7]+a[8])*0.125; id=a[4];
  inp[0]=id.x; inp[1]=sx.x; inp[2]=sy.x; inp[3]=id.y; inp[4]=sx.y; inp[5]=sy.y; inp[6]=id.z; inp[7]=sx.z; inp[8]=sy.z; inp[9]=id.w; inp[10]=sx.w; inp[11]=sy.w;
  sx=(-(b[0])-2.0*b[3]-b[6]+b[2]+2.0*b[5]+b[8])*0.125; sy=(-(b[0])-2.0*b[1]-b[2]+b[6]+2.0*b[7]+b[8])*0.125; id=b[4];
  inp[12]=id.x; inp[13]=sx.x; inp[14]=sy.x; inp[15]=id.y; inp[16]=sx.y; inp[17]=sy.y; inp[18]=id.z; inp[19]=sx.z; inp[20]=sy.z; inp[21]=id.w; inp[22]=sx.w; inp[23]=sy.w;
  sx=(-(c[0])-2.0*c[3]-c[6]+c[2]+2.0*c[5]+c[8])*0.125; sy=(-(c[0])-2.0*c[1]-c[2]+c[6]+2.0*c[7]+c[8])*0.125; id=c[4];
  inp[24]=id.x; inp[25]=sx.x; inp[26]=sy.x; inp[27]=id.y; inp[28]=sx.y; inp[29]=sy.y; inp[30]=id.z; inp[31]=sx.z; inp[32]=sy.z; inp[33]=id.w; inp[34]=sx.w; inp[35]=sy.w;
  sx=(-(d[0])-2.0*d[3]-d[6]+d[2]+2.0*d[5]+d[8])*0.125; sy=(-(d[0])-2.0*d[1]-d[2]+d[6]+2.0*d[7]+d[8])*0.125; id=d[4];
  inp[36]=id.x; inp[37]=sx.x; inp[38]=sy.x; inp[39]=id.y; inp[40]=sx.y; inp[41]=sy.y; inp[42]=id.z; inp[43]=sx.z; inp[44]=sy.z; inp[45]=id.w; inp[46]=sx.w; inp[47]=sy.w;
${condFill}

  vec4 dx0=vec4(0.0), dx1=vec4(0.0), dx2=vec4(0.0), dx3=vec4(0.0);
  for (int o=0; o<HID; o++){
    float h = texelFetch(b1t, ivec2(o,0),0).r;
    for (int i=0; i<IN; i++) h += texelFetch(w1t, ivec2(i,o),0).r * inp[i];
    h = max(h, 0.0);
    dx0 += ${w2line(0)};
    dx1 += ${w2line(1)};
    dx2 += ${w2line(2)};
    dx3 += ${w2line(3)};
  }
  dx0 += ${b2v(0)};
  dx1 += ${b2v(1)};
  dx2 += ${b2v(2)};
  dx3 += ${b2v(3)};

  float m = rand(gl_FragCoord.xy + vec2(rndseed)) <= fire ? 1.0 : 0.0;
  O0 = (a[4] + dx0*m) * life;
  O1 = (b[4] + dx1*m) * life;
  O2 = (c[4] + dx2*m) * life;
  O3 = (d[4] + dx3*m) * life;
}`;
  }

  const damageSrc = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D s0,s1,s2,s3;
uniform vec2 center; uniform float radius;
layout(location=0) out vec4 O0;
layout(location=1) out vec4 O1;
layout(location=2) out vec4 O2;
layout(location=3) out vec4 O3;
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  if (distance(gl_FragCoord.xy, center) <= radius){
    O0=vec4(0.0); O1=vec4(0.0); O2=vec4(0.0); O3=vec4(0.0);
  } else {
    O0=texelFetch(s0,p,0); O1=texelFetch(s1,p,0); O2=texelFetch(s2,p,0); O3=texelFetch(s3,p,0);
  }
}`;

  function renderFSsrc(W: number, bg: [number, number, number]) {
    const bgv = `vec3(${bg[0].toFixed(4)},${bg[1].toFixed(4)},${bg[2].toFixed(4)})`;
    return `#version 300 es
precision highp float; precision highp int;
uniform sampler2D s0;
in vec2 uv;
out vec4 frag;
const int W=${W};
const int H=${W};
void main(){
  ivec2 p = clamp(ivec2(vec2(uv.x, 1.0-uv.y) * vec2(float(W), float(H))), ivec2(0), ivec2(W-1, H-1));
  vec4 s = texelFetch(s0, p, 0);
  float a = clamp(s.a, 0.0, 1.0);
  vec3 rgb = clamp(${bgv} * (1.0 - a) + s.rgb, 0.0, 1.0);
  frag = vec4(rgb, 1.0);
}`;
  }

  function parseBg(hex?: string): [number, number, number] {
    if (!hex) return [1, 1, 1];
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  function loc(p: WebGLProgram, name: string) {
    return gl!.getUniformLocation(p, name);
  }

  function cacheLocs() {
    const u = prog.update;
    gl!.useProgram(u.p);
    ["s0", "s1", "s2", "s3"].forEach((n, i) => gl!.uniform1i(loc(u.p, n), i));
    gl!.uniform1i(loc(u.p, "w1t"), 4);
    gl!.uniform1i(loc(u.p, "w2t"), 5);
    gl!.uniform1i(loc(u.p, "b1t"), 6);
    gl!.uniform1i(loc(u.p, "b2t"), 7);
    gl!.uniform1i(loc(u.p, "embt"), 8);
    u.A = loc(u.p, "A");
    u.B = loc(u.p, "B");
    u.t = loc(u.p, "t");
    u.fire = loc(u.p, "fire");
    u.rnd = loc(u.p, "rndseed");

    const dmg = prog.damage;
    gl!.useProgram(dmg.p);
    ["s0", "s1", "s2", "s3"].forEach((n, i) => gl!.uniform1i(loc(dmg.p, n), i));
    dmg.center = loc(dmg.p, "center");
    dmg.radius = loc(dmg.p, "radius");

    const r = prog.render;
    gl!.useProgram(r.p);
    gl!.uniform1i(loc(r.p, "s0"), 0);
  }

  function seedTextures() {
    if (!M) return;
    const W = GS;
    const z = () => new Float32Array(W * W * 4);
    const d0 = z(),
      d1 = z(),
      d2 = z(),
      d3 = z();
    const pts: [number, number][] = [];
    if (seedCount <= 1) {
      pts.push([W >> 1, W >> 1]);
    } else {
      const margin = Math.max(2, Math.floor(W * 0.08));
      for (let i = 0; i < seedCount; i++) {
        pts.push([
          margin + Math.floor(Math.random() * (W - 2 * margin)),
          margin + Math.floor(Math.random() * (W - 2 * margin)),
        ]);
      }
    }
    for (const [cx, cy] of pts) {
      const idx = (cy * W + cx) * 4;
      d0[idx + 3] = 1.0; // alpha (channel 3)
      for (let k = 0; k < 4; k++) {
        d1[idx + k] = 1.0;
        d2[idx + k] = 1.0;
        d3[idx + k] = 1.0;
      }
    }
    const set = texSets[readIdx]!;
    const datas = [d0, d1, d2, d3];
    for (let i = 0; i < 4; i++) {
      gl!.bindTexture(gl!.TEXTURE_2D, set[i]);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        gl!.RGBA32F,
        W,
        W,
        0,
        gl!.RGBA,
        gl!.FLOAT,
        datas[i],
      );
    }
  }

  function bindRead() {
    const set = texSets[readIdx]!;
    for (let i = 0; i < 4; i++) {
      gl!.activeTexture(gl!.TEXTURE0 + i);
      gl!.bindTexture(gl!.TEXTURE_2D, set[i]);
    }
  }

  function bindWeights() {
    (
      [
        ["w1", 4],
        ["w2", 5],
        ["b1", 6],
        ["b2", 7],
        ["emb", 8],
      ] as const
    ).forEach(([n, u]) => {
      gl!.activeTexture(gl!.TEXTURE0 + u);
      gl!.bindTexture(gl!.TEXTURE_2D, wtex[n]);
    });
  }

  function stepOnce() {
    if (!M) return;
    const W = GS;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbos[1 - readIdx]);
    gl!.viewport(0, 0, W, W);
    gl!.useProgram(prog.update.p);
    bindRead();
    bindWeights();
    gl!.uniform1i(prog.update.A, params.A);
    gl!.uniform1i(prog.update.B, params.B);
    gl!.uniform1f(prog.update.t, params.t);
    gl!.uniform1f(prog.update.fire, params.fire);
    gl!.uniform1f(prog.update.rnd, Math.random() * 1000.0);
    gl!.bindVertexArray(quadVAO);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    readIdx = 1 - readIdx;
  }

  function damageAt(cx: number, cy: number, r?: number) {
    if (!M) return;
    const W = GS;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbos[1 - readIdx]);
    gl!.viewport(0, 0, W, W);
    gl!.useProgram(prog.damage.p);
    bindRead();
    gl!.uniform2f(prog.damage.center, cx + 0.5, cy + 0.5);
    gl!.uniform1f(prog.damage.radius, r ?? Math.max(3, W * 0.18));
    gl!.bindVertexArray(quadVAO);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    readIdx = 1 - readIdx;
  }

  function renderToScreen() {
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, cv.width, cv.height);
    gl!.useProgram(prog.render.p);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, texSets[readIdx]![0]);
    gl!.bindVertexArray(quadVAO);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }

  function frame() {
    if (!playing || !M) return;
    frameCount++;
    const every = Math.max(1, params.stepEvery | 0);
    if (frameCount % every === 0) {
      const n = params.speed;
      const t0 = performance.now();
      for (let k = 0; k < n; k++) stepOnce();
      renderToScreen();
      if (frameCount % 30 < every) {
        const dt = performance.now() - t0;
        onStat(`${GS}×${GS} · ${n} steps/frame · ${dt.toFixed(1)} ms (GPU)`);
      }
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    params,
    loadModel(data: WeightsJson, o?: LoadOpts) {
      try {
        const m = data.meta;
        if (m.C !== 16) {
          onErr("This player assumes 16 channels; got C=" + m.C);
          return null;
        }
        M = m;
        GS = Math.max(16, Math.floor(o?.gridSize ?? m.SIZE));
        seedCount = Math.max(1, Math.floor(o?.seeds ?? 1));
        onErr("");
        wtex.w1 = weightTex(m.IN, m.HID, data.w1);
        wtex.w2 = weightTex(m.HID, m.C, data.w2);
        wtex.b1 = weightTex(m.HID, 1, data.b1);
        wtex.b2 = weightTex(m.C, 1, data.b2);
        wtex.emb = weightTex(m.COND, m.N, data.embed);

        const W = GS;
        texSets[0] = [
          stateTex(W, W, null),
          stateTex(W, W, null),
          stateTex(W, W, null),
          stateTex(W, W, null),
        ];
        texSets[1] = [
          stateTex(W, W, null),
          stateTex(W, W, null),
          stateTex(W, W, null),
          stateTex(W, W, null),
        ];
        fbos[0] = makeFBO(texSets[0]);
        fbos[1] = makeFBO(texSets[1]);
        if (!quadVAO) quadVAO = makeQuad();

        prog.update = { p: program(VS, updateFS(m, GS)) };
        prog.damage = { p: program(VS, damageSrc) };
        prog.render = {
          p: program(VS, renderFSsrc(GS, parseBg(o?.background))),
        };
        cacheLocs();

        const scale = o?.canvasScale ?? Math.max(1, Math.floor(560 / W));
        cv.width = W * scale;
        cv.height = W * scale;

        params.fire = m.fire_rate;
        params.A = 0;
        params.B = 0;
        readIdx = 0;
        seedTextures();
        renderToScreen();
        return m;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    setPlaying(v: boolean) {
      playing = v;
      if (raf) cancelAnimationFrame(raf);
      if (v) raf = requestAnimationFrame(frame);
    },
    seed() {
      if (!M) return;
      seedTextures();
      renderToScreen();
    },
    damageCenter() {
      if (!M) return;
      damageAt(GS >> 1, GS >> 1);
      renderToScreen();
    },
    damageAtCell(x: number, y: number, r?: number) {
      if (!M) return;
      damageAt(Math.floor(x), Math.floor(y), r);
      if (!playing) renderToScreen();
    },
    poke(clientX: number, clientY: number) {
      if (!M) return;
      const r = cv.getBoundingClientRect();
      const gx = Math.floor(((clientX - r.left) / r.width) * GS);
      const gy = Math.floor(((clientY - r.top) / r.height) * GS);
      damageAt(gx, gy);
      if (!playing) renderToScreen();
    },
    destroy() {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
    },
  };
}
