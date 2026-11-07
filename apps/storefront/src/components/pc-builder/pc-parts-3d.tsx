"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SelectedComponent } from "@/stores/pc-builder-store";
import {
  BOARD_Z,
  CASE_DEPTH_Z,
  CASE_FRONT_X,
  CASE_REAR_X,
  SceneLayout,
  SHROUD_TOP_Y,
  caseVisual,
  coolerVisual,
  cpuLabel,
  gpuVisual,
  ramVisual,
  storageVisual,
} from "./part-visuals";

export interface SceneRuntime {
  /** One lit material shared by every RGB element, so a colour change is one update. */
  rgbMaterial: THREE.MeshStandardMaterial;
  /** 0 when off, 1 at full speed. Damped by the scene every frame. */
  fanSpeed: React.MutableRefObject<number>;
  screenLines: string[];
  isPowered: boolean;
}

export const SceneContext = createContext<SceneRuntime | null>(null);

function useRuntime(): SceneRuntime {
  const runtime = useContext(SceneContext);
  if (!runtime) throw new Error("Part rendered outside the PC scene");
  return runtime;
}

type Vec3 = [number, number, number];

function Box({
  p,
  s,
  c = "#16181d",
  metal = 0.4,
  rough = 0.6,
}: {
  p: Vec3;
  s: Vec3;
  c?: string;
  metal?: number;
  rough?: number;
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={metal} roughness={rough} />
    </mesh>
  );
}

/** Draws text onto a canvas, used for the printed labels on parts. */
function useLabelTexture(
  text: string,
  { color = "#e7e9ee", background = "transparent", size = 64 }: { color?: string; background?: string; size?: number } = {}
) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const font = `700 ${size}px "Segoe UI", Arial, sans-serif`;
    context.font = font;
    canvas.width = Math.min(2048, Math.ceil(context.measureText(text).width) + 48);
    canvas.height = Math.ceil(size * 1.5);
    if (background !== "transparent") {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.font = font;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [text, color, background, size]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Label({
  text,
  position,
  rotation,
  height,
  color,
  background,
}: {
  text: string;
  position: Vec3;
  rotation?: Vec3;
  height: number;
  color?: string;
  background?: string;
}) {
  const texture = useLabelTexture(text, { color, background });
  const image = texture.image as HTMLCanvasElement;
  const width = (height * image.width) / image.height;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

// ---------- Fan ----------

const bladeGeometry = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(0.11, -0.05);
  shape.quadraticCurveTo(0.34, -0.2, 0.5, -0.1);
  shape.quadraticCurveTo(0.42, 0.12, 0.11, 0.07);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false });
})();

const BLADE_ANGLES = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2);

