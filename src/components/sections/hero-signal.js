const SPOTS = [
  [0.31, 0.12],
  [0.275, 0.21],
  [0.41, 0.17],
  [0.47, 0.29],
  [0.54, 0.3],
  [0.62, 0.27],
  [0.75, 0.18],
  [0.905, 0.08],
  [0.935, 0.19],
  [0.295, 0.37],
  [0.255, 0.39],
  [0.465, 0.39],
  [0.625, 0.39],
  [0.72, 0.47],
  [0.805, 0.43],
  [0.93, 0.4],
  [0.07, 0.58],
  [0.235, 0.53],
  [0.56, 0.56],
  [0.95, 0.55],
  [0.315, 0.65],
  [0.535, 0.71],
  [0.61, 0.73],
  [0.705, 0.75],
  [0.89, 0.74],
  [0.185, 0.7],
  [0.35, 0.8],
  [0.455, 0.91],
  [0.635, 0.94],
  [0.095, 0.87],
  [0.4, 0.87],
  [0.94, 0.89],
];

const VERTEX = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const FRAGMENT = `precision mediump float;
uniform sampler2D uTex;uniform vec2 uView;uniform float uImg;uniform float uZoom;uniform vec2 uFoc;uniform float uTime;uniform vec3 uLime;uniform vec4 uP[8];uniform vec3 uPtr;uniform float uDiag;uniform float uDim;
vec2 cover(vec2 s){float ra=uView.x/uView.y;vec2 uv=s;if(ra>uImg){uv.y=(s.y-.5)*uImg/ra+.5;}else{uv.x=(s.x-.5)*ra/uImg+.5;}return (uv-.5)/uZoom+.5+uFoc;}
float reach;float rim;
void ring(vec4 P, vec2 fc){if(P.w<=0.)return;float age=uTime-P.z;if(age<0.)return;float R=age*uDiag*(.2+.07*P.w);float d=distance(fc,P.xy);float life=2.4+2.6*P.w;float fade=1.-smoothstep(life*.4,life,age);float band=uDiag*(.008+.006*P.w);rim+=exp(-pow((d-R)/band,2.))*(1.-smoothstep(0.,life*.75,age));reach=max(reach,(1.-smoothstep(R-band*5.,R+band,d))*fade);}
void main(){vec2 fc=vec2(gl_FragCoord.x,uView.y-gl_FragCoord.y);vec2 s=fc/uView;vec3 col=texture2D(uTex,clamp(cover(s),.001,.999)).rgb;
float l=dot(col,vec3(.299,.587,.114));vec3 grey=mix(vec3(l)*vec3(.9,.94,1.),vec3(.03,.035,.045),uDim);
reach=0.;rim=0.;
ring(uP[0],fc);ring(uP[1],fc);ring(uP[2],fc);ring(uP[3],fc);ring(uP[4],fc);ring(uP[5],fc);ring(uP[6],fc);ring(uP[7],fc);
float sp=(1.-smoothstep(uDiag*.035,uDiag*.12,distance(fc,uPtr.xy)))*uPtr.z;reach=max(reach,sp*.85);
vec3 c=mix(grey,col*mix(1.,.86,uDim),reach);c=mix(c,uLime,clamp(rim,0.,1.)*.62);
float vg=smoothstep(.45,1.,s.y)*.55+(1.-smoothstep(0.,.2,s.y))*.28;c*=1.-vg;
gl_FragColor=vec4(c,1.);}`;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function readLime(root) {
  const probe = document.createElement("i");
  probe.style.display = "none";
  probe.style.color = "var(--rw-brass)";
  root.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const match = value.match(/(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/);
  if (!match) return [14 / 255, 88 / 255, 209 / 255];
  return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255];
}

