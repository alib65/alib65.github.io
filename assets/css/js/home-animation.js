window.addEventListener('DOMContentLoaded', () => {
if (typeof THREE === 'undefined') {
  document.querySelector('.animation-controls').hidden = true;
  return;
}
// --- CONFIGURATION ---
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PARTICLE_COUNT = prefersReducedMotion ? 2500 : (window.innerWidth <= 768 ? 10000 : 30000);
const SHAPE_TIME = 20000;

// Physics settings
const ATTRACTION = 0.03;
const DAMPING = 0.96;
const NOISE_SCALE = 0.8;

let scene, camera, renderer, system;
let animationFrameId = null;
let positions, velocities, targets;

let currentShape = -1;
let shapeTimer = Date.now();

// --- GLOBAL PAUSE LOGIC (Wrapped in Try/Catch to prevent strict-browser crashes) ---
let isPaused = prefersReducedMotion;
try {
  isPaused = prefersReducedMotion || localStorage.getItem('siteAnimationPaused') === 'true';
} catch (e) {
  console.warn("Local storage blocked by browser settings, defaulting to play.");
}

const shapes = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08080A, 0.001);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  positions = new Float32Array(PARTICLE_COUNT * 3);
  velocities = new Float32Array(PARTICLE_COUNT * 3);
  targets = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 1000;
    velocities[i] = (Math.random() - 0.5) * 2;
    targets[i] = positions[i];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xF4F0EB, 
    size: 0.8,
    transparent: true,
    opacity: 0.6, 
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  system = new THREE.Points(geometry, material);
  scene.add(system);

  createShapes();
  changeShape();
  shapeTimer = Date.now();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const pauseBtn = document.getElementById('pause-btn');
  if (isPaused) {
    pauseBtn.innerText = "Resume animation";
    pauseBtn.setAttribute('aria-pressed', 'true');
  }

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    try {
      localStorage.setItem('siteAnimationPaused', isPaused);
    } catch (e) {}
    pauseBtn.innerText = isPaused ? "Resume animation" : "Pause animation";
    pauseBtn.setAttribute('aria-pressed', String(isPaused));
    if (isPaused && animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      renderer.render(scene, camera);
    } else if (!isPaused && animationFrameId === null) {
      shapeTimer = Date.now();
      animate();
    }
  });
}

