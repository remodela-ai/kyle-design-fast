import { useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { KitchenLayout3D, KitchenElement3D } from "@/types/kitchen3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Box,
  Download,
} from "lucide-react";

type ViewMode = "perspective" | "top" | "front" | "back" | "left" | "right";

interface KitchenViewer3DProps {
  layout: KitchenLayout3D;
}

const SCALE = 0.01;
function cm(v: number) { return v * SCALE; }

/* ─── Element-specific geometry shapes ─── */

function FaucetShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh position={[0, -h * 0.35, 0]}>
        <cylinderGeometry args={[w * 0.4, w * 0.5, h * 0.15, 12]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[w * 0.12, w * 0.12, h * 0.7, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, h * 0.3, d * 0.2]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[w * 0.08, w * 0.1, d * 0.5, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function SinkShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, h * 0.1, 0]}>
        <boxGeometry args={[w * 0.85, h * 0.8, d * 0.85]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} transparent opacity={opacity} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function StoveShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {[[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]].map(([bx, bz], i) => (
        <mesh key={i} position={[w * bx, h * 0.51, d * bz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w * 0.06, w * 0.1, 16]} />
          <meshStandardMaterial color="#222" transparent opacity={opacity} />
        </mesh>
      ))}
      <mesh position={[0, -h * 0.1, d * 0.501]}>
        <planeGeometry args={[w * 0.85, h * 0.55]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.85)} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function RangeHoodShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h * 0.6, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, h * 0.45, 0]}>
        <boxGeometry args={[w * 0.4, h * 0.3, d * 0.5]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function RefrigeratorShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, h * 0.1, d * 0.501]}>
        <planeGeometry args={[w * 0.95, 0.003]} />
        <meshBasicMaterial color="#333" transparent opacity={opacity} />
      </mesh>
      <mesh position={[w * 0.4, h * 0.15, d * 0.52]}>
        <boxGeometry args={[0.01, h * 0.25, 0.015]} />
        <meshStandardMaterial color="#999" transparent opacity={opacity} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function PendantLightShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh position={[0, h * 0.35, 0]}>
        <cylinderGeometry args={[0.003, 0.003, h * 0.5, 4]} />
        <meshBasicMaterial color="#333" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[w * 0.15, w * 0.35, h * 0.4, 12, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={opacity * 0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -h * 0.05, 0]}>
        <sphereGeometry args={[w * 0.1, 8, 8]} />
        <meshStandardMaterial color="#FFF8E1" emissive="#FFD700" emissiveIntensity={0.5} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function ChairShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  const legH = h * 0.45;
  const seatH = h * 0.06;
  const backH = h * 0.45;
  return (
    <group>
      <mesh position={[0, legH + seatH / 2 - h / 2, 0]}>
        <boxGeometry args={[w, seatH, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, legH + seatH + backH / 2 - h / 2, -d * 0.4]}>
        <boxGeometry args={[w * 0.9, backH, d * 0.08]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([lx, lz], i) => (
        <mesh key={i} position={[w * 0.35 * lx, legH / 2 - h / 2, d * 0.35 * lz]}>
          <cylinderGeometry args={[0.012, 0.012, legH, 6]} />
          <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8)} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

function BarStoolShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh position={[0, h * 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[w * 0.45, w * 0.45, h * 0.06, 12]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[w * 0.06, w * 0.06, h * 0.7, 8]} />
        <meshStandardMaterial color="#666" transparent opacity={opacity} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -h * 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[w * 0.25, 0.008, 6, 16]} />
        <meshStandardMaterial color="#666" transparent opacity={opacity} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -h * 0.45, 0]}>
        <cylinderGeometry args={[w * 0.35, w * 0.4, h * 0.04, 12]} />
        <meshStandardMaterial color="#555" transparent opacity={opacity} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CabinetShape({ w, h, d, color, opacity, isUpper }: { w: number; h: number; d: number; color: THREE.Color; opacity: number; isUpper: boolean }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0, d * 0.501]}>
        <planeGeometry args={[0.002, h * 0.9]} />
        <meshBasicMaterial color="#5a4a3a" transparent opacity={opacity * 0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[w * 0.05 * side, isUpper ? -h * 0.15 : h * 0.15, d * 0.52]}>
          <boxGeometry args={[0.008, h * 0.08, 0.012]} />
          <meshStandardMaterial color="#8B7355" transparent opacity={opacity} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function CountertopShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <mesh>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} metalness={0.3} roughness={0.6} />
    </mesh>
  );
}

function BacksplashShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {Array.from({ length: Math.floor(h / 0.05) }, (_, i) => (
        <mesh key={`h${i}`} position={[0, -h / 2 + (i + 1) * 0.05, d * 0.501]}>
          <planeGeometry args={[w * 0.98, 0.001]} />
          <meshBasicMaterial color="#ccc" transparent opacity={opacity * 0.4} />
        </mesh>
      ))}
    </group>
  );
}

function FlooringShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function IslandShape({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <group>
      <mesh position={[0, -h * 0.02, 0]}>
        <boxGeometry args={[w, h * 0.96, d]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, h * 0.48, 0]}>
        <boxGeometry args={[w * 1.05, h * 0.04, d * 1.05]} />
        <meshStandardMaterial color={new THREE.Color("#D4D4D4")} transparent opacity={opacity} metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

function GenericBox({ w, h, d, color, opacity }: { w: number; h: number; d: number; color: THREE.Color; opacity: number }) {
  return (
    <mesh>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

/* ─── Element renderer that picks shape by category ─── */

function KitchenElementBox({ element, isHovered, onHover, onUnhover }: {
  element: KitchenElement3D; isHovered: boolean; onHover: () => void; onUnhover: () => void;
}) {
  const { dimensions, position, color, label, categoryId } = element;
  const w = cm(dimensions.width);
  const h = cm(dimensions.height);
  const d = cm(dimensions.depth);
  const px = cm(position.x) + w / 2;
  const py = cm(position.y) + h / 2;
  const pz = cm(position.z) + d / 2;
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const baseOpacity = isHovered ? 0.95 : 0.85;
  const catLower = categoryId.toLowerCase();
  const labelLower = label.toLowerCase();

  function renderShape() {
    if (labelLower.includes("faucet") || catLower === "faucet") return <FaucetShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("sink") || catLower === "sink") return <SinkShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("stove") || labelLower.includes("range") && !labelLower.includes("hood")) {
      if (catLower === "range" || catLower === "stove") return <StoveShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    }
    if (labelLower.includes("hood") || catLower === "hood") return <RangeHoodShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("refrigerator") || labelLower.includes("fridge") || catLower === "refrigerator") return <RefrigeratorShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("pendant") || labelLower.includes("lighting") || catLower === "lighting") return <PendantLightShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("bar stool") || labelLower.includes("barstool")) return <BarStoolShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("chair") || catLower === "chair") return <ChairShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (catLower === "top_cabinet" || (labelLower.includes("upper") && labelLower.includes("cabinet"))) return <CabinetShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} isUpper />;
    if (catLower === "bottom_cabinet" || (labelLower.includes("base") && labelLower.includes("cabinet"))) return <CabinetShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} isUpper={false} />;
    if (labelLower.includes("island") && !labelLower.includes("counter top")) return <IslandShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("countertop") || labelLower.includes("counter top") || catLower === "countertop") return <CountertopShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("backsplash") || catLower === "backsplash") return <BacksplashShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("flooring") || catLower === "flooring") return <FlooringShape w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
    if (labelLower.includes("wall") || catLower === "wall_color") return <GenericBox w={w} h={h} d={d} color={threeColor} opacity={0.08} />;
    return <GenericBox w={w} h={h} d={d} color={threeColor} opacity={baseOpacity} />;
  }

  return (
    <group>
      <group position={[px, py, pz]} onPointerOver={(e) => { e.stopPropagation(); onHover(); }} onPointerOut={onUnhover}>
        {renderShape()}
      </group>
      {!labelLower.includes("wall") && !labelLower.includes("flooring") && !labelLower.includes("pendant") && (
        <mesh position={[px, py, pz]}>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial color="#555" wireframe transparent opacity={isHovered ? 0.5 : 0.2} />
        </mesh>
      )}
      {isHovered && (
        <Text position={[px, py + h / 2 + 0.06, pz]} fontSize={0.07} color="#222" anchorX="center" anchorY="bottom" outlineWidth={0.004} outlineColor="#fff" font={undefined}>
          {`${label}\n${dimensions.width}x${dimensions.height}x${dimensions.depth}cm`}
        </Text>
      )}
    </group>
  );
}

