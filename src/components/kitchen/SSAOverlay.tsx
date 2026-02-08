import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, MousePointerClick } from "lucide-react";

interface SSASegment {
  class_name: string;
  class_proposals: string[];
  bbox: [number, number, number, number]; // [x, y, w, h]
  area: number;
  predicted_iou: number;
  stability_score: number;
  color: string;
  mappedCategory: string | null;
}

interface UniqueClass {
  class_name: string;
  color: string;
  count: number;
  mappedCategory: string | null;
}

interface SSAOverlayProps {
  originalImageUrl: string;
  annotatedImageUrl: string;
  segments: SSASegment[];
  uniqueClasses: UniqueClass[];
  className?: string;
  /** Called when user clicks a class label to select it */
  onLabelSelect?: (label: string) => void;
  /** Currently selected label from parent */
  selectedLabel?: string | null;
}

export default function SSAOverlay({
  originalImageUrl,
  annotatedImageUrl,
  segments,
  uniqueClasses,
  className = "",
  onLabelSelect,
  selectedLabel: externalSelectedLabel,
}: SSAOverlayProps) {
  const [showAnnotated, setShowAnnotated] = useState(true);
  const [opacity, setOpacity] = useState([70]);
  const [hoveredClass, setHoveredClass] = useState<string | null>(null);
  const [internalSelectedLabel, setInternalSelectedLabel] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

  const selectedLabel = externalSelectedLabel !== undefined ? externalSelectedLabel : internalSelectedLabel;

  const handleLabelClick = (className: string) => {
    const newLabel = selectedLabel === className ? null : className;
    setInternalSelectedLabel(newLabel);
    if (onLabelSelect && newLabel) {
      onLabelSelect(newLabel);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgDimensions({
      width: img.clientWidth,
      height: img.clientHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  };

  const scaleX = imgDimensions.width / (imgDimensions.naturalWidth || 1);
  const scaleY = imgDimensions.height / (imgDimensions.naturalHeight || 1);

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            checked={showAnnotated}
            onCheckedChange={setShowAnnotated}
            id="ssa-toggle"
          />
          <label htmlFor="ssa-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-1">
            {showAnnotated ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Semantic Labels
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={showBoxes}
            onCheckedChange={setShowBoxes}
            id="ssa-boxes"
          />
          <label htmlFor="ssa-boxes" className="text-xs font-medium cursor-pointer">
            Bounding Boxes
          </label>
        </div>

        {showAnnotated && (
          <div className="flex items-center gap-2 flex-1 min-w-[150px] max-w-[250px]">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Opacity</span>
            <Slider
              value={opacity}
              onValueChange={setOpacity}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-8 text-right">{opacity[0]}%</span>
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative inline-block rounded-lg overflow-hidden shadow-lg">
        {/* Original image (always visible) */}
        <img
          src={originalImageUrl}
          alt="Original kitchen"
          className="block max-h-[60vh] object-contain"
          onLoad={handleImageLoad}
        />

        {/* Annotated overlay */}
        {showAnnotated && annotatedImageUrl && (
          <img
            src={annotatedImageUrl}
            alt="Semantic segmentation"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ opacity: opacity[0] / 100 }}
          />
        )}

        {/* Bounding boxes */}
        {showBoxes && imgDimensions.naturalWidth > 0 && segments.map((seg, idx) => {
          const [x, y, w, h] = seg.bbox;
          const segClassName = seg.class_name.toLowerCase();
          const isSelected = selectedLabel === segClassName;
          const isHovered = hoveredClass === segClassName;
          const isAnyActive = hoveredClass !== null || selectedLabel !== null;
          const shouldShow = isSelected || isHovered || !isAnyActive;

          if (!shouldShow) return null;

          return (
            <div
              key={idx}
              className="absolute pointer-events-none transition-opacity duration-200"
              style={{
                left: `${x * scaleX}px`,
                top: `${y * scaleY}px`,
                width: `${w * scaleX}px`,
                height: `${h * scaleY}px`,
                border: isSelected ? `3px solid #ef4444` : `2px solid ${seg.color}`,
                backgroundColor: isSelected ? "rgba(239,68,68,0.08)" : isHovered ? `${seg.color}20` : "transparent",
                opacity: isSelected ? 1 : isHovered ? 1 : 0.3,
                boxShadow: isSelected ? "0 0 0 2px rgba(239,68,68,0.3)" : "none",
              }}
            >
              {(isHovered || isSelected) && (
                <span
                  className="absolute -top-5 left-0 text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
                  style={{
                    backgroundColor: isSelected ? "#ef4444" : seg.color,
                    color: "#fff",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {seg.class_name}
                </span>
              )}
            </div>
          );
        })}

        {/* Hint */}
        {!hoveredClass && !selectedLabel && imgDimensions.naturalWidth > 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 pointer-events-none">
            <MousePointerClick className="w-3 h-3" />
            Click a label to select · Hover to preview
          </div>
        )}
      </div>

      {/* Legend */}
      {uniqueClasses.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">
            Detected Elements ({uniqueClasses.length} classes · {segments.length} segments)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {uniqueClasses.map((cls) => {
              const clsKey = cls.class_name.toLowerCase();
              const isSelected = selectedLabel === clsKey;
              const isHovered = hoveredClass === clsKey;
              return (
                <Badge
                  key={cls.class_name}
                  variant="outline"
                  className={`text-[10px] cursor-pointer transition-all gap-1.5 hover:shadow-sm border-2 ${
                    isSelected
                      ? "border-red-500 bg-red-500/10 shadow-lg scale-105 font-bold"
                      : isHovered
                      ? "border-foreground/40 bg-accent shadow-md scale-105 font-bold"
                      : ""
                  }`}
                  style={{
                    borderColor: isSelected ? "#ef4444" : isHovered ? cls.color : cls.color,
                    backgroundColor: isSelected ? "rgba(239,68,68,0.1)" : isHovered ? `${cls.color}20` : "transparent",
                  }}
                  onClick={() => handleLabelClick(clsKey)}
                  onMouseEnter={() => !isSelected && setHoveredClass(clsKey)}
                  onMouseLeave={() => setHoveredClass(null)}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? "#ef4444" : cls.color }}
                  />
                  {cls.class_name}
                  <span className="text-muted-foreground">({cls.count})</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  )}
                  {cls.mappedCategory && (
                    <span className="text-primary text-[9px]">→ {cls.mappedCategory}</span>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