/** A 120 mm fan in its local XY plane, blowing along Z. */
export function Fan({
  position,
  rotation,
  scale = 1,
  frameColor = "#101216",
  lit = true,
}: {
  position: Vec3;
  rotation?: Vec3;
  scale?: number;
  frameColor?: string;
  lit?: boolean;
}) {
  const runtime = useRuntime();
  const rotor = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.z -= delta * (0.15 + runtime.fanSpeed.current * 13);
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Box p={[0, 0, -0.08]} s={[1.2, 1.2, 0.05]} c={frameColor} />
      {lit ? (
        <mesh material={runtime.rgbMaterial}>
          <torusGeometry args={[0.55, 0.025, 10, 48]} />
        </mesh>
      ) : (
        <mesh>
          <torusGeometry args={[0.55, 0.025, 10, 48]} />
          <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.5} />
        </mesh>
      )}
      <mesh position={[0, 0, -0.04]}>
        <circleGeometry args={[0.54, 40]} />
        <meshStandardMaterial color="#050608" />
      </mesh>
      <group ref={rotor} position={[0, 0, 0.01]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.08, 24]} />
          <meshStandardMaterial color="#20232a" metalness={0.5} roughness={0.4} />
        </mesh>
        {BLADE_ANGLES.map((angle) => (
          <mesh key={angle} geometry={bladeGeometry} rotation={[0.32, 0, angle]}>
            <meshStandardMaterial color="#2a2d35" metalness={0.2} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------- Case ----------

export function PcCase({ part, layout, showGlass }: { part: SelectedComponent; layout: SceneLayout; showGlass: boolean }) {
  const { isLight } = caseVisual(part);
  const H = layout.caseHeight;
  const W = CASE_FRONT_X - CASE_REAR_X;
  const D = CASE_DEPTH_Z * 2;
  const shell = isLight ? "#d9dce2" : "#23262c";
  const inner = isLight ? "#c6c9d0" : "#1a1c21";
  const t = 0.05;

  const frontFans = H >= 4.5 ? [1.65, 2.87, 4.03] : H >= 3.8 ? [1.6, 2.85] : [1.75];

  return (
    <group>
      {/* Chassis */}
      <Box p={[0, t / 2, 0]} s={[W, t, D]} c={shell} />
      <Box p={[0, H - t / 2, 0]} s={[W, t, D]} c={shell} />
      <Box p={[CASE_REAR_X + t / 2, H / 2, 0]} s={[t, H, D]} c={shell} />
      <Box p={[CASE_FRONT_X - t / 2, H / 2, 0]} s={[t, H, D]} c={shell} />
      <Box p={[0, H / 2, -CASE_DEPTH_Z + t / 2]} s={[W, H, t]} c={inner} metal={0.3} rough={0.75} />

      {/* Feet */}
      {[-1.9, 1.9].flatMap((x) =>
        [-0.8, 0.8].map((z) => <Box key={`${x}${z}`} p={[x, -0.06, z]} s={[0.5, 0.12, 0.3]} c="#08090b" rough={0.9} />)
      )}

      {/* Power supply shroud: open at the rear so the power supply stays visible */}
      <Box p={[1.03, SHROUD_TOP_Y / 2 + 0.02, 0]} s={[2.44, SHROUD_TOP_Y - 0.02, D - 0.08]} c={inner} />
      <Box p={[-1.2, SHROUD_TOP_Y + 0.0, -0.5]} s={[1.9, 0.03, 1.0]} c={inner} />

      {/* Rear I/O and expansion slot covers */}
      <Box p={[CASE_REAR_X + 0.01, H - 1.15, -0.45]} s={[0.02, 0.5, 0.2]} c="#050608" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Box key={i} p={[CASE_REAR_X + 0.01, H - 2.1 - i * 0.2, -0.05]} s={[0.02, 0.14, 1.0]} c={isLight ? "#aeb2ba" : "#23262c"} />
      ))}

      {/* Top vent bars */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x) => (
        <Box key={x} p={[x, H + 0.002, 0]} s={[0.42, 0.006, D - 0.4]} c="#07080a" rough={0.9} />
      ))}

      {/* Front power button */}
      <mesh position={[CASE_FRONT_X + 0.002, H - 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.05, 0.075, 24]} />
        <primitive object={useRuntime().rgbMaterial} attach="material" />
      </mesh>

      {/* Fans */}
      {frontFans.map((y) => (
        <Fan key={y} position={[CASE_FRONT_X - 0.2, y, 0]} rotation={[0, -Math.PI / 2, 0]} frameColor={isLight ? "#c9ccd3" : "#101216"} />
      ))}
      <Fan position={[CASE_REAR_X + 0.2, H - 1.1, 0.25]} rotation={[0, -Math.PI / 2, 0]} scale={0.95} frameColor={isLight ? "#c9ccd3" : "#101216"} />

      {/* Tempered glass: decoration only, it must not catch clicks meant for the parts */}
      {showGlass && (
        <group>
          <mesh position={[0, H / 2, CASE_DEPTH_Z]} raycast={() => null}>
            <boxGeometry args={[W, H, 0.025]} />
            <meshPhysicalMaterial color="#9fb7c9" transparent opacity={0.1} roughness={0.05} metalness={0.1} depthWrite={false} />
          </mesh>
        </group>
      )}
      <Label
        text={(part.brand ?? "").toUpperCase()}
        position={[CASE_FRONT_X - 1.0, 0.45, CASE_DEPTH_Z - 0.035]}
        height={0.16}
        color={isLight ? "#3a3d44" : "#7d828c"}
      />
    </group>
  );
}

// ---------- Motherboard ----------

let pcbTexture: THREE.CanvasTexture | null = null;

