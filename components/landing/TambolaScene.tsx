"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateTicket } from "@/lib/ticket";

const BG = "#070a16";

const ACCENTS = [
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#9333ea",
  "#ca8a04",
  "#e11d48",
];

const TICKET_COUNT = 10;
const SPACING = 3.1;

const BASE_FOV = 50;
const MAX_FOV = 74;
const BASE_BACK = 2.4;
const BASE_LOOK = 0.6;

function layoutParams(aspect: number) {
  const n = Math.min(1, Math.max(0, (1.6 - aspect) / 1.1));
  return {
    fov: BASE_FOV + n * (MAX_FOV - BASE_FOV),
    backZ: BASE_BACK + n * 2.2,
    lookZ: BASE_LOOK + n * 0.5,
    xSpread: 1 + n * 0.25,
  };
}

function albumPositions(xSpread: number): THREE.Vector3[] {
  return Array.from({ length: TICKET_COUNT }, (_, i) => {
    const z = 6 - i * SPACING;
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (1.3 + (i % 3) * 0.22) * xSpread;
    const y = Math.sin(i * 1.1) * 0.5 + (i % 2 === 0 ? 0.05 : -0.15);
    return new THREE.Vector3(x, y, z);
  });
}

function keyPath(positions: THREE.Vector3[], backZ: number): THREE.Vector3[] {
  return positions.map((p, i) => {
    const prev = i > 0 ? positions[i - 1] : p;
    return new THREE.Vector3(
      (p.x + prev.x) * 0.35 + 0.4,
      (p.y + prev.y) * 0.5 + 0.25,
      p.z + backZ
    );
  });
}

function keyLookPath(
  positions: THREE.Vector3[],
  lookZ: number
): THREE.Vector3[] {
  return positions.map((p) => new THREE.Vector3(p.x * 0.55, p.y, p.z - lookZ));
}

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    ref.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  return ref;
}

function useAspect() {
  const [aspect, setAspect] = useState(1.6);
  useEffect(() => {
    const update = () => setAspect(window.innerWidth / window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return aspect;
}

function CameraRig({
  keyPos,
  keyLook,
  fov,
}: {
  keyPos: THREE.Vector3[];
  keyLook: THREE.Vector3[];
  fov: number;
}) {
  const { camera } = useThree();
  const reduce = useReducedMotion();
  const prevFov = useRef(0);

  // eslint-disable-next-line react-hooks/immutability -- R3F RAF loop: imperative camera updates are the documented pattern (rule false positive)
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (prevFov.current !== fov) {
      // eslint-disable-next-line react-hooks/immutability -- same RAF-loop false positive as above
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      prevFov.current = fov;
    }
    const docEl = document.documentElement;
    const max = Math.max(1, docEl.scrollHeight - window.innerHeight);
    const raw = Math.min(1, Math.max(0, window.scrollY / max));
    const e = raw * raw * (3 - 2 * raw);
    const seg = e * (keyPos.length - 1);
    const i = Math.min(keyPos.length - 2, Math.floor(seg));
    const f = seg - i;
    const sf = f * f * (3 - 2 * f);
    _pos.lerpVectors(keyPos[i], keyPos[i + 1], sf);
    _look.lerpVectors(keyLook[i], keyLook[i + 1], sf);
    if (!reduce.current) {
      _pos.x += Math.sin(t * 0.3 + i) * 0.05;
      _pos.y += Math.sin(t * 0.4 + 1.2) * 0.04;
    }
    camera.position.copy(_pos);
    camera.lookAt(_look);
  });

  return null;
}

function makeTicketTexture(index: number) {
  const grid = generateTicket();
  const accent = ACCENTS[index % ACCENTS.length];
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 330;
  const ctx = canvas.getContext("2d")!;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, 330);
  bgGrad.addColorStop(0, "#ffffff");
  bgGrad.addColorStop(1, "#f4f4f5");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 480, 330);

  const header = ctx.createLinearGradient(0, 0, 480, 0);
  header.addColorStop(0, accent);
  header.addColorStop(1, accent);
  ctx.fillStyle = header;
  ctx.fillRect(0, 0, 480, 52);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TAMBOLA", 196, 35);
  ctx.textAlign = "right";
  ctx.font = "bold 16px 'Segoe UI', sans-serif";
  ctx.fillText(`#${String(index + 1).padStart(2, "0")}`, 460, 35);

  const x0 = 6;
  const y0 = 58;
  const cw = 52;
  const ch = 86;
  ctx.strokeStyle = accent;
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

  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, 474, 324);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function TicketCard({
  index,
  position,
}: {
  index: number;
  position: THREE.Vector3;
}) {
  const group = useRef<THREE.Group>(null!);
  const reduce = useReducedMotion();
  const tex = useMemo(() => makeTicketTexture(index), [index]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current.position.y =
      position.y + Math.sin(t * 0.5 + index * 1.1) * 0.12;
    group.current.rotation.y =
      (index % 2 === 0 ? 0.18 : -0.18) +
      Math.sin(t * 0.35 + index) * (reduce.current ? 0 : 0.07);
  });

  return (
    <group ref={group} position={position}>
      <mesh position={[0, 0, -0.045]}>
        <boxGeometry args={[2.08, 1.43, 0.09]} />
        <meshStandardMaterial color="#111318" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.35, 1.7]} />
        <meshStandardMaterial
          color={ACCENTS[index % ACCENTS.length]}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2, 1.35]} />
        <meshStandardMaterial
          map={tex}
          side={THREE.DoubleSide}
          roughness={0.55}
        />
      </mesh>
    </group>
  );
}

function Album({ positions }: { positions: THREE.Vector3[] }) {
  return (
    <group>
      {positions.map((p, i) => (
        <TicketCard key={i} index={i} position={p} />
      ))}
    </group>
  );
}

export default function TambolaScene() {
  const aspect = useAspect();
  const params = useMemo(() => layoutParams(aspect), [aspect]);
  const positions = useMemo(
    () => albumPositions(params.xSpread),
    [params.xSpread]
  );
  const keyPos = useMemo(
    () => keyPath(positions, params.backZ),
    [positions, params.backZ]
  );
  const keyLook = useMemo(
    () => keyLookPath(positions, params.lookZ),
    [positions, params.lookZ]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070a16]"
    >
      <Canvas
        flat
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: params.fov, near: 0.1, far: 90, position: [0, 0.3, 8.3] }}
        className="pointer-events-none"
      >
        <fogExp2 attach="fog" args={[BG, 0.045]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 4]} intensity={1.4} />
        <directionalLight position={[-4, 2, -3]} intensity={0.7} color="#8b5cf6" />
        <pointLight position={[0, 0, -8]} intensity={0.6} decay={0} color="#f59e0b" />
        <Suspense fallback={null}>
          <Album positions={positions} />
        </Suspense>
        <CameraRig keyPos={keyPos} keyLook={keyLook} fov={params.fov} />
      </Canvas>
    </div>
  );
}