/* ─── Room shell ─── */

function RoomShell({ room }: { room: KitchenLayout3D["room"] }) {
  const w = cm(room.width);
  const h = cm(room.height);
  const d = cm(room.depth);

  return (
    <group>
      <mesh position={[w / 2, 0, d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#E8E0D0" side={THREE.DoubleSide} transparent opacity={0.35} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#F5F0E8" side={THREE.DoubleSide} transparent opacity={0.08} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#F0EBE3" side={THREE.DoubleSide} transparent opacity={0.08} />
      </mesh>
      <mesh position={[w, h / 2, d / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#F0EBE3" side={THREE.DoubleSide} transparent opacity={0.08} />
      </mesh>

      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0, w, 0, 0, w, h, 0, 0, h, 0, 0, 0, 0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#aaa" transparent opacity={0.4} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0, 0, 0, d, 0, h, d, 0, h, 0, 0, 0, 0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#aaa" transparent opacity={0.4} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([w, 0, 0, w, 0, d, w, h, d, w, h, 0, w, 0, 0]), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#aaa" transparent opacity={0.4} />
      </line>

      <gridHelper args={[Math.max(w, d) * 1.2, 20, "#ccc", "#eee"]} position={[w / 2, 0.001, d / 2]} />

      <Text position={[w / 2, -0.05, d + 0.12]} fontSize={0.06} color="#666" anchorX="center">{`${room.width}cm`}</Text>
      <Text position={[-0.12, h / 2, 0]} fontSize={0.06} color="#666" anchorX="right" rotation={[0, 0, Math.PI / 2]}>{`${room.height}cm`}</Text>
      <Text position={[w + 0.12, -0.05, d / 2]} fontSize={0.06} color="#666" anchorX="left" rotation={[0, -Math.PI / 2, 0]}>{`${room.depth}cm`}</Text>
    </group>
  );
}

/* ─── Camera controller ─── */

function CameraController({ viewMode, room }: { viewMode: ViewMode; room: KitchenLayout3D["room"] }) {
  const { camera } = useThree();
  const w = cm(room.width);
  const h = cm(room.height);
  const d = cm(room.depth);
  const cx = w / 2;
  const cy = h / 2;
  const cz = d / 2;
  const maxDim = Math.max(w, h, d);

  useMemo(() => {
    switch (viewMode) {
      case "top":
        camera.position.set(cx, maxDim * 2.5, cz);
        camera.lookAt(cx, 0, cz);
        break;
      case "front":
        camera.position.set(cx, cy, d + maxDim * 1.2);
        camera.lookAt(cx, cy, cz);
        break;
      case "back":
        camera.position.set(cx, cy, -maxDim * 1.2);
        camera.lookAt(cx, cy, cz);
        break;
      case "left":
        camera.position.set(-maxDim * 1.2, cy, cz);
        camera.lookAt(cx, cy, cz);
        break;
      case "right":
        camera.position.set(w + maxDim * 1.2, cy, cz);
        camera.lookAt(cx, cy, cz);
        break;
      case "perspective":
      default:
        camera.position.set(w + maxDim * 0.6, h + maxDim * 0.4, d + maxDim * 0.6);
        camera.lookAt(cx, cy * 0.7, cz);
        break;
    }
    camera.updateProjectionMatrix();
  }, [viewMode, camera, cx, cy, cz, w, h, d, maxDim]);

  return null;
}

/* ─── Main 3D scene ─── */

function KitchenScene({ layout, hoveredId, setHoveredId, viewMode }: {
  layout: KitchenLayout3D; hoveredId: string | null; setHoveredId: (id: string | null) => void; viewMode: ViewMode;
}) {
  return (
    <>
      <CameraController viewMode={viewMode} room={layout.room} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.9} castShadow />
      <directionalLight position={[-3, 6, -2]} intensity={0.4} />
      <pointLight position={[cm(layout.room.width) / 2, cm(layout.room.height) * 0.9, cm(layout.room.depth) / 2]} intensity={0.3} />
      <RoomShell room={layout.room} />
      {layout.elements.map((el) => (
        <KitchenElementBox key={el.id} element={el} isHovered={hoveredId === el.id} onHover={() => setHoveredId(el.id)} onUnhover={() => setHoveredId(null)} />
      ))}
      <OrbitControls enablePan enableZoom enableRotate={viewMode === "perspective"} maxPolarAngle={Math.PI / 2} />
    </>
  );
}

const VIEW_BUTTONS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: "perspective", label: "3D", icon: <Box className="h-4 w-4" /> },
  { mode: "top", label: "Top", icon: <ArrowDown className="h-4 w-4" /> },
  { mode: "front", label: "Front", icon: <Eye className="h-4 w-4" /> },
  { mode: "back", label: "Back", icon: <ArrowUp className="h-4 w-4" /> },
  { mode: "left", label: "Left", icon: <ArrowLeft className="h-4 w-4" /> },
  { mode: "right", label: "Right", icon: <ArrowRight className="h-4 w-4" /> },
];

export default function KitchenViewer3D({ layout }: KitchenViewer3DProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("perspective");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `kitchen-3d-${viewMode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [viewMode]);

  const hoveredElement = useMemo(
    () => layout.elements.find((el) => el.id === hoveredId),
    [layout.elements, hoveredId]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b bg-background/80 backdrop-blur">
        <div className="flex items-center gap-1">
          {VIEW_BUTTONS.map(({ mode, label, icon }) => (
            <Button key={mode} variant={viewMode === mode ? "default" : "outline"} size="sm" onClick={() => setViewMode(mode)} className="gap-1.5">
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {hoveredElement && (
            <Badge variant="secondary" className="text-xs">
              {hoveredElement.label}: {hoveredElement.dimensions.width}x{hoveredElement.dimensions.height}x{hoveredElement.dimensions.depth}cm
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export PNG</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-gradient-to-b from-slate-50 to-slate-100" style={{ minHeight: 450 }}>
        <Canvas ref={canvasRef} gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ fov: 45, near: 0.01, far: 200 }}>
          <KitchenScene layout={layout} hoveredId={hoveredId} setHoveredId={setHoveredId} viewMode={viewMode} />
        </Canvas>
        <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded text-sm font-medium">
          {viewMode === "perspective" ? "3D Perspective" : `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View`}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={layout.confidence === "high" ? "default" : layout.confidence === "medium" ? "secondary" : "destructive"}>
            {layout.confidence} confidence
          </Badge>
        </div>
      </div>

      <div className="p-3 border-t bg-background/80 backdrop-blur max-h-32 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5">
          {layout.elements.map((el) => (
            <div
              key={el.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] cursor-pointer transition-all ${
                hoveredId === el.id ? "ring-2 ring-primary bg-primary/10" : "bg-muted hover:bg-muted/80"
              }`}
              onMouseEnter={() => setHoveredId(el.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="w-3 h-3 rounded-sm border border-border shrink-0" style={{ backgroundColor: el.color }} />
              <span className="truncate max-w-[120px]">{el.label}</span>
              <span className="text-muted-foreground shrink-0">{el.dimensions.width}x{el.dimensions.height}cm</span>
            </div>
          ))}
        </div>
        {layout.notes && <p className="text-xs text-muted-foreground mt-2">{layout.notes}</p>}
      </div>
    </div>
  );
}