function getPcbTexture(): THREE.CanvasTexture {
  if (pcbTexture) return pcbTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#14171c";
  context.fillRect(0, 0, 512, 512);

  // A seeded walk, so the traces look the same on every load.
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  context.lineWidth = 1;
  for (let i = 0; i < 180; i++) {
    let x = random() * 512;
    let y = random() * 512;
    context.strokeStyle = `rgba(150, 170, 190, ${0.05 + random() * 0.1})`;
    context.beginPath();
    context.moveTo(x, y);
    for (let step = 0; step < 4; step++) {
      if (random() > 0.5) x += (random() - 0.5) * 140;
      else y += (random() - 0.5) * 140;
      context.lineTo(x, y);
    }
    context.stroke();
  }
  pcbTexture = new THREE.CanvasTexture(canvas);
  pcbTexture.colorSpace = THREE.SRGBColorSpace;
  return pcbTexture;
}

export function Motherboard({ part, layout }: { part: SelectedComponent; layout: SceneLayout }) {
  const { left, top, width, height } = layout.board;
  const cx = left + width / 2;
  const cy = top - height / 2;
  const z = BOARD_Z;
  const metal = "#2a2d34";
  const [sx, sy] = layout.socket;
  const pcbMap = useMemo(() => getPcbTexture(), []);

  return (
    <group>
      <mesh position={[cx, cy, z]}>
        <boxGeometry args={[width, height, 0.03]} />
        <meshStandardMaterial map={pcbMap} color="#c8cdd6" metalness={0.25} roughness={0.55} />
      </mesh>

      {/* CPU socket frame */}
      <Box p={[sx, sy, z + 0.03]} s={[0.62, 0.62, 0.03]} c="#3b3f47" metal={0.8} rough={0.35} />

      {/* Power stage heatsinks along the rear and top of the socket */}
      <Box p={[sx - 0.56, sy + 0.05, z + 0.11]} s={[0.26, 0.95, 0.2]} c={metal} metal={0.75} rough={0.35} />
      <Box p={[sx + 0.05, sy + 0.58, z + 0.11]} s={[0.8, 0.26, 0.2]} c={metal} metal={0.75} rough={0.35} />

      {/* Rear I/O cover */}
      <Box p={[left + 0.14, top - 0.48, z + 0.14]} s={[0.26, 0.7, 0.26]} c="#1d2026" metal={0.55} rough={0.4} />

      {/* Memory slots */}
      {Array.from({ length: layout.ramSlots }, (_, i) => (
        <Box key={i} p={[layout.ramX + i * 0.1, layout.ramY, z + 0.05]} s={[0.05, 1.33, 0.07]} c={i % 2 ? "#2a2e36" : "#3c414b"} rough={0.7} />
      ))}

      {/* 24-pin power connector */}
      <Box p={[left + width - 0.08, top - 1.2, z + 0.08]} s={[0.12, 0.5, 0.12]} c="#0c0d10" />

      {/* Primary and secondary expansion slots */}
      <Box p={[left + 0.88, layout.pcieY, z + 0.06]} s={[Math.min(1.45, width - 0.3), 0.07, 0.09]} c="#3c414b" metal={0.3} />
      {height > 2.5 && (
        <Box p={[left + 0.88, layout.pcieY - 0.8, z + 0.05]} s={[1.45, 0.06, 0.07]} c="#2a2e36" />
      )}

      {/* Chipset heatsink */}
      {height > 2 && (
        <mesh position={[left + width - 0.62, layout.pcieY - 0.3, z + 0.05]}>
          <boxGeometry args={[0.72, 0.62, 0.07]} />
          <meshStandardMaterial color={metal} metalness={0.8} roughness={0.3} />
        </mesh>
      )}

      {/* Small surface components */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[left + 0.42 + i * 0.09, top - 0.1, z + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.07, 10]} />
          <meshStandardMaterial color="#6d727c" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      <Label
        text={(part.brand ?? "").toUpperCase()}
        position={[left + width - 0.62, layout.pcieY - 0.3, z + 0.09]}
        height={0.1}
        color="#c5c9d2"
      />
    </group>
  );
}

// ---------- CPU ----------

export function Cpu({ part, layout }: { part: SelectedComponent; layout: SceneLayout }) {
  const [x, y] = layout.socket;
  return (
    <group position={[x, y, BOARD_Z + 0.06]}>
      <Box p={[0, 0, 0]} s={[0.42, 0.42, 0.03]} c="#3f6d4e" rough={0.7} />
      <RoundedBox args={[0.36, 0.36, 0.03]} radius={0.01} position={[0, 0, 0.025]}>
        <meshStandardMaterial color="#c9ccd2" metalness={0.95} roughness={0.28} />
      </RoundedBox>
      <Label text={cpuLabel(part)} position={[0, 0, 0.042]} height={0.04} color="#2a2d33" />
    </group>
  );
}

