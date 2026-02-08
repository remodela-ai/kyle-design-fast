import { useRef, useState, useMemo, useCallback } from "react";
import type { KitchenLayout3D, KitchenElement3D } from "@/types/kitchen3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Ruler,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

type PlanView = "floor" | "front" | "back" | "left" | "right";
type DimSize = "S" | "M" | "L" | "XL";

interface FloorPlan2DProps {
  layout: KitchenLayout3D;
}

/* ─── Dimension size presets ─── */
const DIM_SIZE_CONFIG: Record<DimSize, { fontSize: number; offset: number; tickLen: number; arrowSize: number; lineWidth: number; label: string }> = {
  S:  { fontSize: 7,  offset: 10, tickLen: 3, arrowSize: 4, lineWidth: 0.5, label: "Small" },
  M:  { fontSize: 9,  offset: 15, tickLen: 5, arrowSize: 5, lineWidth: 0.8, label: "Medium" },
  L:  { fontSize: 12, offset: 22, tickLen: 7, arrowSize: 7, lineWidth: 1.0, label: "Large" },
  XL: { fontSize: 15, offset: 30, tickLen: 9, arrowSize: 9, lineWidth: 1.3, label: "Extra Large" },
};

/* ─── Unit conversion ─── */
function cmToMm(cm: number): number { return Math.round(cm * 10); }
function cmToInches(cm: number): string { return (cm / 2.54).toFixed(1); }
function formatDim(cm: number, useInches: boolean): string {
  return useInches ? `${cmToInches(cm)}"` : `${cmToMm(cm)}`;
}
function unitLabel(useInches: boolean): string {
  return useInches ? "inches" : "mm";
}

/* ─── Confidence scoring per element ─── */
function getElementConfidence(el: KitchenElement3D): { grade: "A" | "B" | "C" | "D"; label: string; color: string } {
  const labelLower = el.label.toLowerCase();
  if (labelLower.includes("range") || labelLower.includes("stove") || labelLower.includes("dishwasher") || labelLower.includes("refrigerator") || labelLower.includes("fridge")) {
    return { grade: "A", label: "High", color: "#16a34a" };
  }
  if (labelLower.includes("cabinet") || labelLower.includes("countertop") || labelLower.includes("counter top")) {
    return { grade: "B", label: "Good", color: "#2563eb" };
  }
  if (labelLower.includes("sink") || labelLower.includes("hood") || labelLower.includes("backsplash")) {
    return { grade: "B", label: "Good", color: "#2563eb" };
  }
  if (labelLower.includes("lighting") || labelLower.includes("pendant") || labelLower.includes("chair") || labelLower.includes("stool")) {
    return { grade: "C", label: "Moderate", color: "#d97706" };
  }
  return { grade: "C", label: "Moderate", color: "#d97706" };
}

/* ─── Color palette for elements ─── */
const PLAN_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  faucet:       { fill: "#B0C4DE", stroke: "#4682B4", label: "Faucet" },
  sink:         { fill: "#87CEEB", stroke: "#4169E1", label: "Sink" },
  range:        { fill: "#CD5C5C", stroke: "#8B0000", label: "Range/Stove" },
  stove:        { fill: "#CD5C5C", stroke: "#8B0000", label: "Stove" },
  hood:         { fill: "#C0C0C0", stroke: "#696969", label: "Range Hood" },
  refrigerator: { fill: "#778899", stroke: "#2F4F4F", label: "Refrigerator" },
  top_cabinet:  { fill: "#DEB887", stroke: "#8B7355", label: "Upper Cabinet" },
  bottom_cabinet: { fill: "#D2B48C", stroke: "#8B6914", label: "Base Cabinet" },
  countertop:   { fill: "#DCDCDC", stroke: "#808080", label: "Countertop" },
  backsplash:   { fill: "#F5DEB3", stroke: "#BDB76B", label: "Backsplash" },
  flooring:     { fill: "#F5F5DC", stroke: "#D2B48C", label: "Flooring" },
  lighting:     { fill: "#FFD700", stroke: "#DAA520", label: "Pendant Light" },
  chair:        { fill: "#BC8F8F", stroke: "#8B4513", label: "Chair" },
  bar_stool:    { fill: "#A0522D", stroke: "#6B3A2A", label: "Bar Stool" },
  island:       { fill: "#BDB76B", stroke: "#6B6B3A", label: "Island" },
  wall_color:   { fill: "none", stroke: "#999", label: "Wall" },
  default:      { fill: "#E0E0E0", stroke: "#666", label: "Element" },
};

