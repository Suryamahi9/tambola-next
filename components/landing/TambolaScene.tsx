"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { generateTicket } from "@/lib/ticket";

const BALL_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

const DARK_BG = "#070a16";
const LIGHT_BG = "#ffffff";

type V3 = [number, number, number];

const KEYS: { pos: V3; look: V3 }[] = [
  { pos: [0, 0.5, 8.2], look: [0, 0.4, 0] },
  { pos: [0.7, 0.85, 4.4], look: [0, 0.5, 0] },
  { pos: [2.6, 0.5, 2.0], look: [-0.5, 0.4, -0.2] },
  { pos: [-2.7, 0.4, 1.1], look: [0.7, 0.5, -1.2] },
  { pos: [0.6, 0.35, -0.7], look: [0, 0.45, -2.6] },
  { pos: [1.1, 0.4, -2.0], look: [0, 0.45, -2.6] },
];

const KEY_POS: THREE.Vector3[] = KEYS.map((k) => new THREE.Vector3(...k.pos));
const KEY_LOOK: THREE.Vector3[] = KEYS.map((k) => new THREE.Vector3(...k.look));

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    ref.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  return ref;
}

function useDarkMode() {
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() =>
      setDark(el.classList.contains("dark"))
    );
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function CameraRig() {
  const { camera } = useThree();
  const reduce = useReducedMotion();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const docEl = document.documentElement;
    const max = Math.max(1, docEl.scrollHeight - window.innerHeight);
    const raw = Math.min(1, Math.max(0, window.scrollY / max));
    const e = raw * raw * (3 - 2 * raw);
    const seg = e * (KEY_POS.length - 1);
    const i = Math.min(KEY_POS.length - 2, Math.floor(seg));
    const f = seg - i;
    const sf = f * f * (3 - 2 * f);
    _pos.lerpVectors(KEY_POS[i], KEY_POS[i + 1], sf);
    _look.lerpVectors(KEY_LOOK[i], KEY_LOOK[i + 1], sf);
    if (!reduce.current) {
      _pos.x += Math.sin(t * 0.3) * 0.06;
      _pos.y += Math.sin(t * 0.4 + 1.2) * 0.05;
    }
    camera.position.copy(_pos);
    camera.lookAt(_look);
  });

  return null;
}

function Cage() {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const reduce = useReducedMotion();

  const balls = useMemo(() => {
    const rnd = mulberry32(9);
    return Array.from({ length: 13 }, () => {
      const r = Math.cbrt(rnd()) * 1.05;
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    });
  }, []);

  useFrame((_, dt) => {
    if (reduce.current) return;
    outer.current.rotation.y += dt * 0.4;
    inner.current.rotation.x += dt * 0.7;
    inner.current.rotation.z += dt * 0.5;
  });

  return (
    <group position={[0, 0.5, 0]}>
      <group ref={outer}>
        <mesh>
          <torusGeometry args={[1.5, 0.055, 14, 60]} />
          <meshStandardMaterial
            color="#d4a844"
            metalness={0.85}
            roughness={0.3}
            emissive="#8a6a1f"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.52, 0.045, 14, 60]} />
          <meshStandardMaterial
            color="#d4a844"
            metalness={0.85}
            roughness={0.3}
            emissive="#8a6a1f"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <torusGeometry args={[1.54, 0.045, 14, 60]} />
          <meshStandardMaterial
            color="#b8860b"
            metalness={0.85}
            roughness={0.35}
            emissive="#6b4f14"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.48, 24, 16]} />
          <meshStandardMaterial color="#b98a2f" wireframe transparent opacity={0.1} />
        </mesh>
      </group>
      <group ref={inner}>
        {balls.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.14, 20, 20]} />
            <meshStandardMaterial
              color={BALL_COLORS[i % BALL_COLORS.length]}
              roughness={0.3}
              emissive={BALL_COLORS[i % BALL_COLORS.length]}
              emissiveIntensity={0.35}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function BallCloud() {
  const g = useRef<THREE.Group>(null!);
  const reduce = useReducedMotion();

  const pts = useMemo(() => {
    const rnd = mulberry32(42);
    return Array.from({ length: 34 }, () => {
      const r = 3.3 + rnd() * 2.3;
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) + 0.5,
        r * Math.sin(phi) * Math.sin(theta) - 0.4
      );
    });
  }, []);

  useFrame((_, dt) => {
    if (reduce.current) return;
    g.current.rotation.y += dt * 0.05;
  });

  return (
    <group ref={g}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial
            color={BALL_COLORS[i % BALL_COLORS.length]}
            roughness={0.35}
            emissive={BALL_COLORS[i % BALL_COLORS.length]}
            emissiveIntensity={0.28}
          />
        </mesh>
      ))}
    </group>
  );
}

