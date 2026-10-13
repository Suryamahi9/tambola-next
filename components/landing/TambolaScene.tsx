"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const BG = "#080808";
const GOLD = "#d4af37";
const GOLD_LIGHT = "#f7e7a1";

/* deterministic PRNG so particle layout is pure across renders */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── hooks ─────────────────────────────────────────────────────── */

function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      ref.current = mq.matches;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return ref;
}

function useViewport() {
  const [vp, setVp] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}

function usePointer() {
  const ref = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return ref;
}

/* ── canvas textures ───────────────────────────────────────────── */

function makeDustSprite() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,249,232,1)");
  g.addColorStop(0.35, "rgba(247,231,161,0.7)");
  g.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeGlowTexture() {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(247,231,161,0.55)");
  g.addColorStop(0.4, "rgba(212,175,55,0.22)");
  g.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── environment (fake studio reflections so gold reads as metal) ── */

function GoldEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#1a160c");
    g.addColorStop(0.5, "#050505");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);

    const spot = (x: number, y: number, r: number, a: number) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(255,249,232,${a})`);
      rg.addColorStop(0.35, `rgba(212,175,55,${a * 0.5})`);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    spot(170, 150, 230, 0.95);
    spot(812, 150, 260, 0.8);
    spot(520, 470, 340, 0.4);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromEquirectangular(tex).texture;
    // eslint-disable-next-line react-hooks/immutability -- three.js scene is an external system, not React state
    scene.environment = env;

    return () => {
      scene.environment = null;
      env.dispose();
      tex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ── decorative pieces ─────────────────────────────────────────── */

function GoldRing({
  radius,
  tube,
  position,
  rotation,
  speed,
  reduce,
}: {
  radius: number;
  tube: number;
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  reduce: React.RefObject<boolean>;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (reduce.current) return;
    ref.current.rotation.z += dt * speed;
    ref.current.rotation.x += dt * speed * 0.35;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <torusGeometry args={[radius, tube, 20, 140]} />
      <meshStandardMaterial
        color={GOLD}
        metalness={1}
        roughness={0.14}
        envMapIntensity={2}
        emissive={GOLD}
        emissiveIntensity={0.16}
      />
    </mesh>
  );
}

function GoldDust({ texture, count }: { texture: THREE.Texture; count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const rand = mulberry32(count * 7919 + 13);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 26;
      arr[i * 3 + 1] = (rand() - 0.5) * 16;
      arr[i * 3 + 2] = -rand() * 18 + 2;
    }
    return arr;
  }, [count]);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.02;
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.25) * 0.4;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={GOLD_LIGHT}
        size={0.16}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── camera rig ────────────────────────────────────────────────── */

function CameraRig({
  pointer,
  reduce,
  narrow,
}: {
  pointer: React.RefObject<{ x: number; y: number }>;
  reduce: React.RefObject<boolean>;
  narrow: boolean;
}) {
  const { camera } = useThree();
  const baseZ = narrow ? 12.5 : 9.4;

  useFrame(() => {
    const px = reduce.current ? 0 : pointer.current.x;
    const py = reduce.current ? 0 : pointer.current.y;
    const targetX = px * 0.6;
    const targetY = -py * 0.4;
    // eslint-disable-next-line react-hooks/immutability -- same RAF-loop false positive as above
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z += (baseZ - camera.position.z) * 0.06;
    camera.lookAt(0, 0, -1);
  });

  return null;
}

/* ── world ─────────────────────────────────────────────────────── */

function World({ narrow }: { narrow: boolean }) {
  const reduce = useReducedMotion();
  const pointer = usePointer();
  const dustTex = useMemo(() => makeDustSprite(), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);

  const ringProps = narrow
    ? ([
        { radius: 3.1, tube: 0.06, position: [0, 0.4, -4] as [number, number, number], rotation: [0.4, 0.2, 0] as [number, number, number], speed: 0.09 },
        { radius: 2.0, tube: 0.045, position: [0.8, 1.9, -7] as [number, number, number], rotation: [0.6, 0.25, 0.1] as [number, number, number], speed: -0.07 },
        { radius: 1.4, tube: 0.04, position: [-1.2, -1.9, -3.2] as [number, number, number], rotation: [-0.3, 0.5, 0.4] as [number, number, number], speed: 0.11 },
      ] as const)
    : ([
        { radius: 4.2, tube: 0.07, position: [-2.6, 1.1, -5] as [number, number, number], rotation: [0.5, 0.25, 0] as [number, number, number], speed: 0.08 },
        { radius: 3.0, tube: 0.05, position: [3.4, -1.4, -3.5] as [number, number, number], rotation: [-0.3, 0.6, 0.3] as [number, number, number], speed: -0.11 },
        { radius: 2.2, tube: 0.04, position: [-0.4, 2.6, -6] as [number, number, number], rotation: [0.9, -0.2, 0.2] as [number, number, number], speed: 0.06 },
        { radius: 6.4, tube: 0.05, position: [1.4, -0.2, -12] as [number, number, number], rotation: [0.42, 0.15, 0] as [number, number, number], speed: 0.04 },
        { radius: 2.6, tube: 0.045, position: [5.2, -2.4, -6.5] as [number, number, number], rotation: [-0.5, 0.7, 0.4] as [number, number, number], speed: -0.09 },
        { radius: 1.5, tube: 0.055, position: [2.3, 2.1, -2.6] as [number, number, number], rotation: [0.7, -0.5, 0.2] as [number, number, number], speed: 0.13 },
        { radius: 1.9, tube: 0.045, position: [-4.8, -2.2, -4.2] as [number, number, number], rotation: [-0.2, 0.4, 0.6] as [number, number, number], speed: 0.1 },
        { radius: 1.1, tube: 0.035, position: [-5.8, 2.6, -9] as [number, number, number], rotation: [0.6, 0.3, 0.1] as [number, number, number], speed: -0.12 },
        { radius: 2.2, tube: 0.045, position: [6.2, 2.9, -8] as [number, number, number], rotation: [0.55, -0.35, 0.25] as [number, number, number], speed: -0.08 },
        { radius: 1.7, tube: 0.04, position: [6.6, 0.4, -5.5] as [number, number, number], rotation: [0.2, -0.5, 0.45] as [number, number, number], speed: 0.1 },
      ] as const);

  return (
    <>
      <GoldEnvironment />
      <ambientLight intensity={0.28} />
      <spotLight
        position={[5, 9, 5]}
        angle={0.6}
        penumbra={0.85}
        intensity={2.4}
        color="#ffe9b0"
        distance={40}
        decay={0}
      />
      <pointLight position={[-7, 2, -3]} intensity={1.3} color={GOLD} distance={30} decay={0} />
      <pointLight position={[7, -3, -6]} intensity={0.6} color="#8fa0c0" distance={30} decay={0} />

      {/* warm ambient pool so the obsidian canvas reads as lit, not empty */}
      <mesh position={[narrow ? 0 : -0.6, narrow ? 1.4 : 0.15, -5.5]}>
        <planeGeometry args={[narrow ? 9 : 12.5, narrow ? 9 : 12.5]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          opacity={narrow ? 0.3 : 0.24}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {ringProps.map((r, i) => (
        <GoldRing key={i} {...r} reduce={reduce} />
      ))}

      <GoldDust texture={dustTex} count={narrow ? 90 : 220} />

      <CameraRig pointer={pointer} reduce={reduce} narrow={narrow} />
    </>
  );
}

/* ── root ──────────────────────────────────────────────────────── */

export default function TambolaScene() {
  const vp = useViewport();
  const narrow = vp.w < 900;
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const onScroll = () => setIdle(window.scrollY > window.innerHeight * 1.15);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: BG }}
    >
      <Canvas
        flat
        frameloop={idle ? "never" : "always"}
        dpr={[1, narrow ? 1.4 : 1.8]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: 46, near: 0.1, far: 80, position: [0, 0, narrow ? 12.5 : 9.4] }}
        className="pointer-events-none"
      >
        <color attach="background" args={[BG]} />
        <fogExp2 attach="fog" args={[BG, 0.03]} />
        <Suspense fallback={null}>
          <World narrow={narrow} />
        </Suspense>
      </Canvas>
    </div>
  );
}
