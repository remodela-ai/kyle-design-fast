import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Clipboard, Camera, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelected: (imageDataUrl: string) => void;
}

export function ImageUploadDialog({ open, onOpenChange, onImageSelected }: ImageUploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      setIsProcessing(true);
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          processFile(file);
          return;
        }
      }
      
      toast.error("No image found in clipboard");
      setIsProcessing(false);
    } catch (error) {
      console.error("Clipboard error:", error);
      toast.error("Could not access clipboard. Please try uploading instead.");
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (preview) {
      onImageSelected(preview);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreview(null);
    setIsProcessing(false);
    onOpenChange(false);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Upload Your Design Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          {preview ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg border border-border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={clearPreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="w-full h-48 rounded-lg border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-2">
              {isProcessing ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Select or paste an image</p>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Upload Button */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Paste from Clipboard */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handlePasteFromClipboard}
              disabled={isProcessing}
            >
              <Clipboard className="h-4 w-4" />
              Paste
            </Button>

            {/* Camera Capture (Mobile) */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleCameraCapture}
              disabled={isProcessing}
            >
              <Camera className="h-4 w-4" />
              Camera
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Confirm Button */}
          {preview && (
            <Button
              className="w-full"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              Start Pipeline
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
