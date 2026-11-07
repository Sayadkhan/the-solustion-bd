"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Edges, Environment, Grid, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import type { BuilderSlot, BuildSelection } from "@/stores/pc-builder-store";
import {
  BOARD_Z,
  CASE_DEPTH_Z,
  CASE_FRONT_X,
  CASE_REAR_X,
  SceneLayout,
  buildLayout,
  gpuVisual,
} from "./part-visuals";
import {
  Cooler,
  Cpu,
  GraphicsCard,
  Memory,
  MONITOR_X,
  MonitorDisplay,
  Motherboard,
  PcCase,
  PowerCables,
  PowerSupply,
  SceneContext,
  SceneRuntime,
  Storage,
} from "./pc-parts-3d";

export type PowerState = "off" | "booting" | "on" | "failed";

export interface PcSceneProps {
  selected: BuildSelection;
  conflicts: BuilderSlot[];
  power: PowerState;
  screenLines: string[];
  rgb: string;
  exploded: boolean;
  showGlass: boolean;
  focusSlot: BuilderSlot | null;
  viewResetKey: number;
  onSlotClick: (slot: BuilderSlot) => void;
  onSlotHover: (slot: BuilderSlot | null) => void;
}

// Which way each part travels when it is installed or the view is exploded.
const EXPLODE_DIRECTION: Record<BuilderSlot, [number, number, number]> = {
  CASE: [0, 0, 0],
  MOBO: [0, 0, 0.4],
  CPU: [0, 0, 1.5],
  COOLER: [0, 0.25, 3.3],
  RAM: [0.5, 0.2, 2.4],
  GPU: [0, -0.35, 3.0],
  STORAGE: [0, 0.1, 1.7],
  PSU: [-0.1, -0.1, 3.1],
  MONITOR: [-1, 0, 0],
};

interface Bounds {
  center: [number, number, number];
  size: [number, number, number];
}

/** Where each slot sits, used for the outlines of empty and conflicting parts. */
function slotBounds(layout: SceneLayout, selected: BuildSelection): Record<BuilderSlot, Bounds> {
  const { board, socket, ramX, ramY, ramSlots, pcieY, m2, caseHeight } = layout;
  const gpuLength = selected.GPU ? gpuVisual(selected.GPU).length : 2.8;
  const width = CASE_FRONT_X - CASE_REAR_X;

  return {
    CASE: { center: [0, caseHeight / 2, 0], size: [width, caseHeight, CASE_DEPTH_Z * 2] },
    MOBO: {
      center: [board.left + board.width / 2, board.top - board.height / 2, BOARD_Z],
      size: [board.width, board.height, 0.06],
    },
    CPU: { center: [socket[0], socket[1], BOARD_Z + 0.08], size: [0.44, 0.44, 0.1] },
    COOLER: { center: [socket[0], socket[1], BOARD_Z + 0.75], size: [1.05, 1.25, 1.3] },
    RAM: { center: [ramX + ((ramSlots - 1) * 0.1) / 2, ramY, BOARD_Z + 0.26], size: [ramSlots * 0.1 + 0.03, 1.36, 0.36] },
    GPU: {
      center: [board.left - 0.02 + gpuLength / 2, pcieY - 0.31, BOARD_Z + 0.69],
      size: [gpuLength, 0.5, 1.26],
    },
    STORAGE: { center: [m2[0], m2[1], BOARD_Z + 0.05], size: [0.84, 0.26, 0.07] },
    PSU: { center: [-1.5, 0.51, 0.02], size: [1.47, 0.88, 1.52] },
    MONITOR: { center: [MONITOR_X, 2.95, -0.6], size: [6.05, 3.5, 0.16] },
  };
}

function useReducedMotion() {
  return useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
}

