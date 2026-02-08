import { useState, useRef, useEffect, useCallback } from "react";
import { Eye, EyeOff, Box, Target, MousePointerClick } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Detection {
  label: string;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
  color: string;
}

interface UniqueLabel {
  label: string;
  color: string;
  count: number;
}

interface BoundingBoxOverlayProps {
  originalImageUrl: string;
  detections: Detection[];
  uniqueLabels: UniqueLabel[];
  className?: string;
  onLabelSelect?: (label: string) => void;
  selectedLabel?: string | null;
}

export default function BoundingBoxOverlay({
  originalImageUrl,
  detections,
  uniqueLabels,
  className = "",
  onLabelSelect,
  selectedLabel: externalSelectedLabel,
}: BoundingBoxOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [internalSelectedLabel, setInternalSelectedLabel] = useState<string | null>(null);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());
  const [imgDimensions, setImgDimensions] = useState<{
    naturalWidth: number; naturalHeight: number; displayWidth: number; displayHeight: number; offsetX: number; offsetY: number;
  } | null>(null);

  const selectedLabel = externalSelectedLabel !== undefined ? externalSelectedLabel : internalSelectedLabel;

  const handleLabelClick = (label: string) => {
    const newLabel = selectedLabel === label ? null : label;
    setInternalSelectedLabel(newLabel);
    if (onLabelSelect && newLabel) onLabelSelect(newLabel);
  };

  const toggleLabelVisibility = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    setHiddenLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const updateDimensions = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container || !img.naturalWidth) return;
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    setImgDimensions({
      naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
      displayWidth: imgRect.width, displayHeight: imgRect.height,
      offsetX: imgRect.left - containerRect.left, offsetY: imgRect.top - containerRect.top,
    });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const handleLoad = () => updateDimensions();
    img.addEventListener("load", handleLoad);
    window.addEventListener("resize", updateDimensions);
    if (img.complete && img.naturalWidth) updateDimensions();
    return () => { img.removeEventListener("load", handleLoad); window.removeEventListener("resize", updateDimensions); };
  }, [updateDimensions]);

  const getDisplayBox = (box: Detection["box"]) => {
    if (!imgDimensions) return null;
    const { naturalWidth, naturalHeight, displayWidth, displayHeight, offsetX, offsetY } = imgDimensions;
    const isNormalized = box.x2 <= 1.1 && box.y2 <= 1.1;
    let x1: number, y1: number, x2: number, y2: number;
    if (isNormalized) {
      x1 = box.x1 * displayWidth + offsetX; y1 = box.y1 * displayHeight + offsetY;
      x2 = box.x2 * displayWidth + offsetX; y2 = box.y2 * displayHeight + offsetY;
    } else {
      const scaleX = displayWidth / naturalWidth; const scaleY = displayHeight / naturalHeight;
      x1 = box.x1 * scaleX + offsetX; y1 = box.y1 * scaleY + offsetY;
      x2 = box.x2 * scaleX + offsetX; y2 = box.y2 * scaleY + offsetY;
    }
    return { x1, y1, x2, y2, width: x2 - x1, height: y2 - y1 };
  };

  const visibleDetections = detections.filter((d) => {
    if (hiddenLabels.has(d.label)) return false;
    if (!overlayEnabled) return false;
    if (selectedLabel === d.label) return true;
    if (hoveredLabel === d.label) return true;
    return false;
  });

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div ref={containerRef} className="relative flex items-center justify-center">
        <img ref={imgRef} src={originalImageUrl} alt="Kitchen with detections" className="rounded-lg shadow-lg max-h-[60vh] w-auto max-w-full" crossOrigin="anonymous" />
        {imgDimensions && visibleDetections.map((det, idx) => {
          const displayBox = getDisplayBox(det.box);
          if (!displayBox) return null;
          const isSelected = selectedLabel === det.label;
          return (
            <div key={`${det.label}-${idx}`} className="absolute pointer-events-none transition-opacity duration-200" style={{
              left: displayBox.x1, top: displayBox.y1, width: displayBox.width, height: displayBox.height,
              border: isSelected ? `3px solid #ef4444` : `2.5px solid ${det.color}`, borderRadius: "4px",
              boxShadow: isSelected ? `0 0 0 2px rgba(239,68,68,0.3), inset 0 0 0 1px rgba(255,255,255,0.3)` : `0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.2)`,
              backgroundColor: isSelected ? "rgba(239,68,68,0.08)" : "transparent",
            }}>
              <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md" style={{ backgroundColor: isSelected ? "#ef4444" : det.color, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                {det.label} {(det.confidence * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
        {overlayEnabled && !hoveredLabel && !selectedLabel && imgDimensions && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 pointer-events-none">
            <MousePointerClick className="w-3 h-3" />
            Click a label to select · Hover to preview
          </div>
        )}
      </div>
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <Switch id="dino-overlay-toggle" checked={overlayEnabled} onCheckedChange={setOverlayEnabled} />
            <Label htmlFor="dino-overlay-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-primary" />
              Object Detection Overlay
            </Label>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{detections.length} objects detected · {uniqueLabels.length} categories</span>
        </div>
        {overlayEnabled && (
          <div className="flex flex-wrap gap-1.5">
            {uniqueLabels.map((ul) => {
              const isHidden = hiddenLabels.has(ul.label);
              const isHovered = hoveredLabel === ul.label;
              const isSelected = selectedLabel === ul.label;
              return (
                <button key={ul.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border-2 ${
                  isHidden ? "opacity-35 border-border bg-muted line-through" : isSelected ? "border-red-500 bg-red-500/10 shadow-lg scale-105 ring-2 ring-red-500/30" : isHovered ? "border-foreground/40 bg-accent shadow-md scale-105 ring-2 ring-primary/30" : "border-border bg-card hover:bg-accent"
                }`} onClick={() => !isHidden && handleLabelClick(ul.label)} onMouseEnter={() => !isHidden && !isSelected && setHoveredLabel(ul.label)} onMouseLeave={() => setHoveredLabel(null)}>
                  <span className="w-3 h-3 rounded-sm shrink-0 border" style={{ backgroundColor: isHidden ? "#999" : isSelected ? "#ef4444" : ul.color, borderColor: isSelected ? "#ef4444" : "rgba(0,0,0,0.1)" }} />
                  <span className="capitalize truncate max-w-[100px]">{ul.label}</span>
                  <span className="text-[9px] text-muted-foreground">({ul.count})</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                  <button className="ml-0.5 p-0.5 rounded hover:bg-muted-foreground/10 shrink-0" onClick={(e) => toggleLabelVisibility(e, ul.label)}>
                    {isHidden ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
