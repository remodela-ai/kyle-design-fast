import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

interface ImageItem {
  url: string;
  label: string;
  iteration: number;
}

interface ImageCarouselProps {
  images: ImageItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isLoading?: boolean;
}

export function ImageCarousel({
  images,
  selectedIndex,
  onSelect,
  isLoading = false,
}: ImageCarouselProps) {
  const [viewingIndex, setViewingIndex] = useState(0);

  const handlePrev = () => {
    setViewingIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setViewingIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleSelect = (index: number) => {
    onSelect(index);
    setViewingIndex(index);
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-xl border border-border">
        <p className="text-muted-foreground text-sm">No images generated yet</p>
      </div>
    );
  }

  const currentImage = images[viewingIndex];

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
        <AspectRatio ratio={1}>
          {isLoading && viewingIndex === images.length - 1 ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Regenerating design...</p>
              </div>
            </div>
          ) : (
            <img
              src={currentImage.url}
              alt={currentImage.label}
              className="w-full h-full object-cover"
            />
          )}
        </AspectRatio>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image label */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium">
          {currentImage.label}
        </div>

        {/* Selected indicator */}
        {selectedIndex === viewingIndex && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-green-500/90 text-white text-xs font-medium flex items-center gap-1">
            <Check className="h-3 w-3" />
            Selected
          </div>
        )}

        {/* Counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
          {viewingIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={`${image.iteration}-${index}`}
              onClick={() => handleSelect(index)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                viewingIndex === index
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-muted-foreground",
                selectedIndex === index && "ring-2 ring-green-500/50"
              )}
            >
              <img
                src={image.url}
                alt={image.label}
                className="w-full h-full object-cover"
              />
              {selectedIndex === index && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-center py-0.5">
                {index === 0 ? "Original" : `V${index}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Select button */}
      {selectedIndex !== viewingIndex && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect(viewingIndex)}
          className="w-full gap-2"
        >
          <Check className="h-4 w-4" />
          Select this version for pipeline
        </Button>
      )}
    </div>
  );
}