function getElementStyle(el: KitchenElement3D) {
  const labelLower = el.label.toLowerCase();
  if (labelLower.includes("faucet")) return PLAN_COLORS.faucet;
  if (labelLower.includes("sink")) return PLAN_COLORS.sink;
  if (labelLower.includes("hood")) return PLAN_COLORS.hood;
  if (labelLower.includes("stove") || (labelLower.includes("range") && !labelLower.includes("hood"))) return PLAN_COLORS.range;
  if (labelLower.includes("refrigerator") || labelLower.includes("fridge")) return PLAN_COLORS.refrigerator;
  if (labelLower.includes("pendant") || labelLower.includes("lighting")) return PLAN_COLORS.lighting;
  if (labelLower.includes("bar stool") || labelLower.includes("barstool")) return PLAN_COLORS.bar_stool;
  if (labelLower.includes("chair")) return PLAN_COLORS.chair;
  if (labelLower.includes("upper") && labelLower.includes("cabinet")) return PLAN_COLORS.top_cabinet;
  if (labelLower.includes("base") && labelLower.includes("cabinet")) return PLAN_COLORS.bottom_cabinet;
  if (labelLower.includes("island") && !labelLower.includes("counter top")) return PLAN_COLORS.island;
  if (labelLower.includes("countertop") || labelLower.includes("counter top")) return PLAN_COLORS.countertop;
  if (labelLower.includes("backsplash")) return PLAN_COLORS.backsplash;
  if (labelLower.includes("flooring")) return PLAN_COLORS.flooring;
  if (labelLower.includes("wall")) return PLAN_COLORS.wall_color;
  const catLower = el.categoryId.toLowerCase();
  if (catLower in PLAN_COLORS) return PLAN_COLORS[catLower];
  return PLAN_COLORS.default;
}

