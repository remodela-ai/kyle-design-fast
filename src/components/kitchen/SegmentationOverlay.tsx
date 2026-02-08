import { useRef, useEffect, useState, useCallback } from "react";
import { Eye, EyeOff, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface CategoryMask {
  categoryId: string;
  label: string;
  maskUrl: string;
  color: string;
}

interface SegmentationOverlayProps {
  originalImageUrl: string;
  categoryMasks: CategoryMask[];
  className?: string;
}

/**
 * Hex color string to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 200, g: 200, b: 200 };
}

/**
 * SegmentationOverlay renders the original kitchen image with colored transparent
 * mask overlays using a canvas approach. Masks are downloaded from S3 (same-origin),
 * so canvas pixel manipulation works without CORS issues.
 *
 * Features:
 * - Toggle switch to show/hide all overlays
 * - Opacity slider from 0% to 100%
 * - Per-category show/hide via legend buttons
 * - Hover highlight on legend items
 */
export default function SegmentationOverlay({
  originalImageUrl,
  categoryMasks,
  className = "",
}: SegmentationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [opacity, setOpacity] = useState(50); // 0-100 percent
  const [hiddenMasks, setHiddenMasks] = useState<Set<string>>(new Set());
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isCompositing, setIsCompositing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache loaded images to avoid reloading on every render
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    const cached = imageCache.current.get(url);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageCache.current.set(url, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  }, []);

  const toggleMask = (categoryId: string) => {
    setHiddenMasks((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setIsCompositing(true);
    setError(null);

    try {
      // Load original image
      const originalImg = await loadImage(originalImageUrl);
      const w = originalImg.naturalWidth;
      const h = originalImg.naturalHeight;

      // Set canvas size to match image
      canvas.width = w;
      canvas.height = h;

      // Draw original image as base layer
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(originalImg, 0, 0, w, h);

      // If overlay is disabled, just show the original
      if (!overlayEnabled) {
        setIsCompositing(false);
        return;
      }

      // Get visible masks
      const visibleMasks = categoryMasks.filter(
        (m) => !hiddenMasks.has(m.categoryId)
      );

      if (visibleMasks.length === 0) {
        setIsCompositing(false);
        return;
      }

      // Load all mask images
      const loadedMasks: Array<{ mask: CategoryMask; img: HTMLImageElement }> = [];
      for (const mask of visibleMasks) {
        try {
          const img = await loadImage(mask.maskUrl);
          loadedMasks.push({ mask, img });
        } catch (err) {
          console.warn(`Failed to load mask for ${mask.label}:`, err);
        }
      }

      // For each mask, create a colored overlay
      for (const { mask, img } of loadedMasks) {
        const rgb = hexToRgb(mask.color);

        // Determine effective opacity
        let effectiveOpacity = opacity / 100;
        if (hoveredCategory) {
          effectiveOpacity = mask.categoryId === hoveredCategory
            ? Math.min((opacity / 100) + 0.25, 0.95)
            : (opacity / 100) * 0.2;
        }

        // Draw mask to offscreen canvas to read pixels
        const offscreen = document.createElement("canvas");
        offscreen.width = w;
        offscreen.height = h;
        const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
        if (!offCtx) continue;

        offCtx.drawImage(img, 0, 0, w, h);

        let maskPixels: ImageData;
        try {
          maskPixels = offCtx.getImageData(0, 0, w, h);
        } catch (e) {
          console.warn(`CORS error reading mask pixels for ${mask.label}:`, e);
          // Fallback: draw the mask with global alpha as a simple overlay
          ctx.globalAlpha = effectiveOpacity;
          ctx.drawImage(img, 0, 0, w, h);
          ctx.globalAlpha = 1.0;
          continue;
        }

        const pixels = maskPixels.data;

        // Create colored overlay image data
        const overlayData = ctx.createImageData(w, h);
        const od = overlayData.data;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          // The mask has non-black/non-transparent areas where the element was detected
          const brightness = (r + g + b) / 3;
          if (brightness > 25 && a > 50) {
            od[i] = rgb.r;
            od[i + 1] = rgb.g;
            od[i + 2] = rgb.b;
            od[i + 3] = Math.round(effectiveOpacity * 255);
          }
          // else: leave transparent (alpha = 0)
        }

        // Draw the colored overlay onto the main canvas
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) continue;
        tempCtx.putImageData(overlayData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      }
    } catch (err: any) {
      console.error("Failed to render segmentation overlay:", err);
      setError(err.message || "Failed to render overlay");
    } finally {
      setIsCompositing(false);
    }
  }, [originalImageUrl, categoryMasks, overlayEnabled, opacity, hiddenMasks, hoveredCategory, loadImage]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Canvas container */}
      <div ref={containerRef} className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-lg max-h-[60vh] w-auto max-w-full"
        />
        {isCompositing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 shadow-lg">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Compositing overlay...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute bottom-3 left-3 right-3 bg-destructive/90 text-destructive-foreground rounded-lg px-3 py-2 text-xs">
            Overlay error: {error}
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        {/* Toggle + Opacity Row */}
        <div className="flex items-center gap-4">
          {/* Switch to toggle overlay on/off */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Switch
              id="overlay-toggle"
              checked={overlayEnabled}
              onCheckedChange={setOverlayEnabled}
            />
            <Label htmlFor="overlay-toggle" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Segmentation Overlay
            </Label>
          </div>

          {/* Opacity slider 0-100% */}
          {overlayEnabled && (
            <div className="flex items-center gap-3 flex-1 ml-4">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Opacity</span>
              <Slider
                value={[opacity]}
                onValueChange={([v]) => setOpacity(v)}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs font-medium text-foreground w-8 text-right">{opacity}%</span>
            </div>
          )}
        </div>

        {/* Category Legend */}
        {overlayEnabled && (
          <div className="flex flex-wrap gap-1.5">
            {categoryMasks.map((mask) => {
              const isHidden = hiddenMasks.has(mask.categoryId);
              const isHovered = hoveredCategory === mask.categoryId;
              return (
                <button
                  key={mask.categoryId}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                    isHidden
                      ? "opacity-35 border-border bg-muted line-through"
                      : isHovered
                      ? "border-foreground/40 bg-accent shadow-sm scale-105"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                  onClick={() => toggleMask(mask.categoryId)}
                  onMouseEnter={() => setHoveredCategory(mask.categoryId)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  title={isHidden ? `Show ${mask.label}` : `Hide ${mask.label}`}
                >
                  <span
                    className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                    style={{ backgroundColor: isHidden ? "#999" : mask.color }}
                  />
                  <span className="truncate max-w-[90px]">{mask.label}</span>
                  {isHidden ? (
                    <EyeOff className="w-3 h-3 text-muted-foreground shrink-0" />
                  ) : (
                    <Eye className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