/** Moves a part in on first appearance and out in the exploded view. */
function Slotted({
  slot,
  exploded,
  conflict,
  bounds,
  reducedMotion,
  onSlotClick,
  onSlotHover,
  children,
}: {
  slot: BuilderSlot;
  exploded: boolean;
  conflict: boolean;
  bounds: Bounds;
  reducedMotion: boolean;
  onSlotClick: (slot: BuilderSlot) => void;
  onSlotHover: (slot: BuilderSlot | null) => void;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const entry = useRef(reducedMotion ? 0 : 1);
  const spread = useRef(0);
  const outline = useRef<THREE.Group>(null);
  const direction = EXPLODE_DIRECTION[slot];

  useFrame(({ clock }, delta) => {
    entry.current = THREE.MathUtils.damp(entry.current, 0, 4.2, delta);
    spread.current = reducedMotion
      ? Number(exploded)
      : THREE.MathUtils.damp(spread.current, Number(exploded), 3.4, delta);

    const distance = entry.current * 2.4 + spread.current;
    group.current?.position.set(direction[0] * distance, direction[1] * distance, direction[2] * distance);

    if (outline.current) outline.current.visible = !reducedMotion ? Math.sin(clock.elapsedTime * 5) > -0.5 : true;
  });

  return (
    <group
      ref={group}
      onClick={(event) => {
        event.stopPropagation();
        onSlotClick(slot);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onSlotHover(slot);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onSlotHover(null);
        document.body.style.cursor = "";
      }}
    >
      {children}
      {conflict && (
        <group ref={outline}>
          <mesh position={bounds.center} raycast={() => null}>
            <boxGeometry args={bounds.size} />
            <meshBasicMaterial color="#ff3b4a" transparent opacity={0.14} depthWrite={false} />
            <Edges color="#ff3b4a" />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** An outline showing where a part still needs to go. */
function EmptySlot({
  slot,
  bounds,
  active,
  onSlotClick,
  onSlotHover,
}: {
  slot: BuilderSlot;
  bounds: Bounds;
  active: boolean;
  onSlotClick: (slot: BuilderSlot) => void;
  onSlotHover: (slot: BuilderSlot | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const highlighted = hovered || active;
  const color = highlighted ? "#7fb2ff" : "#4b6b98";

  return (
    <mesh
      position={bounds.center}
      onClick={(event) => {
        event.stopPropagation();
        onSlotClick(slot);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        onSlotHover(slot);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onSlotHover(null);
        document.body.style.cursor = "";
      }}
    >
      <boxGeometry args={bounds.size} />
      <meshBasicMaterial color={color} transparent opacity={highlighted ? 0.22 : 0.035} depthWrite={false} />
      <Edges color={color} />
    </mesh>
  );
}

const HOME_POSITION = new THREE.Vector3(-3.6, 5.4, 12.2);
const HOME_TARGET = new THREE.Vector3(0, 2.25, 0);
const WITH_MONITOR_POSITION = new THREE.Vector3(-6.2, 5.4, 16.2);
const WITH_MONITOR_TARGET = new THREE.Vector3(-2.7, 2.35, 0);

/** Eases the camera between views and sways gently until the visitor takes over. */
function CameraRig({
  focus,
  hasMonitor,
  resetKey,
  reducedMotion,
}: {
  focus: Bounds | null;
  hasMonitor: boolean;
  resetKey: number;
  reducedMotion: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsImpl | null;
  const aspect = useThree((state) => state.size.width / state.size.height);
  const moving = useRef(true);
  const userControlled = useRef(false);
  const goalPosition = useRef(HOME_POSITION.clone());
  const goalTarget = useRef(HOME_TARGET.clone());

  useEffect(() => {
    if (focus) {
      const target = new THREE.Vector3(...focus.center);
      const reach = Math.max(4.6, Math.max(...focus.size) * 2.6);
      goalTarget.current.copy(target);
      goalPosition.current.copy(target).add(new THREE.Vector3(-1.3, 1.5, reach));
    } else {
      goalTarget.current.copy(hasMonitor ? WITH_MONITOR_TARGET : HOME_TARGET);
      goalPosition.current.copy(hasMonitor ? WITH_MONITOR_POSITION : HOME_POSITION);
      // A tall phone screen shows less width, so the camera stands further back to fit the case.
      const fit = Math.max(1, 1.3 / aspect);
      goalPosition.current.sub(goalTarget.current).multiplyScalar(fit).add(goalTarget.current);
    }
    moving.current = true;
    userControlled.current = false;
  }, [focus, hasMonitor, resetKey, aspect]);

  useEffect(() => {
    if (!controls) return;
    const takeOver = () => {
      moving.current = false;
      userControlled.current = true;
    };
    (controls as unknown as THREE.EventDispatcher<{ start: object }>).addEventListener("start", takeOver);
    return () =>
      (controls as unknown as THREE.EventDispatcher<{ start: object }>).removeEventListener("start", takeOver);
  }, [controls]);

  useFrame(({ clock }, delta) => {
    if (!controls) return;

    if (moving.current) {
      const speed = reducedMotion ? 1000 : 3.2;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, goalPosition.current.x, speed, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, goalPosition.current.y, speed, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, goalPosition.current.z, speed, delta);
      controls.target.x = THREE.MathUtils.damp(controls.target.x, goalTarget.current.x, speed, delta);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, goalTarget.current.y, speed, delta);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, goalTarget.current.z, speed, delta);
      if (camera.position.distanceTo(goalPosition.current) < 0.02) moving.current = false;
      controls.update();
    } else if (!userControlled.current && !focus && !reducedMotion) {
      // Slow sway around the resting view, which shows the build is really 3D.
      const sway = Math.sin(clock.elapsedTime * 0.28) * 0.0009;
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, sway);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    }
  });

  return null;
}

/** Drives everything that follows the power state, once per frame. */
function PowerDriver({ power, rgb, runtime }: { power: PowerState; rgb: string; runtime: SceneRuntime }) {
  const glow = useRef(0.05);
  const caseLight = useRef<THREE.PointLight>(null);
  const color = useMemo(() => new THREE.Color(rgb), [rgb]);

  useEffect(() => {
    runtime.rgbMaterial.color.copy(color);
    runtime.rgbMaterial.emissive.copy(color);
  }, [color, runtime]);

  useFrame(({ clock }, delta) => {
    const isOn = power === "on" || power === "booting";
    const failed = power === "failed";

    runtime.fanSpeed.current = THREE.MathUtils.damp(runtime.fanSpeed.current, isOn ? 1 : 0, isOn ? 1.2 : 0.7, delta);

    // A failed start flashes red instead of showing the chosen colour.
    if (failed) {
      runtime.rgbMaterial.emissive.set("#ff2030");
      runtime.rgbMaterial.color.set("#ff2030");
    } else {
      runtime.rgbMaterial.emissive.copy(color);
      runtime.rgbMaterial.color.copy(color);
    }

    const target = failed ? (Math.sin(clock.elapsedTime * 9) > 0 ? 1.6 : 0.1) : isOn ? 1.35 : 0.12;
    glow.current = THREE.MathUtils.damp(glow.current, target, 3.5, delta);
    runtime.rgbMaterial.emissiveIntensity = glow.current;

    if (caseLight.current) {
      caseLight.current.intensity = Math.max(0, glow.current - 0.12) * 3.2;
      caseLight.current.color.copy(failed ? runtime.rgbMaterial.emissive : color);
    }
  });

  return <pointLight ref={caseLight} position={[0.3, 2.8, 0.35]} distance={7} decay={1.6} intensity={0} />;
}

/** Stops drawing when the stage is off screen or the tab is hidden. */
function usePauseWhenHidden(element: React.RefObject<HTMLDivElement | null>) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!element.current || typeof IntersectionObserver === "undefined") return;
    let onScreen = true;
    const update = () => setIsVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    observer.observe(element.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [element]);

  return isVisible;
}

export default function PcScene({
  selected,
  conflicts,
  power,
  screenLines,
  rgb,
  exploded,
  showGlass,
  focusSlot,
  viewResetKey,
  onSlotClick,
  onSlotHover,
}: PcSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const isVisible = usePauseWhenHidden(container);
  const reducedMotion = useReducedMotion();
  const layout = useMemo(() => buildLayout(selected), [selected]);
  const bounds = useMemo(() => slotBounds(layout, selected), [layout, selected]);

  const fanSpeed = useRef(0);
  const rgbMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: rgb, emissive: rgb, emissiveIntensity: 0.12, toneMapped: false }),
    // The material lives as long as the scene. PowerDriver applies later colour changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => () => rgbMaterial.dispose(), [rgbMaterial]);

  const runtime: SceneRuntime = useMemo(
    () => ({ rgbMaterial, fanSpeed, screenLines, isPowered: power === "on" || power === "booting" || power === "failed" }),
    [rgbMaterial, screenLines, power]
  );

  useEffect(() => () => void (document.body.style.cursor = ""), []);

  const slotProps = (slot: BuilderSlot) => ({
    slot,
    exploded,
    reducedMotion,
    conflict: conflicts.includes(slot),
    bounds: bounds[slot],
    onSlotClick,
    onSlotHover,
  });

  const emptySlot = (slot: BuilderSlot) =>
    !selected[slot] && (
      <EmptySlot
        key={`empty-${slot}`}
        slot={slot}
        bounds={bounds[slot]}
        active={focusSlot === slot}
        onSlotClick={onSlotClick}
        onSlotHover={onSlotHover}
      />
    );

  const { CASE, MOBO, CPU, COOLER, RAM, GPU, STORAGE, PSU, MONITOR } = selected;

  return (
    <div ref={container} className="absolute inset-0">
      <Canvas
        frameloop={isVisible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: HOME_POSITION.toArray(), fov: 30, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => onSlotHover(null)}
      >
        <SceneContext.Provider value={runtime}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[-4, 9, 8]} intensity={2.1} />
          <directionalLight position={[6, 3, 6]} intensity={0.9} color="#b9ceff" />
          {/* Fill inside the case, so parts stay readable with the power off */}
          <pointLight position={[-0.4, 3.2, 6]} intensity={26} distance={11} decay={1.5} color="#dfe7ff" />

          {/* Studio reflections generated locally, so no image is downloaded */}
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={3.5} position={[0, 6, 6]} scale={[12, 5, 1]} />
            <Lightformer form="rect" intensity={1.8} position={[-8, 3, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 4, 1]} color="#9db8ff" />
            <Lightformer form="rect" intensity={0.8} position={[8, 2, 3]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 4, 1]} color="#ffd9c2" />
          </Environment>

          <PowerDriver power={power} rgb={rgb} runtime={runtime} />

          {CASE && (
            <Slotted key={`CASE-${CASE.id}`} {...slotProps("CASE")}>
              <PcCase part={CASE} layout={layout} showGlass={showGlass && !exploded} />
            </Slotted>
          )}
          {MOBO && (
            <Slotted key={`MOBO-${MOBO.id}`} {...slotProps("MOBO")}>
              <Motherboard part={MOBO} layout={layout} />
            </Slotted>
          )}
          {CPU && (
            <Slotted key={`CPU-${CPU.id}`} {...slotProps("CPU")}>
              <Cpu part={CPU} layout={layout} />
            </Slotted>
          )}
          {COOLER && (
            <Slotted key={`COOLER-${COOLER.id}`} {...slotProps("COOLER")}>
              <Cooler part={COOLER} layout={layout} caseHeight={layout.caseHeight} />
            </Slotted>
          )}
          {RAM && (
            <Slotted key={`RAM-${RAM.id}`} {...slotProps("RAM")}>
              <Memory part={RAM} layout={layout} />
            </Slotted>
          )}
          {GPU && (
            <Slotted key={`GPU-${GPU.id}`} {...slotProps("GPU")}>
              <GraphicsCard part={GPU} layout={layout} />
            </Slotted>
          )}
          {STORAGE && (
            <Slotted key={`STORAGE-${STORAGE.id}`} {...slotProps("STORAGE")}>
              <Storage part={STORAGE} layout={layout} />
            </Slotted>
          )}
          {PSU && (
            <Slotted key={`PSU-${PSU.id}`} {...slotProps("PSU")}>
              <PowerSupply part={PSU} />
            </Slotted>
          )}
          {MONITOR && (
            <Slotted key={`MONITOR-${MONITOR.id}`} {...slotProps("MONITOR")}>
              <MonitorDisplay part={MONITOR} />
            </Slotted>
          )}

          {PSU && MOBO && !exploded && <PowerCables layout={layout} hasGpu={Boolean(GPU)} />}

          {!exploded && (["CASE", "MOBO", "CPU", "RAM", "GPU", "STORAGE", "PSU"] as BuilderSlot[]).map(emptySlot)}

          <ContactShadows
            key={Object.keys(selected).sort().join() + layout.caseHeight}
            position={[-0.5, -0.11, 0]}
            scale={24}
            resolution={512}
            blur={2.6}
            opacity={0.7}
            far={7}
            frames={1}
            color="#000000"
          />
          <Grid
            position={[0, -0.12, 0]}
            args={[60, 60]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#1b2230"
            sectionSize={2.5}
            sectionThickness={0.9}
            sectionColor="#2a3448"
            fadeDistance={26}
            fadeStrength={1.6}
            infiniteGrid
          />

          <CameraRig
            focus={focusSlot ? bounds[focusSlot] : null}
            hasMonitor={Boolean(MONITOR)}
            resetKey={viewResetKey}
            reducedMotion={reducedMotion}
          />
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={3.5}
            maxDistance={32}
            maxPolarAngle={Math.PI * 0.53}
            target={HOME_TARGET.toArray()}
            enableDamping
            dampingFactor={0.08}
          />
        </SceneContext.Provider>
      </Canvas>
    </div>
  );
}