/* ─── Dimension line drawing ─── */
function DimensionLine({ x1, y1, x2, y2, label, offset = 15, color = "#333", fontSize = 10, tickLen = 5, arrowSize = 6, lineWidth = 0.8 }: {
  x1: number; y1: number; x2: number; y2: number;
  label: string; offset?: number; color?: string; fontSize?: number;
  tickLen?: number; arrowSize?: number; lineWidth?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return null;

  const nx = -dy / len;
  const ny = dx / len;

  const ox1 = x1 + nx * offset;
  const oy1 = y1 + ny * offset;
  const ox2 = x2 + nx * offset;
  const oy2 = y2 + ny * offset;

  const mx = (ox1 + ox2) / 2;
  const my = (oy1 + oy2) / 2;

  const angle = Math.atan2(oy2 - oy1, ox2 - ox1) * (180 / Math.PI);
  const textAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

  return (
    <g>
      <line x1={x1} y1={y1} x2={ox1} y2={oy1} stroke={color} strokeWidth={lineWidth * 0.6} strokeDasharray="2,2" />
      <line x1={x2} y1={y2} x2={ox2} y2={oy2} stroke={color} strokeWidth={lineWidth * 0.6} strokeDasharray="2,2" />
      <line x1={ox1} y1={oy1} x2={ox2} y2={oy2} stroke={color} strokeWidth={lineWidth} />
      <line x1={ox1 - nx * tickLen} y1={oy1 - ny * tickLen} x2={ox1 + nx * tickLen} y2={oy1 + ny * tickLen} stroke={color} strokeWidth={lineWidth} />
      <line x1={ox2 - nx * tickLen} y1={oy2 - ny * tickLen} x2={ox2 + nx * tickLen} y2={oy2 + ny * tickLen} stroke={color} strokeWidth={lineWidth} />
      <polygon points={`${ox1},${oy1} ${ox1 + dx / len * arrowSize + nx * arrowSize * 0.5},${oy1 + dy / len * arrowSize + ny * arrowSize * 0.5} ${ox1 + dx / len * arrowSize - nx * arrowSize * 0.5},${oy1 + dy / len * arrowSize - ny * arrowSize * 0.5}`} fill={color} />
      <polygon points={`${ox2},${oy2} ${ox2 - dx / len * arrowSize + nx * arrowSize * 0.5},${oy2 - dy / len * arrowSize + ny * arrowSize * 0.5} ${ox2 - dx / len * arrowSize - nx * arrowSize * 0.5},${oy2 - dy / len * arrowSize - ny * arrowSize * 0.5}`} fill={color} />
      <text x={mx} y={my - 3} textAnchor="middle" dominantBaseline="auto" fontSize={fontSize} fontFamily="monospace" fill={color} transform={`rotate(${textAngle}, ${mx}, ${my - 3})`}>
        {label}
      </text>
    </g>
  );
}

/* ─── Visibility / Occlusion logic per view ─── */
function getVisibleElements(elements: KitchenElement3D[], view: PlanView, room: KitchenLayout3D["room"]): KitchenElement3D[] {
  const filtered = elements.filter(el => {
    const labelLower = el.label.toLowerCase();
    if (labelLower.includes("wall color") || el.categoryId === "wall_color") return false;
    if ((labelLower.includes("flooring") || el.categoryId === "flooring") && view !== "floor") return false;
    return true;
  });

  if (view === "floor") return filtered;

  const sorted = [...filtered];
  switch (view) {
    case "front":
      sorted.sort((a, b) => (b.position.z + b.dimensions.depth) - (a.position.z + a.dimensions.depth));
      break;
    case "back":
      sorted.sort((a, b) => a.position.z - b.position.z);
      break;
    case "left":
      sorted.sort((a, b) => a.position.x - b.position.x);
      break;
    case "right":
      sorted.sort((a, b) => (b.position.x + b.dimensions.width) - (a.position.x + a.dimensions.width));
      break;
  }
  return sorted;
}

function getDepthForView(el: KitchenElement3D, view: PlanView): number {
  switch (view) {
    case "front": return -(el.position.z + el.dimensions.depth / 2);
    case "back":  return el.position.z + el.dimensions.depth / 2;
    case "left":  return el.position.x + el.dimensions.width / 2;
    case "right": return -(el.position.x + el.dimensions.width / 2);
    default: return 0;
  }
}

function getProjection(el: KitchenElement3D, view: PlanView, roomWidth: number, roomDepth: number): { x: number; y: number; w: number; h: number; realW: number; realH: number } {
  const { position: p, dimensions: dim } = el;
  switch (view) {
    case "floor":
      return { x: p.x, y: p.z, w: dim.width, h: dim.depth, realW: dim.width, realH: dim.depth };
    case "front":
      return { x: p.x, y: p.y, w: dim.width, h: dim.height, realW: dim.width, realH: dim.height };
    case "back":
      return { x: roomWidth - p.x - dim.width, y: p.y, w: dim.width, h: dim.height, realW: dim.width, realH: dim.height };
    case "left":
      return { x: p.z, y: p.y, w: dim.depth, h: dim.height, realW: dim.depth, realH: dim.height };
    case "right":
      return { x: roomDepth - p.z - dim.depth, y: p.y, w: dim.depth, h: dim.height, realW: dim.depth, realH: dim.height };
    default:
      return { x: p.x, y: p.y, w: dim.width, h: dim.height, realW: dim.width, realH: dim.height };
  }
}

function getRoomProjection(room: KitchenLayout3D["room"], view: PlanView): { w: number; h: number } {
  switch (view) {
    case "floor": return { w: room.width, h: room.depth };
    case "front": case "back": return { w: room.width, h: room.height };
    case "left": case "right": return { w: room.depth, h: room.height };
    default: return { w: room.width, h: room.height };
  }
}

/* ─── SVG Plan Renderer ─── */
function PlanSVG({ layout, view, useInches, zoom, isOpaque, dimSize, showConfidence }: {
  layout: KitchenLayout3D; view: PlanView; useInches: boolean; zoom: number;
  isOpaque: boolean; dimSize: DimSize; showConfidence: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const roomProj = getRoomProjection(layout.room, view);
  const MARGIN = 80;
  const SCALE = zoom;
  const dimCfg = DIM_SIZE_CONFIG[dimSize];

  const svgW = roomProj.w * SCALE + MARGIN * 2;
  const svgH = roomProj.h * SCALE + MARGIN * 2 + 50;

  const elements = getVisibleElements(layout.elements, view, layout.room);

  const sortedElements = useMemo(() => {
    if (view === "floor") return elements;
    return [...elements].sort((a, b) => getDepthForView(b, view) - getDepthForView(a, view));
  }, [elements, view]);

  const isElevation = view !== "floor";

  function toSvgX(cmX: number) { return MARGIN + cmX * SCALE; }
  function toSvgY(cmY: number) {
    if (isElevation) return MARGIN + (roomProj.h - cmY) * SCALE;
    return MARGIN + cmY * SCALE;
  }

  const viewLabels: Record<PlanView, string> = {
    floor: "FLOOR PLAN",
    front: "FRONT ELEVATION (Looking from front)",
    back: "REAR ELEVATION (Looking from back)",
    left: "LEFT SIDE ELEVATION (Looking from left)",
    right: "RIGHT SIDE ELEVATION (Looking from right)",
  };

  const fillOpacity = isOpaque ? 0.9 : 0.45;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" style={{ background: "#fff" }}>
      <text x={svgW / 2} y={20} textAnchor="middle" fontSize={14} fontFamily="monospace" fontWeight="bold" fill="#333">{viewLabels[view]}</text>
      <text x={svgW / 2} y={35} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#666">
        Scale: 1:{Math.round(1 / SCALE * 10)} | Units: {unitLabel(useInches)} | Dimensions: {DIM_SIZE_CONFIG[dimSize].label}
      </text>

      <rect x={MARGIN} y={MARGIN} width={roomProj.w * SCALE} height={roomProj.h * SCALE} fill="none" stroke="#333" strokeWidth={2} />

      <DimensionLine x1={MARGIN} y1={MARGIN + roomProj.h * SCALE} x2={MARGIN + roomProj.w * SCALE} y2={MARGIN + roomProj.h * SCALE} label={formatDim(roomProj.w, useInches)} offset={dimCfg.offset + 10} color="#0066CC" fontSize={dimCfg.fontSize + 2} tickLen={dimCfg.tickLen} arrowSize={dimCfg.arrowSize} lineWidth={dimCfg.lineWidth} />
      <DimensionLine x1={MARGIN} y1={MARGIN} x2={MARGIN} y2={MARGIN + roomProj.h * SCALE} label={formatDim(roomProj.h, useInches)} offset={-(dimCfg.offset + 10)} color="#0066CC" fontSize={dimCfg.fontSize + 2} tickLen={dimCfg.tickLen} arrowSize={dimCfg.arrowSize} lineWidth={dimCfg.lineWidth} />

      {Array.from({ length: Math.floor(roomProj.w / 50) + 1 }, (_, i) => {
        const x = MARGIN + i * 50 * SCALE;
        return <line key={`gv${i}`} x1={x} y1={MARGIN} x2={x} y2={MARGIN + roomProj.h * SCALE} stroke="#f0f0f0" strokeWidth={0.5} />;
      })}
      {Array.from({ length: Math.floor(roomProj.h / 50) + 1 }, (_, i) => {
        const y = MARGIN + i * 50 * SCALE;
        return <line key={`gh${i}`} x1={MARGIN} y1={y} x2={MARGIN + roomProj.w * SCALE} y2={y} stroke="#f0f0f0" strokeWidth={0.5} />;
      })}

      {sortedElements.map((el) => {
        const proj = getProjection(el, view, layout.room.width, layout.room.depth);
        const style = getElementStyle(el);
        const sx = toSvgX(proj.x);
        const sy = isElevation ? toSvgY(proj.y + proj.h) : toSvgY(proj.y);
        const sw = proj.w * SCALE;
        const sh = proj.h * SCALE;
        const conf = getElementConfidence(el);

        if (style.fill === "none") return null;

        return (
          <g key={el.id}>
            <rect x={sx} y={sy} width={sw} height={sh} fill={style.fill} fillOpacity={fillOpacity} stroke={style.stroke} strokeWidth={1.2} />
            {sw > 20 && sh > 12 && (
              <text x={sx + sw / 2} y={sy + sh / 2 + (showConfidence ? -3 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(dimCfg.fontSize - 1, sw / 6, sh / 3)} fontFamily="monospace" fill={style.stroke} fontWeight="bold">
                {el.label.length > 15 ? el.label.substring(0, 12) + "..." : el.label}
              </text>
            )}
            {showConfidence && sw > 30 && sh > 24 && (
              <g>
                <rect x={sx + sw / 2 - 12} y={sy + sh / 2 + 4} width={24} height={12} rx={3} fill={conf.color} fillOpacity={0.15} stroke={conf.color} strokeWidth={0.5} />
                <text x={sx + sw / 2} y={sy + sh / 2 + 12} textAnchor="middle" dominantBaseline="auto" fontSize={7} fontFamily="monospace" fill={conf.color} fontWeight="bold">{conf.grade}</text>
              </g>
            )}
            {sw > 25 && (
              <DimensionLine x1={sx} y1={sy} x2={sx + sw} y2={sy} label={formatDim(proj.realW, useInches)} offset={-dimCfg.offset} color="#CC3300" fontSize={dimCfg.fontSize} tickLen={dimCfg.tickLen} arrowSize={dimCfg.arrowSize} lineWidth={dimCfg.lineWidth} />
            )}
            {sh > 25 && (
              <DimensionLine x1={sx + sw} y1={sy} x2={sx + sw} y2={sy + sh} label={formatDim(proj.realH, useInches)} offset={dimCfg.offset} color="#CC3300" fontSize={dimCfg.fontSize} tickLen={dimCfg.tickLen} arrowSize={dimCfg.arrowSize} lineWidth={dimCfg.lineWidth} />
            )}
          </g>
        );
      })}

      {view === "floor" && (
        <g transform={`translate(${svgW - 40}, ${MARGIN + 30})`}>
          <polygon points="0,-20 -6,0 6,0" fill="#333" />
          <line x1={0} y1={0} x2={0} y2={15} stroke="#333" strokeWidth={1.5} />
          <text x={0} y={-24} textAnchor="middle" fontSize={10} fontFamily="monospace" fontWeight="bold" fill="#333">N</text>
        </g>
      )}

      {showConfidence && (
        <g transform={`translate(${svgW - 120}, ${MARGIN + (view === "floor" ? 60 : 10)})`}>
          <rect x={-5} y={-5} width={110} height={68} rx={4} fill="#fff" fillOpacity={0.9} stroke="#ddd" strokeWidth={0.5} />
          <text x={0} y={8} fontSize={8} fontFamily="monospace" fontWeight="bold" fill="#333">Confidence</text>
          {[
            { grade: "A", label: "High (Std. appliance)", color: "#16a34a" },
            { grade: "B", label: "Good (Std. dims)", color: "#2563eb" },
            { grade: "C", label: "Moderate (Variable)", color: "#d97706" },
          ].map((c, i) => (
            <g key={c.grade} transform={`translate(0, ${18 + i * 15})`}>
              <rect x={0} y={0} width={14} height={10} rx={2} fill={c.color} fillOpacity={0.2} stroke={c.color} strokeWidth={0.5} />
              <text x={3} y={8} fontSize={7} fontFamily="monospace" fill={c.color} fontWeight="bold">{c.grade}</text>
              <text x={18} y={8} fontSize={7} fontFamily="monospace" fill="#666">{c.label}</text>
            </g>
          ))}
        </g>
      )}

      <rect x={MARGIN - 5} y={svgH - 70} width={svgW - MARGIN * 2 + 10} height={25} fill="#f8f8f8" stroke="#333" strokeWidth={1} />
      <text x={MARGIN} y={svgH - 53} fontSize={9} fontFamily="monospace" fill="#333">
        Next Kuster Design | {viewLabels[view]} | {new Date().toLocaleDateString()}
      </text>
      <text x={svgW - MARGIN} y={svgH - 53} textAnchor="end" fontSize={9} fontFamily="monospace" fill="#666">
        Room: {layout.room.width}x{layout.room.depth}x{layout.room.height}cm
      </text>

      <rect x={MARGIN - 5} y={svgH - 42} width={svgW - MARGIN * 2 + 10} height={38} fill="#FFF8E1" stroke="#E6A817" strokeWidth={0.8} rx={3} />
      <text x={MARGIN + 2} y={svgH - 28} fontSize={7.5} fontFamily="monospace" fill="#92400e" fontWeight="bold">
        DISCLAIMER: These floor plans are AI-generated estimates based on photo analysis.
      </text>
      <text x={MARGIN + 2} y={svgH - 18} fontSize={7} fontFamily="monospace" fill="#92400e">
        Dimensions are approximate and should not be used for construction without professional verification.
      </text>
      <text x={MARGIN + 2} y={svgH - 9} fontSize={7} fontFamily="monospace" fill="#78350f" fontWeight="bold">
        We recommend curating all preliminary project documentation with the professionals at Next Kuster Design.
      </text>
    </svg>
  );
}

/* ─── View buttons ─── */
const VIEW_BUTTONS: { mode: PlanView; label: string; icon: React.ReactNode }[] = [
  { mode: "floor", label: "Floor Plan", icon: <LayoutGrid className="h-4 w-4" /> },
  { mode: "front", label: "Front", icon: <ArrowUp className="h-4 w-4" /> },
  { mode: "back", label: "Back", icon: <ArrowDown className="h-4 w-4" /> },
  { mode: "left", label: "Left", icon: <ArrowLeft className="h-4 w-4" /> },
  { mode: "right", label: "Right", icon: <ArrowRight className="h-4 w-4" /> },
];

/* ─── Main Component ─── */
export default function FloorPlan2D({ layout }: FloorPlan2DProps) {
  const [view, setView] = useState<PlanView>("floor");
  const [useInches, setUseInches] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  const [isOpaque, setIsOpaque] = useState(true);
  const [dimSize, setDimSize] = useState<DimSize>("M");
  const [showConfidence, setShowConfidence] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `kitchen-${view}-plan.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = URL.createObjectURL(svgBlob);
  }, [view]);

  const handleExportSVG = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.download = `kitchen-${view}-plan.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [view]);

  const visibleElements = useMemo(
    () => getVisibleElements(layout.elements, view, layout.room),
    [layout.elements, view, layout.room]
  );

  const overallConfidence = layout.confidence;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex flex-col border-b bg-muted/50">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-1">
            {VIEW_BUTTONS.map(({ mode, label, icon }) => (
              <Button key={mode} variant={view === mode ? "default" : "outline"} size="sm" onClick={() => setView(mode)} className="gap-1.5">
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PNG</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSVG} className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">SVG</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 pb-3 gap-4 flex-wrap">
          <Button variant={isOpaque ? "default" : "outline"} size="sm" onClick={() => setIsOpaque(!isOpaque)} className="gap-1.5">
            {isOpaque ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isOpaque ? "Opaque" : "Transparent"}
          </Button>

          <div className="flex items-center gap-1">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mr-1">Dims:</span>
            {(["S", "M", "L", "XL"] as DimSize[]).map((size) => (
              <Button key={size} variant={dimSize === size ? "default" : "outline"} size="sm" onClick={() => setDimSize(size)} className="h-7 px-2 text-xs min-w-[32px]">
                {size}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className={!useInches ? "font-semibold text-primary" : "text-muted-foreground"}>mm</span>
            <Switch checked={useInches} onCheckedChange={setUseInches} />
            <span className={useInches ? "font-semibold text-primary" : "text-muted-foreground"}>in</span>
          </div>

          <Button variant={showConfidence ? "default" : "outline"} size="sm" onClick={() => setShowConfidence(!showConfidence)} className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Confidence</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Plan canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4" style={{ minHeight: 450 }}>
        <PlanSVG layout={layout} view={view} useInches={useInches} zoom={zoom} isOpaque={isOpaque} dimSize={dimSize} showConfidence={showConfidence} />
      </div>

      {/* Legend + Confidence summary */}
      <div className="p-3 border-t bg-muted/50">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={overallConfidence === "high" ? "default" : overallConfidence === "medium" ? "secondary" : "destructive"} className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            Overall: {overallConfidence} confidence
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {visibleElements.length} elements visible in this view
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleElements.map((el) => {
            const style = getElementStyle(el);
            const conf = getElementConfidence(el);
            return (
              <div key={el.id} className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] bg-background border">
                <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: style.fill, borderColor: style.stroke }} />
                <span className="truncate max-w-[100px]">{el.label}</span>
                <span className="text-muted-foreground">
                  {formatDim(el.dimensions.width, useInches)}x{formatDim(el.dimensions.height, useInches)}
                </span>
                {showConfidence && (
                  <span className="text-[9px] font-bold px-1 rounded" style={{ color: conf.color, backgroundColor: conf.color + "15" }}>
                    {conf.grade}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Disclaimer:</span> These floor plans are AI-generated estimates.
            Dimensions are approximate and should not be used for construction purposes without professional verification.
            We recommend curating all preliminary project documentation with the professionals at{" "}
            <span className="font-bold text-amber-900">Next Kuster Design</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