// ---------- Coolers ----------

const FIN_POSITIONS = Array.from({ length: 28 }, (_, i) => -0.56 + i * 0.0415);

export function Cooler({ part, layout, caseHeight }: { part: SelectedComponent; layout: SceneLayout; caseHeight: number }) {
  const runtime = useRuntime();
  const [x, y] = layout.socket;
  const { kind } = coolerVisual(part);

  const tubes = useMemo(() => {
    if (kind !== "liquid") return [];
    return [0.1, -0.1].map((offset) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x + 0.18, y + offset, BOARD_Z + 0.32),
        new THREE.Vector3(x + 0.9, y + offset + 0.25, 0.15),
        new THREE.Vector3(CASE_FRONT_X - 0.9, y + offset + 0.35, 0.2),
        new THREE.Vector3(CASE_FRONT_X - 0.46, y + offset + 0.5, 0.05),
      ]);
      return new THREE.TubeGeometry(curve, 40, 0.042, 10, false);
    });
  }, [kind, x, y]);
  useEffect(() => () => tubes.forEach((tube) => tube.dispose()), [tubes]);

  if (kind === "liquid") {
    const radiatorHeight = Math.min(caseHeight - SHROUD_TOP_Y - 0.25, 3.0);
    return (
      <group>
        {/* Pump head on the CPU */}
        <mesh position={[x, y, BOARD_Z + 0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.33, 0.26, 40]} />
          <meshStandardMaterial color="#14161a" metalness={0.8} roughness={0.28} />
        </mesh>
        <mesh position={[x, y, BOARD_Z + 0.345]} material={runtime.rgbMaterial}>
          <torusGeometry args={[0.24, 0.013, 10, 48]} />
        </mesh>
        {tubes.map((tube, i) => (
          <mesh key={i} geometry={tube}>
            <meshStandardMaterial color="#08090b" roughness={0.6} />
          </mesh>
        ))}
        {/* Front-mounted radiator */}
        <Box
          p={[CASE_FRONT_X - 0.42, SHROUD_TOP_Y + 0.15 + radiatorHeight / 2, 0]}
          s={[0.28, radiatorHeight, 1.24]}
          c="#191b20"
          metal={0.6}
          rough={0.5}
        />
      </group>
    );
  }

  return (
    <group position={[x, y, BOARD_Z + 0.1]}>
      <Box p={[0, 0, 0.05]} s={[0.38, 0.38, 0.1]} c="#a9adb5" metal={0.9} rough={0.3} />
      {/* Heat pipes */}
      {[-0.14, 0, 0.14].map((offset) => (
        <mesh key={offset} position={[offset, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 10]} />
          <meshStandardMaterial color="#c58a56" metalness={0.95} roughness={0.25} />
        </mesh>
      ))}
      {/* Fin stack */}
      {FIN_POSITIONS.map((z) => (
        <Box key={z} p={[0, 0, 0.82 + z]} s={[0.62, 1.2, 0.016]} c="#b8bcc4" metal={0.92} rough={0.32} />
      ))}
      <Box p={[0, 0, 1.27]} s={[0.64, 1.22, 0.03]} c="#1a1c21" metal={0.7} rough={0.4} />
      <Fan position={[0.42, 0, 0.82]} rotation={[0, Math.PI / 2, 0]} scale={0.98} frameColor="#111317" />
    </group>
  );
}

// ---------- Memory ----------

export function Memory({ part, layout }: { part: SelectedComponent; layout: SceneLayout }) {
  const runtime = useRuntime();
  const { sticks, isRgb } = ramVisual(part);

  // Dual-channel kits sit in alternating slots, furthest from the CPU.
  const slots =
    sticks >= 4 ? [0, 1, 2, 3].slice(0, layout.ramSlots) : layout.ramSlots >= 4 ? [1, 3].slice(0, sticks) : [0, 1].slice(0, sticks);

  return (
    <group>
      {slots.map((slot) => {
        const x = layout.ramX + slot * 0.1;
        return (
          <group key={slot} position={[x, layout.ramY, BOARD_Z + 0.26]}>
            <Box p={[0, 0, 0]} s={[0.045, 1.33, 0.34]} c="#191b20" metal={0.75} rough={0.34} />
            {isRgb ? (
              <mesh position={[0, 0, 0.18]} material={runtime.rgbMaterial}>
                <boxGeometry args={[0.03, 1.3, 0.035]} />
              </mesh>
            ) : (
              <Box p={[0, 0, 0.18]} s={[0.046, 1.33, 0.03]} c="#393d45" metal={0.8} rough={0.3} />
            )}
          </group>
        );
      })}
    </group>
  );
}