export function startHeroSignal({
  root,
  canvas,
  imageUrl,
  focusX = 50,
  focusY = 50,
  copy,
  onReady,
  onHit,
  onEnergy,
}) {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl || gl.isContextLost()) return () => {};

  let dead = false;
  let program = null;
  let texture = null;
  let buffer = null;
  let uView = null;
  let uImg = null;
  let uZoom = null;
  let uFoc = null;
  let uTime = null;
  let uLime = null;
  let uP = null;
  let uPtr = null;
  let uDiag = null;
  let uDim = null;
  let imageRatio = 2400 / 1340;
  let textureReady = false;
  let builtFor = "";

  const image = new Image();
  image.decoding = "async";

  const upload = () => {
    if (dead || !texture || !image.complete || !image.naturalWidth) return;
    try {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      imageRatio = image.naturalWidth / image.naturalHeight || imageRatio;
      textureReady = true;
    } catch {
      textureReady = false;
    }
  };

  const build = () => {
    textureReady = false;
    const shader = (type, source) => {
      const item = gl.createShader(type);
      gl.shaderSource(item, source);
      gl.compileShader(item);
      return item;
    };
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name) => gl.getUniformLocation(program, name);
    uView = uniform("uView");
    uImg = uniform("uImg");
    uZoom = uniform("uZoom");
    uFoc = uniform("uFoc");
    uTime = uniform("uTime");
    uLime = uniform("uLime");
    uP = uniform("uP");
    uPtr = uniform("uPtr");
    uDiag = uniform("uDiag");
    uDim = uniform("uDim");
    const lime = readLime(root);
    gl.uniform3f(uLime, lime[0], lime[1], lime[2]);
    texture = gl.createTexture();
    upload();
  };

  image.onload = () => {
    if (!dead) upload();
  };
  image.src = imageUrl;

  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let diagonal = 1;
  let visible = true;
  let frame = 0;
  let shown = false;
  const started = performance.now();
  const pulses = [];
  const cooling = SPOTS.map(() => -99);
  const now = () => (performance.now() - started) / 1000;

  const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    const box = root.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    const nextW = Math.max(1, Math.round(width * pixelRatio));
    const nextH = Math.max(1, Math.round(height * pixelRatio));
    const key = `${nextW}x${nextH}`;
    if (builtFor !== key) {
      canvas.width = nextW;
      canvas.height = nextH;
      build();
      builtFor = key;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    diagonal = Math.hypot(width, height);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(root);

  const emit = (x, y, strength) => {
    pulses.push([x, y, now(), strength]);
    if (pulses.length > 8) pulses.shift();
    onEnergy(Math.round(strength * (120 + Math.random() * 380)));
  };

  const spotToScreen = (hx, hy, fx, fy, zoom) => {
    const ratio = width / height;
    let x = (hx - fx - 0.5) * zoom + 0.5;
    let y = (hy - fy - 0.5) * zoom + 0.5;
    if (ratio > imageRatio) y = ((y - 0.5) * ratio) / imageRatio + 0.5;
    else x = ((x - 0.5) * imageRatio) / ratio + 0.5;
    return [x * width, y * height];
  };

  let chipCursor = Math.floor(Math.random() * 10);
  const reachSpots = (time, zoom) => {
    const fx = ((focusX - 50) / 100) * 0.3;
    const fy = ((focusY - 50) / 100) * 0.3;
    const copyBox = copy?.current?.getBoundingClientRect();
    const rootBox = root.getBoundingClientRect();

    for (const pulse of pulses) {
      const age = time - pulse[2];
      if (age < 0) continue;
      const radius = age * diagonal * (0.2 + 0.07 * pulse[3]);
      if (radius > diagonal) continue;

      SPOTS.forEach(([hx, hy], index) => {
        if (time - cooling[index] < 7) return;
        const [x, y] = spotToScreen(hx, hy, fx, fy, zoom);
        if (x < 90 || x > width - 110 || y < 190 || y > height - 190) return;
        if (
          copyBox &&
          x + rootBox.left > copyBox.left - 40 &&
          x + rootBox.left < copyBox.right + 40 &&
          y + rootBox.top > copyBox.top - 30 &&
          y + rootBox.top < copyBox.bottom + 20
        ) {
          return;
        }
        if (Math.abs(Math.hypot(x - pulse[0], y - pulse[1]) - radius) > 14) return;
        cooling[index] = time;
        onHit?.(Math.round(x), Math.round(y), chipCursor);
        chipCursor += 1;
        onEnergy(40 + Math.round(Math.random() * 260));
      });
    }
  };

  const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  let pointerX = width / 2;
  let pointerY = height * 0.55;
  let targetX = pointerX;
  let targetY = pointerY;
  let presence = 0;
  let presenceTarget = 0;
  let lastMove = -99;
  let lastEmit = -99;

  const onMove = (event) => {
    const box = root.getBoundingClientRect();
    targetX = event.clientX - box.left;
    targetY = event.clientY - box.top;
    presenceTarget = 1;
    lastMove = now();
  };
  const onLeave = () => {
    presenceTarget = 0;
  };
  const onDown = (event) => {
    const target = event.target;
    if (target.closest?.("a,button,input,nav")) return;
    const box = root.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    if (!fine) {
      targetX = pointerX = x;
      targetY = pointerY = y;
      lastMove = now();
    }
    emit(x, y, 1.6);
    lastEmit = now();
  };

  if (fine) {
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
  }
  root.addEventListener("pointerdown", onDown);

  const visibility = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !frame) frame = requestAnimationFrame(draw);
  });
  visibility.observe(root);

  const packed = new Float32Array(32);

  function draw() {
    frame = 0;
    if (dead || !visible) return;
    const time = now();
    const box = root.getBoundingClientRect();
    const scroll = clamp01(-box.top / (box.height || 1));
    const zoom = 1 + 0.12 * (1 - clamp01(time / 2.2)) ** 3 + scroll * 0.08;
    const idle = !fine || time - lastMove > 2.6 || presenceTarget === 0;

    if (idle) {
      const wander = time * 0.23;
      targetX = width * (0.5 + 0.34 * Math.sin(wander * 1.3));
      targetY = height * (0.5 + 0.28 * Math.sin(wander * 0.9 + 1.2));
    }

    pointerX += (targetX - pointerX) * (idle ? 0.03 : 0.16);
    pointerY += (targetY - pointerY) * (idle ? 0.03 : 0.16);
    presence += ((fine && !idle ? 1 : 0) - presence) * 0.08;

    if (time > 1.6 && time - lastEmit > (idle ? 1.9 : 1.35)) {
      emit(pointerX, pointerY, idle ? 0.7 : 0.9);
      lastEmit = time;
    }
    if (time > 1.4 && pulses.length === 0) {
      emit(width / 2, height * 0.55, 1.4);
      lastEmit = time;
    }

    for (let index = 0; index < 8; index += 1) {
      const pulse = pulses[index];
      packed[index * 4] = pulse ? pulse[0] * pixelRatio : 0;
      packed[index * 4 + 1] = pulse ? pulse[1] * pixelRatio : 0;
      packed[index * 4 + 2] = pulse ? pulse[2] : 0;
      packed[index * 4 + 3] = pulse ? pulse[3] : 0;
    }

    if (dead) return;

    if (textureReady) {
      gl.uniform2f(uView, canvas.width, canvas.height);
      gl.uniform1f(uImg, imageRatio);
      gl.uniform1f(uZoom, zoom);
      gl.uniform2f(uFoc, ((focusX - 50) / 100) * 0.3, ((focusY - 50) / 100) * 0.3);
      gl.uniform1f(uTime, time);
      gl.uniform4fv(uP, packed);
      gl.uniform3f(uPtr, pointerX * pixelRatio, pointerY * pixelRatio, presence);
      gl.uniform1f(uDiag, diagonal * pixelRatio);
      gl.uniform1f(uDim, 0.42);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!shown) {
        shown = true;
        onReady();
      }
    }

    reachSpots(time, zoom);
    frame = requestAnimationFrame(draw);
  }

  const onVisibility = () => {
    if (!document.hidden && visible && !frame) frame = requestAnimationFrame(draw);
  };
  document.addEventListener("visibilitychange", onVisibility);
  frame = requestAnimationFrame(draw);

  return () => {
    dead = true;
    cancelAnimationFrame(frame);
    frame = 0;
    observer.disconnect();
    visibility.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("pointerdown", onDown);
    image.onload = null;
    if (program) gl.deleteProgram(program);
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
  };
}