function makeTicketTexture() {
  const grid = generateTicket();
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 330;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 480, 330);

  const grad = ctx.createLinearGradient(0, 0, 480, 0);
  grad.addColorStop(0, "#7f1d1d");
  grad.addColorStop(1, "#b91c1c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 52);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TAMBOLA", 240, 35);

  const x0 = 6;
  const y0 = 58;
  const cw = 52;
  const ch = 86;
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2.5;
  for (let c = 0; c < 9; c++) {
    for (let r = 0; r < 3; r++) {
      ctx.strokeRect(x0 + c * cw, y0 + r * ch, cw, ch);
    }
  }
  ctx.fillStyle = "#111827";
  ctx.font = "bold 24px 'Segoe UI', sans-serif";
  grid.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v !== null) {
        ctx.fillText(String(v), x0 + c * cw + cw / 2, y0 + r * ch + ch / 2 + 9);
      }
    })
  );

  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, 474, 324);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const CARD_DATA: { pos: V3; spin: number }[] = [
  { pos: [2.5, 0.7, -1.0], spin: 1 },
  { pos: [-2.7, 0.5, -0.4], spin: -1 },
  { pos: [1.9, -0.6, -3.4], spin: 1 },
  { pos: [-2.1, -0.4, -2.7], spin: -1 },
  { pos: [0.4, 1.7, -1.7], spin: 1 },
];

function TicketCards() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const reduce = useReducedMotion();

  const cards = useMemo(() => {
    const rnd = mulberry32(21);
    return CARD_DATA.map((c, i) => ({
      pos: new THREE.Vector3(...c.pos),
      spin: c.spin,
      phase: i * 1.3,
      tiltY: rnd() * 0.8 - 0.4,
      tiltX: rnd() * 0.3 - 0.15,
      tex: makeTicketTexture(),
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    cards.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.set(
        c.pos.x,
        c.pos.y + Math.sin(t * 0.55 + c.phase) * 0.16,
        c.pos.z
      );
      g.rotation.y = c.tiltY + Math.sin(t * 0.3 + c.phase) * 0.15 + (reduce.current ? 0 : t * c.spin * 0.06);
      g.rotation.x = c.tiltX + Math.sin(t * 0.4 + c.phase) * 0.05;
    });
  });

  return (
    <>
      {cards.map((c, i) => (
        <group
          key={i}
          position={c.pos}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <mesh>
            <planeGeometry args={[2, 1.35]} />
            <meshStandardMaterial map={c.tex} side={THREE.DoubleSide} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function BigBall() {
  const mesh = useRef<THREE.Mesh>(null!);
  const reduce = useReducedMotion();

  useFrame((state, dt) => {
    if (reduce.current) return;
    mesh.current.rotation.y += dt * 0.4;
    const s = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.02;
    mesh.current.scale.setScalar(s);
  });

  return (
    <group position={[0, 0.45, -2.6]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.72, 40, 40]} />
        <meshStandardMaterial
          color="#fbbf24"
          roughness={0.22}
          metalness={0.1}
          emissive="#f59e0b"
          emissiveIntensity={0.5}
        />
      </mesh>
      <Billboard position={[0, 0, 0.78]}>
        <Text
          fontSize={0.5}
          fontWeight={800}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          90
        </Text>
      </Billboard>
    </group>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null!);

  const { positions, colors } = useMemo(() => {
    const count = 1100;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const rnd = mulberry32(7);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() * 2 - 1) * 16;
      pos[i * 3 + 1] = (rnd() * 2 - 1) * 9;
      pos[i * 3 + 2] = (rnd() * 2 - 1) * 13;
      const c = new THREE.Color(BALL_COLORS[i % BALL_COLORS.length]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SceneRig() {
  const dark = useDarkMode();

  return (
    <>
      <fogExp2 attach="fog" args={[dark ? DARK_BG : LIGHT_BG, 0.055]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 7, 6]} intensity={1.6} />
      <directionalLight position={[-6, 3, -4]} intensity={0.6} color="#8b5cf6" />
      <pointLight position={[0, 0.5, 0]} intensity={1.1} decay={0} color="#ffd08a" />

      <Cage />
      <BallCloud />
      <Suspense fallback={null}>
        <TicketCards />
      </Suspense>
      <BigBall />
      <Particles />
      <Sparkles count={90} scale={[11, 6, 10]} size={2.2} speed={0.35} color="#a78bfa" opacity={0.7} />

      <Suspense fallback={null}>
        <Billboard position={[0, 2.35, 0]}>
          <Text
            fontSize={0.62}
            fontWeight={800}
            letterSpacing={0.28}
            color="#a78bfa"
            anchorX="center"
            anchorY="middle"
          >
            TAMBOLA
          </Text>
        </Billboard>
      </Suspense>
    </>
  );
}

export default function TambolaScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-[#070a16]"
    >
      <Canvas
        flat
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 50, near: 0.1, far: 90, position: [0, 0.5, 8.2] }}
        className="pointer-events-none"
      >
        <SceneRig />
        <CameraRig />
      </Canvas>
    </div>
  );
}
