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
import bathroomHero from "@/assets/bathroom-hero.jpg";

const staticInspirationImages = [
  { id: "bath-static-1", url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80", title: "Modern Spa Bathroom", prompt: "Ultra-modern spa bathroom with freestanding soaking tub, rainfall shower, marble walls, floating vanity with vessel sinks, LED mirror lighting, floor-to-ceiling windows with privacy glass", isStatic: true },
  { id: "bath-static-2", url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80", title: "Minimalist White", prompt: "Minimalist white bathroom, clean lines, wall-hung toilet, frameless glass shower, natural light, warm wood accents, hidden storage, zen atmosphere", isStatic: true },
  { id: "bath-static-3", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80", title: "Luxury Master Bath", prompt: "Luxury master bathroom, double vanity with marble countertop, crystal chandelier, clawfoot tub, herringbone tile floors, gold fixtures, large mirrors", isStatic: true },
  { id: "bath-static-4", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80", title: "Contemporary Dark", prompt: "Contemporary dark bathroom, black marble walls, matte black fixtures, floating vanity, statement pendant lighting, walk-in shower with bench seating", isStatic: true },
  { id: "bath-static-5", url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80", title: "Natural Stone Retreat", prompt: "Natural stone bathroom retreat, travertine walls, copper fixtures, wooden accents, skylight, indoor plants, organic spa feel", isStatic: true },
  { id: "bath-static-6", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80", title: "Coastal Elegance", prompt: "Coastal elegant bathroom, white shiplap walls, nautical brass fixtures, soft blue accents, beadboard ceiling, vintage clawfoot tub, seaside charm", isStatic: true },
  { id: "bath-static-7", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80", title: "Scandinavian Zen", prompt: "Scandinavian zen bathroom, pale wood vanity, white walls, warm textiles, simple hardware, natural materials, hygge atmosphere", isStatic: true },
  { id: "bath-static-8", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", title: "Hollywood Glam", prompt: "Hollywood glamour bathroom, mirrored walls, crystal sconces, velvet stool, marble floors, gold accents, statement chandelier, vintage Hollywood regency", isStatic: true },
  { id: "bath-static-9", url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", title: "Japanese Soaking", prompt: "Japanese-inspired bathroom, deep soaking hinoki tub, natural wood, river rock flooring, bamboo accents, shoji screens, minimalist zen design", isStatic: true },
  { id: "bath-static-10", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", title: "Industrial Loft", prompt: "Industrial loft bathroom, exposed brick, concrete floors, vintage fixtures, copper piping, warehouse windows, reclaimed wood vanity", isStatic: true },
  { id: "bath-static-11", url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80", title: "Mediterranean Villa", prompt: "Mediterranean villa bathroom, terracotta tiles, wrought iron details, arched mirrors, mosaic accents, warm earth tones, old-world charm", isStatic: true },
  { id: "bath-static-12", url: "https://images.unsplash.com/photo-1600573472591-ee6c563aaec4?w=800&q=80", title: "Art Deco Revival", prompt: "Art Deco bathroom revival, geometric patterns, black and gold color scheme, curved vanity, statement mirrors, terrazzo floors, glamorous lighting", isStatic: true },
  { id: "bath-static-13", url: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80", title: "French Provincial", prompt: "French provincial bathroom, carved vanity, crystal chandeliers, ornate mirrors, soft pastels, clawfoot tub, romantic shabby chic elements", isStatic: true },
  { id: "bath-static-14", url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80", title: "Modern Organic", prompt: "Modern organic bathroom, curved shapes, natural stone, live edge wood, matte finishes, indirect lighting, biophilic design elements", isStatic: true },
  { id: "bath-static-15", url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", title: "Transitional Classic", prompt: "Transitional classic bathroom, shaker-style vanity, subway tile, classic fixtures with modern updates, neutral palette, timeless elegance", isStatic: true },
  { id: "bath-static-16", url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80", title: "Bohemian Escape", prompt: "Bohemian bathroom escape, patterned tiles, vintage rug, macrame accents, brass fixtures, plants everywhere, eclectic global style", isStatic: true },
  { id: "bath-static-17", url: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800&q=80", title: "Monochrome Luxury", prompt: "Monochrome luxury bathroom, black and white marble, crystal fixtures, oversized mirrors, sleek lines, high contrast drama", isStatic: true },
  { id: "bath-static-18", url: "https://images.unsplash.com/photo-1600566752734-2a0cd66c42f6?w=800&q=80", title: "Rustic Mountain", prompt: "Rustic mountain bathroom, reclaimed wood beams, stone walls, copper soaking tub, lodge-style fixtures, cozy cabin feel", isStatic: true },
  { id: "bath-static-19", url: "https://images.unsplash.com/photo-1600566752547-33a300e5ed57?w=800&q=80", title: "Urban Penthouse", prompt: "Urban penthouse bathroom, floor-to-ceiling windows, city views, floating vanity, rain shower, minimalist fixtures, metropolitan luxury", isStatic: true },
  { id: "bath-static-20", url: "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=800&q=80", title: "Tropical Paradise", prompt: "Tropical paradise bathroom, outdoor shower, natural stone, exotic wood, lush greenery, resort-style luxury, Bali-inspired design", isStatic: true },
];

type GalleryImage = {
  id: string;
  url: string;
  title: string;
  prompt: string;
  isStatic?: boolean;
};

const BathroomSocialLanding = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GalleryImage[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [hiddenStaticIds, setHiddenStaticIds] = useState<string[]>([]);
  const [showRandomDialog, setShowRandomDialog] = useState(false);
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [randomTitle, setRandomTitle] = useState<string>("");
  const [hoveredImage, setHoveredImage] = useState<GalleryImage | null>(null);

  // Load hidden static images from localStorage
  useEffect(() => {
    const hidden = localStorage.getItem("hiddenBathroomInspirationImages");
    if (hidden) {
      setHiddenStaticIds(JSON.parse(hidden));
    }
  }, []);

  // Fetch generated images from database
  useEffect(() => {
    const fetchGeneratedImages = async () => {
      const { data, error } = await supabase
        .from("bathroom_inspiration_gallery")
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

  // Filter out hidden static images and combine with generated
  const visibleStaticImages = staticInspirationImages.filter(
    (img) => !hiddenStaticIds.includes(img.id)
  );
  const allImages = [...generatedImages, ...visibleStaticImages];

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
      
      const { data, error } = await supabase.functions.invoke('generate-bathroom-inspiration', {
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

  const handleDeleteImage = async (imageId: string, isStatic: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeletingId(imageId);
    
    try {
      if (isStatic) {
        // Hide static image using localStorage
        const newHidden = [...hiddenStaticIds, imageId];
        setHiddenStaticIds(newHidden);
        localStorage.setItem("hiddenBathroomInspirationImages", JSON.stringify(newHidden));
        setHoveredImage(null);
        toast.success("Image removed from gallery");
      } else {
        // Delete from database
        const { error } = await supabase
          .from("bathroom_inspiration_gallery")
          .delete()
          .eq("id", imageId);

        if (error) throw error;
        
        setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
        setHoveredImage(null);
        toast.success("Image removed from gallery");
      }
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
      "Ultra-modern spa",
      "Warm Scandinavian",
      "Industrial loft",
      "Mediterranean retreat",
      "French provincial elegance",
      "Japanese zen minimalism",
      "Art deco glamour",
      "Rustic farmhouse",
      "Contemporary transitional",
      "Bold maximalist",
      "Soft organic modern",
      "Sleek urban penthouse"
    ];

    const colorPalettes = [
      "crisp whites with warm oak vanity",
      "deep navy blue with brass fixtures",
      "sage green with natural stone",
      "charcoal gray with white marble veining",
      "warm terracotta with cream tones",
      "black matte with gold accents",
      "soft blush pink with rose gold fixtures",
      "rich emerald with copper details",
      "warm walnut with cream surfaces",
      "pure white with brushed nickel",
      "moody forest green with natural wood",
      "soft gray-blue with white quartz"
    ];

    const features = [
      "freestanding soaking tub",
      "floor-to-ceiling marble walls",
      "statement chandelier",
      "smart mirror with integrated lighting",
      "hidden storage solutions",
      "rainfall shower with body jets",
      "heated floors",
      "double vanity with vessel sinks",
      "spa-style steam shower",
      "natural skylight"
    ];

    const style = styles[Math.floor(Math.random() * styles.length)];
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    const feature1 = features[Math.floor(Math.random() * features.length)];
    const feature2 = features[Math.floor(Math.random() * features.length)];

    const title = `${style} Bathroom`;
    const prompt = `${style} luxury American bathroom design featuring ${palette}. The space includes a ${feature1} and ${feature2}. High-end finishes, natural light flooding through large windows, professional photography, interior design magazine quality, 8k resolution.`;

    setRandomTitle(title);
    setRandomPrompt(prompt);
    setShowRandomDialog(true);
  };

  const handleConfirmRandomGeneration = async () => {
    setIsGeneratingRandom(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-random-bathroom', {
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
      toast.error(error instanceof Error ? error.message : "Failed to generate random bathroom");
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
          src={bathroomHero} 
          alt="Luxury modern bathroom" 
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
              Your Expert Bathroom Designer
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto">
              Get a stunning bathroom design concept in under 10 minutes.<br />
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
              Generate Random Bathroom
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
                    onClick={(e) => handleDeleteImage(hoveredImage.id, !!hoveredImage.isStatic, e)}
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
                  placeholder="Describe your ideal bathroom design..."
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

      {/* Random Bathroom Confirmation Dialog */}
      <Dialog open={showRandomDialog} onOpenChange={setShowRandomDialog}>
        <DialogContent className="max-w-lg" onKeyDown={handleRandomDialogKeyDown}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              {randomTitle}
            </DialogTitle>
            <DialogDescription>
              Review the design description below. Press Enter or click Generate to create this bathroom.
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
                placeholder="Describe your ideal bathroom design..."
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

export default BathroomSocialLanding;