// ---------- Graphics card ----------

export function GraphicsCard({ part, layout }: { part: SelectedComponent; layout: SceneLayout }) {
  const runtime = useRuntime();
  const { fans, length, label } = gpuVisual(part);
  const left = layout.board.left;
  const body = 1.26;
  const thickness = 0.5;
  const cz = BOARD_Z + 0.06 + body / 2;
  const cx = left - 0.02 + length / 2;
  const cy = layout.pcieY - thickness / 2 - 0.06;
  const fanSpacing = length / fans;

  return (
    <group>
      {/* Shroud */}
      <RoundedBox args={[length, thickness, body]} radius={0.035} position={[cx, cy, cz]}>
        <meshStandardMaterial color="#2b2e35" metalness={0.72} roughness={0.36} />
      </RoundedBox>
      {/* Backplate */}
      <Box p={[cx, layout.pcieY - 0.025, cz]} s={[length - 0.02, 0.03, body - 0.02]} c="#2b2e35" metal={0.88} rough={0.28} />
      {/* Light bar and printed name on the side that faces the glass */}
      <mesh position={[cx, cy + 0.14, cz + body / 2 + 0.002]} material={runtime.rgbMaterial}>
        <boxGeometry args={[length - 0.12, 0.018, 0.005]} />
      </mesh>
      <Label text={label} position={[cx, cy - 0.04, cz + body / 2 + 0.006]} height={0.17} color="#eceef2" />
      {/* Fans face the case floor */}
      {Array.from({ length: fans }, (_, i) => (
        <Fan
          key={i}
          position={[left + fanSpacing * (i + 0.5), cy - thickness / 2 - 0.012, cz]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={Math.min(0.82, (fanSpacing - 0.06) / 1.2)}
          lit={false}
        />
      ))}
      {/* Mounting bracket */}
      <Box p={[left - 0.03, cy + 0.03, cz - 0.02]} s={[0.03, thickness + 0.1, body + 0.05]} c="#9b9fa8" metal={0.9} rough={0.35} />
    </group>
  );
}

// ---------- Storage ----------

export function Storage({ part, layout }: { part: SelectedComponent; layout: SceneLayout }) {
  const { kind } = storageVisual(part);

  if (kind === "drive") {
    return (
      <group position={[CASE_FRONT_X - 1.4, SHROUD_TOP_Y + 0.05, 0.35]}>
        <Box p={[0, 0, 0]} s={[1.0, 0.09, 0.7]} c="#23262c" metal={0.8} rough={0.35} />
        <Label text={(part.brand ?? "DRIVE").toUpperCase()} position={[0, 0.047, 0]} rotation={[-Math.PI / 2, 0, 0]} height={0.11} color="#d8dbe1" />
      </group>
    );
  }

  const [x, y] = layout.m2;
  return (
    <group position={[x, y, BOARD_Z + 0.04]}>
      <Box p={[0, 0, 0]} s={[0.8, 0.22, 0.02]} c="#0d0f13" rough={0.5} />
      <Box p={[0, 0, 0.022]} s={[0.76, 0.18, 0.022]} c="#2d3037" metal={0.85} rough={0.3} />
      <Label text={(part.brand ?? "NVME").toUpperCase()} position={[0, 0, 0.035]} height={0.07} color="#d8dbe1" />
    </group>
  );
}

// ---------- Power supply ----------

export function PowerSupply({ part }: { part: SelectedComponent }) {
  const watts = part.specs.psuWattage;
  return (
    <group position={[-1.5, 0.51, 0.02]}>
      <RoundedBox args={[1.45, 0.86, 1.5]} radius={0.02}>
        <meshStandardMaterial color="#2a2d34" metalness={0.55} roughness={0.5} />
      </RoundedBox>
      <Label
        text={watts ? `${watts}W` : (part.brand ?? "PSU").toUpperCase()}
        position={[0, 0.06, 0.755]}
        height={0.3}
        color="#eef0f4"
      />
      <Label text={(part.brand ?? "").toUpperCase()} position={[0, -0.2, 0.755]} height={0.09} color="#8a8f99" />
      {/* Modular cable sockets */}
      {[0, 1, 2].map((i) => (
        <Box key={i} p={[0.45, 0.28 - i * 0.14, 0.752]} s={[0.26, 0.09, 0.01]} c="#040506" />
      ))}
    </group>
  );
}

// ---------- Cables ----------

function Cable({ points, radius = 0.038, color = "#0c0d10" }: { points: Vec3[]; radius?: number; color?: string }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    return new THREE.TubeGeometry(curve, 36, radius, 8, false);
  }, [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} raycast={() => null}>
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}

