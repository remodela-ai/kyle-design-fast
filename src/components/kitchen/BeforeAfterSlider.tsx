import { useState, useRef, useCallback, useEffect } from "react";
import { GripVertical } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "AI Redesign",
  className = "",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imagesReady, setImagesReady] = useState(0);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPosition(pct);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      updateSliderPosition(clientX);
    },
    [updateSliderPosition]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updateSliderPosition(clientX);
    };

    const onEnd = () => setIsDragging(false);

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, updateSliderPosition]);

  const bothLoaded = imagesReady >= 2;

  /**
   * KEY TECHNIQUE:
   * Both images are positioned absolutely, filling the EXACT same space.
   * The "before" image uses clip-path to only show the LEFT portion (0 → sliderPosition%).
   * The "after" image uses clip-path to only show the RIGHT portion (sliderPosition% → 100%).
   * Neither image moves or scales — only the visible region changes.
   * This guarantees pixel-perfect alignment and identical dimensions.
   */

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 
        The container uses a hidden <img> to set the natural aspect ratio.
        Both overlay images are absolute-positioned on top, filling 100% of the container.
      */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden shadow-lg cursor-col-resize select-none bg-black"
        style={{ maxHeight: "70vh" }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        {/* Invisible sizing image — sets the container's natural height from the "before" image */}
        <img
          src={beforeSrc}
          alt=""
          className="w-full h-auto block invisible"
          style={{ maxHeight: "70vh", objectFit: "contain" }}
          aria-hidden="true"
          onLoad={() => setImagesReady((n) => n + 1)}
        />

        {/* AFTER image — clipped to show only the RIGHT side (from slider to 100%) */}
        <img
          src={afterSrc}
          alt={afterLabel}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            clipPath: `inset(0 0 0 ${sliderPosition}%)`,
          }}
          onLoad={() => setImagesReady((n) => n + 1)}
        />

        {/* BEFORE image — clipped to show only the LEFT side (from 0 to slider) */}
        <img
          src={beforeSrc}
          alt={beforeLabel}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        />

        {/* Slider vertical line */}
        <div
          className="absolute top-0 bottom-0 z-10 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-0 bottom-0 -translate-x-1/2 w-[2px] bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.4)]" />
        </div>

        {/* Drag handle circle */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${sliderPosition}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className={`w-11 h-11 rounded-full bg-white shadow-xl border-2 border-white/80 flex items-center justify-center transition-transform duration-150 ${
              isDragging ? "scale-110" : ""
            }`}
          >
            <GripVertical className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Before label (top-left) */}
        <div
          className="absolute top-3 left-3 z-20 pointer-events-none transition-opacity duration-200"
          style={{ opacity: sliderPosition > 12 ? 1 : 0 }}
        >
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold tracking-wide">
            {beforeLabel}
          </span>
        </div>

        {/* After label (top-right) */}
        <div
          className="absolute top-3 right-3 z-20 pointer-events-none transition-opacity duration-200"
          style={{ opacity: sliderPosition < 88 ? 1 : 0 }}
        >
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/80 backdrop-blur-sm text-white text-xs font-semibold tracking-wide">
            {afterLabel}
          </span>
        </div>

        {/* Loading state */}
        {!bothLoaded && (
          <div className="absolute inset-0 bg-muted/80 animate-pulse flex items-center justify-center z-30">
            <span className="text-muted-foreground text-sm">Loading images...</span>
          </div>
        )}
      </div>

      {/* Instruction */}
      <p className="text-[11px] text-muted-foreground mt-2.5 flex items-center gap-1.5">
        <GripVertical className="w-3.5 h-3.5" />
        Drag the slider to compare before and after
      </p>
    </div>
  );
}
