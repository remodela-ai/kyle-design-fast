import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KyleAvatar } from "@/components/KyleAvatar";
import { ChevronUp, Sparkles, Loader2, Wand2, Trash2, Pencil, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kitchenHero from "@/assets/kitchen-hero.jpg";

// Only AI-generated images from the database are shown

type GalleryImage = {
  id: string;
  url: string;
  title: string;
  prompt: string;
  isStatic?: boolean;
};

const KyleSocialLanding = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GalleryImage[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [hoveredImage, setHoveredImage] = useState<GalleryImage | null>(null);
  const [showRandomDialog, setShowRandomDialog] = useState(false);
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [randomTitle, setRandomTitle] = useState<string>("");

  // Fetch generated images from database
  useEffect(() => {
    const fetchGeneratedImages = async () => {
      const { data, error } = await supabase
        .from("inspiration_gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching gallery:", error);
        return;
      }

      if (data) {
        setGeneratedImages(
          data.map((img) => ({
            id: img.id,
            url: img.image_url,
            title: img.title,
            prompt: img.prompt,
            isStatic: false,
          }))
        );
      }
    };

    fetchGeneratedImages();
  }, []);

  const allImages = generatedImages;

  const handleStart = () => {
    navigate("/shazam");
  };

  const handleGenerateImage = async () => {
    if (!selectedImage) return;
    
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    
    try {
      // Use edited prompt instead of original
      const promptToUse = editedPrompt || selectedImage.prompt;
      
      const { data, error } = await supabase.functions.invoke('generate-inspiration-image', {
        body: { prompt: promptToUse, title: selectedImage.title }
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        
        // Add to generated images list
        if (data.id) {
          setGeneratedImages(prev => [{
            id: data.id,
            url: data.imageUrl,
            title: data.title || selectedImage.title,
            prompt: promptToUse,
            isStatic: false
          }, ...prev]);
        }
        
        toast.success("Image generated and added to gallery!");
      } else {
        throw new Error("No image URL returned");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeletingId(imageId);
    
    try {
      const { error } = await supabase
        .from("inspiration_gallery")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
      
      setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
      setHoveredImage(null);
      toast.success("Image removed from gallery");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUseThisImage = () => {
    const imageUrl = generatedImageUrl || selectedImage?.url;
    if (imageUrl) {
      navigate("/shazam", { 
        state: { 
          referenceImage: imageUrl,
          initialPrompt: editedPrompt || selectedImage?.prompt 
        } 
      });
    }
  };

  const handleOpenDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setEditedPrompt(image.prompt);
    setGeneratedImageUrl(null);
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
    setGeneratedImageUrl(null);
    setEditedPrompt("");
  };

  // Generate a random prompt without creating the image
  const generateRandomPromptPreview = () => {
    const styles = [
      "Ultra-modern minimalist",
      "Warm Scandinavian hygge",
      "Industrial loft",
      "Mediterranean coastal",
      "French country elegance",
      "Japanese zen minimalism",
      "Art deco glamour",
      "Rustic farmhouse modern",
      "Contemporary transitional",
      "Bold maximalist",
      "Soft organic modern",
      "Sleek urban contemporary"
    ];

    const colorPalettes = [
      "crisp whites with warm oak accents",
      "deep navy blue with brass hardware",
      "sage green with natural stone",
      "charcoal gray with white marble veining",
      "warm terracotta with cream tones",
      "black matte with gold accents",
      "soft blush pink with marble",
      "rich emerald with copper details",
      "warm walnut with cream lacquer",
      "pure white with brushed nickel",
      "moody forest green with natural wood",
      "soft gray-blue with white quartz"
    ];

    const features = [
      "waterfall island countertop",
      "floor-to-ceiling custom cabinetry",
      "statement range hood",
      "integrated smart appliances",
      "hidden pantry with pocket doors",
      "dramatic pendant lighting cluster",
      "built-in wine storage",
      "open shelving with curated display",
      "professional-grade range",
      "oversized farmhouse sink"
    ];

    const style = styles[Math.floor(Math.random() * styles.length)];
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    const feature1 = features[Math.floor(Math.random() * features.length)];
    const feature2 = features[Math.floor(Math.random() * features.length)];

    const title = `${style} Kitchen`;
    const prompt = `${style} luxury American kitchen design featuring ${palette}. The space includes a ${feature1} and ${feature2}. High-end finishes, natural light flooding through large windows, professional photography, interior design magazine quality, 8k resolution.`;

    setRandomTitle(title);
    setRandomPrompt(prompt);
    setShowRandomDialog(true);
  };

  const handleConfirmRandomGeneration = async () => {
    setIsGeneratingRandom(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-random-kitchen', {
        body: { prompt: randomPrompt, title: randomTitle }
      });

      if (error) throw error;
      
      if (data?.imageUrl && data?.id) {
        setGeneratedImages(prev => [{
          id: data.id,
          url: data.imageUrl,
          title: data.title,
          prompt: data.prompt,
          isStatic: false
        }, ...prev]);
        
        toast.success(`New ${data.title} generated!`);
        setShowRandomDialog(false);
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Random generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate random kitchen");
    } finally {
      setIsGeneratingRandom(false);
    }
  };

  const handleRandomDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isGeneratingRandom) {
      e.preventDefault();
      handleConfirmRandomGeneration();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Image - Top section */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img 
          src={kitchenHero} 
          alt="Luxury modern kitchen" 
          className="w-full h-full object-cover"
        />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col items-center px-6 py-6">
        <div className="flex flex-col items-center max-w-md w-full text-center gap-5">
          
          {/* Kyle Avatar - positioned at top of content, overlapping image */}
          <button
            onClick={handleStart}
            className="group relative focus:outline-none focus:ring-0 transition-transform hover:scale-[1.02] active:scale-[0.98] -mt-32"
            aria-label="Start conversation with Kyle"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-6 rounded-full bg-primary/25 blur-xl group-hover:bg-primary/35 transition-colors" />
            
            <KyleAvatar size="xxl" />
          </button>

          {/* CTA indicator - right below avatar */}
          <div className="flex flex-col items-center gap-1 text-foreground">
            <ChevronUp className="h-5 w-5 animate-bounce" />
            <span className="text-sm font-medium">Tap Kyle to start designing</span>
          </div>

          {/* Hero headline - below avatar */}
          <div className="space-y-3 mt-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Meet <span className="text-primary">Kyle</span>,<br />
              Your Expert Kitchen Designer
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto">
              Get a stunning design concept in under 10 minutes.<br />
              100% free. Zero commitment.
            </p>
          </div>

          {/* Trust line */}
          <p className="text-xs text-muted-foreground mt-4">
            Powered by AI • Connect with certified pros near you
          </p>
        </div>
      </div>

      {/* Inspiration Gallery Section */}
      <div className="px-4 py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Inspiration Gallery
              </h2>
              {generatedImages.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  {generatedImages.length} AI-generated design{generatedImages.length !== 1 ? 's' : ''} • Click any card to generate more
                </p>
              )}
            </div>
            
            <Button
              onClick={generateRandomPromptPreview}
              className="gap-2 shrink-0"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Generate Random Kitchen
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {allImages.map((image) => (
                <Card 
                  key={image.id}
                  className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 relative cursor-pointer"
                  onClick={() => setHoveredImage(image)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {!image.isStatic && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 z-10">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-sm font-medium truncate mb-2">{image.title}</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(image);
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Generate Variations
                      </Button>
                    </div>
                  </div>
                </Card>
            ))}
          </div>

          {/* Centered click preview overlay */}
          {hoveredImage && createPortal(
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setHoveredImage(null)}
            >
              <div 
                className="w-[min(600px,90vw)] rounded-md border bg-popover shadow-md overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-3 right-3 h-8 w-8 z-10 bg-background/80 hover:bg-background"
                  onClick={() => setHoveredImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <img
                    src={hoveredImage.url}
                    alt={hoveredImage.title}
                    className="w-full aspect-square object-cover"
                  />
                  <button
                    onClick={() => navigate("/design-review", { 
                      state: { designImageUrl: hoveredImage.url, extractedInsights: hoveredImage.prompt, transcript: "" } 
                    })}
                    className="absolute top-3 left-3 bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Iterate with Kyle
                  </button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute bottom-3 right-3 h-8 w-8"
                    onClick={(e) => handleDeleteImage(hoveredImage.id, e)}
                    disabled={isDeletingId === hoveredImage.id}
                  >
                    {isDeletingId === hoveredImage.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-4 space-y-2 bg-background">
                  <h4 className="font-semibold text-base">{hoveredImage.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-4">{hoveredImage.prompt}</p>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Generation Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {selectedImage?.title}
            </DialogTitle>
            <DialogDescription>
              Generate a unique AI design based on this style
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              {/* Show generated image or original */}
              <div className="relative">
                <img 
                  src={generatedImageUrl || selectedImage.url} 
                  alt={selectedImage.title}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                {generatedImageUrl && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                    AI Generated
                  </div>
                )}
              </div>
              
              {/* Editable Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Pencil className="h-3 w-3" />
                    Prompt (editable):
                  </p>
                </div>
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="Describe your ideal kitchen design..."
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="flex-1 gap-2"
                    variant={generatedImageUrl ? "outline" : "default"}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {generatedImageUrl ? "Regenerating..." : "Generating..."}
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        {generatedImageUrl ? "Regenerate" : "Generate Image"}
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Always show "Use with Kyle" button */}
                <Button 
                  onClick={handleUseThisImage}
                  className="w-full gap-2"
                  variant="secondary"
                >
                  <Sparkles className="h-4 w-4" />
                  {generatedImageUrl ? "Use Generated with Kyle" : "Use This with Kyle"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Random Kitchen Confirmation Dialog */}
      <Dialog open={showRandomDialog} onOpenChange={setShowRandomDialog}>
        <DialogContent className="max-w-lg" onKeyDown={handleRandomDialogKeyDown}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              {randomTitle}
            </DialogTitle>
            <DialogDescription>
              Review the design description below. Press Enter or click Generate to create this kitchen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Design Description (editable):
              </p>
              <Textarea
                value={randomPrompt}
                onChange={(e) => setRandomPrompt(e.target.value)}
                className="min-h-[120px] text-sm"
                placeholder="Describe your ideal kitchen design..."
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRandomDialog(false)}
                className="flex-1"
                disabled={isGeneratingRandom}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmRandomGeneration}
                disabled={isGeneratingRandom}
                className="flex-1 gap-2"
              >
                {isGeneratingRandom ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to generate
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KyleSocialLanding;