/** Power cables appear once both ends exist: the motherboard always, the graphics card if fitted. */
export function PowerCables({ layout, hasGpu }: { layout: SceneLayout; hasGpu: boolean }) {
  const { left, width, top } = layout.board;
  const boardRight = left + width;
  const [sx, sy] = layout.socket;

  return (
    <group>
      {/* 24-pin to the motherboard edge */}
      <Cable
        radius={0.075}
        points={[
          [-0.85, 0.82, 0.77],
          [-0.2, 1.05, 0.45],
          [boardRight + 0.22, 1.5, -0.45],
          [boardRight + 0.2, top - 1.2, -0.72],
          [boardRight - 0.02, top - 1.2, BOARD_Z + 0.13],
        ]}
      />
      {/* 8-pin to the CPU power header */}
      <Cable
        radius={0.04}
        points={[
          [-1.5, 0.95, -0.55],
          [CASE_REAR_X + 0.1, 1.6, -0.82],
          [CASE_REAR_X + 0.09, top - 0.2, -0.82],
          [sx - 0.8, top - 0.05, BOARD_Z + 0.08],
        ]}
      />
      {hasGpu && (
        <Cable
          radius={0.05}
          points={[
            [-0.82, 0.9, 0.55],
            [0.1, 1.15, 0.55],
            [0.4, layout.pcieY - 0.72, 0.42],
            [0.35, layout.pcieY - 0.56, 0.3],
          ]}
        />
      )}
      <mesh position={[sx, sy, -5]} visible={false} />
    </group>
  );
}

// ---------- Monitor ----------

function useScreenTexture(lines: string[], isPowered: boolean) {
  const canvas = useMemo(() => {
    const element = document.createElement("canvas");
    element.width = 1024;
    element.height = 576;
    return element;
  }, []);
  const texture = useMemo(() => {
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, [canvas]);

  useEffect(() => {
    const context = canvas.getContext("2d")!;
    context.fillStyle = isPowered ? "#05070a" : "#010102";
    context.fillRect(0, 0, 1024, 576);
    if (isPowered) {
      context.font = "26px Consolas, 'Courier New', monospace";
      context.fillStyle = "#9fe8b8";
      lines.slice(-14).forEach((line, i) => context.fillText(line, 44, 64 + i * 36));
    }
    texture.needsUpdate = true;
  }, [canvas, lines, isPowered, texture]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export const MONITOR_X = -6.0;

export function MonitorDisplay({ part }: { part: SelectedComponent }) {
  const runtime = useRuntime();
  const screen = useScreenTexture(runtime.screenLines, runtime.isPowered);

  return (
    <group position={[MONITOR_X, 0, -0.6]} rotation={[0, 0.34, 0]}>
      <Box p={[0, 0.03, 0]} s={[1.9, 0.05, 1.3]} c="#17191e" metal={0.7} rough={0.4} />
      <Box p={[0, 0.7, -0.12]} s={[0.26, 1.3, 0.14]} c="#1c1e24" metal={0.7} rough={0.4} />
      <RoundedBox args={[6.05, 3.5, 0.14]} radius={0.04} position={[0, 2.95, 0]}>
        <meshStandardMaterial color="#0f1014" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 2.97, 0.073]}>
        <planeGeometry args={[5.88, 3.3]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <Label text={(part.brand ?? "").toUpperCase()} position={[0, 1.27, 0.073]} height={0.08} color="#6c717b" />
    </group>
  );
}