function createShapes() {
  const set = (arr, i, x, y, z) => {
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  };

  const TAU = Math.PI * 2;
  const Z_THICKNESS = 10;
  const zJ = () => (Math.random() - 0.5) * Z_THICKNESS;

  const lerp = (a, b, t) => a + (b - a) * t;
  const rot = (x, y, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [x * c - y * s, x * s + y * c];
  };
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  shapes.length = 0;

  // 01. Flower-of-life arc field
  shapes.push((() => {
    const spacing = 64;
    const r0 = 22;
    const h = spacing * Math.sqrt(3) / 2;
    const centers = [];
    const R = 320;
    for (let j = -8; j <= 8; j++) {
      for (let i = -8; i <= 8; i++) {
        const cx = spacing * (i + j * 0.5);
        const cy = h * j;
        if (cx * cx + cy * cy <= R * R) centers.push([cx, cy]);
      }
    }
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const a = Math.random() * TAU;
        const ring = Math.random() < 0.25 ? 2 : 1;
        const rr = r0 * ring;
        set(arr, i, cx + rr * Math.cos(a), cy + rr * Math.sin(a), zJ());
      }
      return arr;
    };
  })());

  // 02. Square lattice
  shapes.push((() => {
    const cell = 70;
    const half = 10;
    const side = 40;
    const centers = [];
    for (let y = -half; y <= half; y++) {
      for (let x = -half; x <= half; x++) centers.push([x * cell, y * cell]);
    }
    const edgePoint = (s, e) => {
      const u = (Math.random() - 0.5) * s;
      if (e === 0) return [ s / 2, u];
      if (e === 1) return [ u,  s / 2];
      if (e === 2) return [-s / 2, u];
      return [u, -s / 2];
    };
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const a = Math.random() < 0.5 ? 0 : Math.PI / 4;
        const e = (Math.random() * 4) | 0;
        const [lx, ly] = edgePoint(side, e);
        const [rx, ry] = rot(lx, ly, a);
        set(arr, i, cx + rx, cy + ry, zJ());
      }
      return arr;
    };
  })());

  // 03. Triangular grid
  shapes.push((() => {
    const s = 62;
    const h = s * Math.sqrt(3) / 2;
    const half = 10;
    const nodes = [];
    for (let j = -half; j <= half; j++) {
      for (let i = -half; i <= half; i++) nodes.push([i * s + (j & 1 ? s / 2 : 0), j * h]);
    }
    const tri = (up) => {
      const a = [0, 0];
      const b = [s, 0];
      const c = [s / 2, up ? h : -h];
      return [a, b, c];
    };
    const TUP = tri(true);
    const TDN = tri(false);
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [ox, oy] = pick(nodes);
        const verts = Math.random() < 0.5 ? TUP : TDN;
        const e = (Math.random() * 3) | 0;
        const p0 = verts[e];
        const p1 = verts[(e + 1) % 3];
        const t = Math.random();
        set(arr, i, ox + lerp(p0[0], p1[0], t), oy + lerp(p0[1], p1[1], t), zJ());
      }
      return arr;
    };
  })());

  // 04. Honeycomb
  shapes.push((() => {
    const spacing = 74;
    const h = spacing * Math.sqrt(3) / 2;
    const half = 8;
    const centers = [];
    for (let j = -half; j <= half; j++) {
      for (let i = -half; i <= half; i++) centers.push([spacing * (i + j * 0.5), h * j]);
    }
    const R = 26;
    const hex = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      hex.push([R * Math.cos(a), R * Math.sin(a)]);
    }
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const e = (Math.random() * 6) | 0;
        const p0 = hex[e];
        const p1 = hex[(e + 1) % 6];
        const t = Math.random();
        set(arr, i, cx + lerp(p0[0], p1[0], t), cy + lerp(p0[1], p1[1], t), zJ());
      }
      return arr;
    };
  })());

  // 05. Octagon frames
  shapes.push((() => {
    const cell = 92;
    const half = 8;
    const centers = [];
    for (let y = -half; y <= half; y++) {
      for (let x = -half; x <= half; x++) centers.push([x * cell, y * cell]);
    }
    const R = 30;
    const oct = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + Math.PI / 8;
      oct.push([R * Math.cos(a), R * Math.sin(a)]);
    }
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const e = (Math.random() * 8) | 0;
        const p0 = oct[e];
        const p1 = oct[(e + 1) % 8];
        const t = Math.random();
        set(arr, i, cx + lerp(p0[0], p1[0], t), cy + lerp(p0[1], p1[1], t), zJ());
      }
      return arr;
    };
  })());

  // 06. Eight-point star
  shapes.push((() => {
    const cell = 92;
    const half = 8;
    const centers = [];
    for (let y = -half; y <= half; y++) {
      for (let x = -half; x <= half; x++) centers.push([x * cell, y * cell]);
    }
    const R = 34, r = 16;
    const star = [];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU;
      const rr = (k & 1) === 0 ? R : r;
      star.push([rr * Math.cos(a), rr * Math.sin(a)]);
    }
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const e = (Math.random() * 16) | 0;
        const p0 = star[e];
        const p1 = star[(e + 1) % 16];
        const t = Math.random();
        set(arr, i, cx + lerp(p0[0], p1[0], t), cy + lerp(p0[1], p1[1], t), zJ());
      }
      return arr;
    };
  })());

  // 07. Dodecagonal rosette field
  shapes.push((() => {
    const cell = 110;
    const half = 7;
    const centers = [];
    for (let y = -half; y <= half; y++) {
      for (let x = -half; x <= half; x++) centers.push([x * cell, y * cell]);
    }
    const R = 46;
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const a = Math.random() * TAU;
        const rr = R * (0.55 + 0.45 * Math.abs(Math.cos(6 * a)));
        set(arr, i, cx + rr * Math.cos(a), cy + rr * Math.sin(a), zJ());
      }
      return arr;
    };
  })());

  // 08. Interlaced strapwork
  shapes.push((() => {
    const S = 720;
    const A = 22;
    const F = 0.045;
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = (Math.random() - 0.5) * S;
        const v = (Math.random() - 0.5) * S;
        const x = u + A * Math.sin(v * F);
        const y = v + A * Math.sin(u * F);
        set(arr, i, x, y, zJ());
      }
      return arr;
    };
  })());

  // 09. Rhombille-style diamonds
  shapes.push((() => {
    const cell = 78;
    const half = 8;
    const e1 = [cell, 0];
    const e2 = [cell / 2, cell * Math.sqrt(3) / 2];
    const centers = [];
    for (let j = -half; j <= half; j++) {
      for (let i = -half; i <= half; i++) centers.push([i * e1[0] + j * e2[0], i * e1[1] + j * e2[1]]);
    }
    const w = 46;
    const h = w * Math.sqrt(3) / 2;
    const diamond = [[0, -h], [w, 0], [0, h], [-w, 0]];
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const ang = ((Math.random() * 3) | 0) * (Math.PI / 3);
        const e = (Math.random() * 4) | 0;
        const p0 = diamond[e];
        const p1 = diamond[(e + 1) % 4];
        const t = Math.random();
        const lx = lerp(p0[0], p1[0], t);
        const ly = lerp(p0[1], p1[1], t);
        const [rx, ry] = rot(lx, ly, ang);
        set(arr, i, cx + rx, cy + ry, zJ());
      }
      return arr;
    };
  })());

  // 10. Tenfold star field
  shapes.push((() => {
    const centers = [];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * TAU;
      const r = 80 + Math.random() * 260;
      centers.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    const R = 62;
    return () => {
      const arr = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const [cx, cy] = pick(centers);
        const a = Math.random() * TAU;
        const rr = R * (0.35 + 0.65 * Math.abs(Math.cos(5 * a)));
        const m = 0.75 + Math.random() * 0.35;
        set(arr, i, cx + m * rr * Math.cos(a), cy + m * m * Math.sin(a), zJ());
      }
      return arr;
    };
  })());
}

function changeShape() {
  currentShape = (currentShape + 1) % shapes.length;
  const newPos = shapes[currentShape]();

  for (let i = 0; i < PARTICLE_COUNT * 3; i++) targets[i] = newPos[i];

  for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
    velocities[i]     += (Math.random() - 0.5) * 5;
    velocities[i + 1] += (Math.random() - 0.5) * 5;
    velocities[i + 2] += (Math.random() - 0.5) * 5;
  }
}

function animate() {
  if (isPaused) {
    renderer.render(scene, camera);
    return;
  }

  animationFrameId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
    const ix = i, iy = i + 1, iz = i + 2;

    const ax = (targets[ix] - positions[ix]) * ATTRACTION;
    const ay = (targets[iy] - positions[iy]) * ATTRACTION;
    const az = (targets[iz] - positions[iz]) * ATTRACTION;

    const swirlX = Math.sin(positions[iy] * 0.01 + time) * NOISE_SCALE;
    const swirlY = Math.cos(positions[iz] * 0.01 + time) * NOISE_SCALE;
    const swirlZ = Math.sin(positions[ix] * 0.01 + time) * NOISE_SCALE;

    velocities[ix] += ax + swirlX;
    velocities[iy] += ay + swirlY;
    velocities[iz] += az + swirlZ;

    velocities[ix] *= DAMPING;
    velocities[iy] *= DAMPING;
    velocities[iz] *= DAMPING;

    positions[ix] += velocities[ix];
    positions[iy] += velocities[iy];
    positions[iz] += velocities[iz];
  }

  system.geometry.attributes.position.needsUpdate = true;

  const camSpeed = 0.5;
  const radius = 180;
  camera.position.x = radius * Math.sin(time * camSpeed);
  camera.position.y = radius * Math.sin(time * camSpeed * 0.6);
  camera.position.z = radius * Math.cos(time * camSpeed * 0.8);

  camera.position.x += (Math.random() - 0.5) * 2;
  camera.position.y += (Math.random() - 0.5) * 2;
  camera.position.z += (Math.random() - 0.5) * 2;

  camera.lookAt(0, 0, 0);
  system.rotation.z = time * 0.1;

  if (Date.now() - shapeTimer > SHAPE_TIME) {
    shapeTimer = Date.now();
    changeShape();
  }

  renderer.render(scene, camera);
}
});
