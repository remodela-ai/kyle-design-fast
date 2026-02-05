import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KyleAvatar } from "@/components/KyleAvatar";
import { ChevronUp, Sparkles, Loader2, Wand2, Trash2, Pencil, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import kitchenHero from "@/assets/kitchen-hero.jpg";

const staticInspirationImages = [
  { id: "static-1", url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", title: "Modern White Kitchen", prompt: "Ultra-modern white kitchen with handleless cabinets, quartz waterfall island, integrated appliances, LED strip lighting under cabinets, matte black fixtures, floor-to-ceiling windows with city views", isStatic: true },
  { id: "static-2", url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80", title: "Minimalist Kitchen", prompt: "Minimalist Scandinavian kitchen, white oak cabinets, concrete countertops, open shelving with ceramics, pendant lights, natural light flooding through skylights, indoor herbs", isStatic: true },
  { id: "static-3", url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80", title: "Industrial Modern", prompt: "Industrial modern kitchen, exposed brick wall, stainless steel countertops, open metal shelving, vintage pendant lights, concrete floors, professional range hood", isStatic: true },
  { id: "static-4", url: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800&q=80", title: "Black & Gold Luxury", prompt: "Luxurious black kitchen with gold hardware, marble backsplash, integrated wine fridge, statement chandelier, velvet bar stools, dramatic lighting", isStatic: true },
  { id: "static-5", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", title: "Open Concept Living", prompt: "Open concept modern kitchen flowing into living space, large island with seating, hidden pantry, floor-to-ceiling cabinetry, professional appliances, natural wood accents", isStatic: true },
  { id: "static-6", url: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80", title: "Sleek Contemporary", prompt: "Sleek contemporary kitchen, high-gloss gray cabinets, waterfall marble island, touch-latch doors, built-in coffee station, smart home integration", isStatic: true },
  { id: "static-7", url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80", title: "Warm Wood Tones", prompt: "Modern kitchen with warm walnut cabinetry, white quartz counters, brass fixtures, herringbone backsplash, statement range hood, breakfast nook", isStatic: true },
  { id: "static-8", url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", title: "Bright & Airy", prompt: "Light-filled modern kitchen, white shaker cabinets, subway tile to ceiling, brass hardware, farmhouse sink, large windows overlooking garden", isStatic: true },
  { id: "static-9", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80", title: "Contemporary Classic", prompt: "Transitional modern kitchen, two-tone cabinetry navy and white, marble countertops, glass-front upper cabinets, statement pendants, hardwood floors", isStatic: true },
  { id: "static-10", url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80", title: "Modern Farmhouse", prompt: "Modern farmhouse kitchen, shiplap accent wall, apron sink, open shelving, butcher block island, vintage-inspired fixtures, beamed ceiling", isStatic: true },
  { id: "static-11", url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80", title: "Mediterranean Modern", prompt: "Mediterranean-inspired modern kitchen, terracotta tiles, arched range hood, olive wood accents, zellige tile backsplash, wrought iron details", isStatic: true },
  { id: "static-12", url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80", title: "Marble Elegance", prompt: "Elegant all-marble kitchen, bookmatched marble walls, integrated appliances, crystal chandelier, mirror accents, gold trim details", isStatic: true },
  { id: "static-13", url: "https://images.unsplash.com/photo-1600566752734-2a0cd66c42f6?w=800&q=80", title: "Urban Loft Kitchen", prompt: "Urban loft kitchen, exposed ductwork, polished concrete floors, floating shelves, professional range, industrial bar stools, brick accent", isStatic: true },
  { id: "static-14", url: "https://images.unsplash.com/photo-1600566752547-33a300e5ed57?w=800&q=80", title: "Open Entertaining", prompt: "Chef's entertaining kitchen, double islands, built-in seating, beverage center, hidden appliances, statement lighting, indoor-outdoor flow", isStatic: true },
  { id: "static-15", url: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&q=80", title: "Professional Chef", prompt: "Professional-grade home kitchen, commercial range, pot filler, stainless prep stations, walk-in pantry, butcher block counters", isStatic: true },
  { id: "static-16", url: "https://images.unsplash.com/photo-1600573472591-ee6c563aaec4?w=800&q=80", title: "Dark Wood Modern", prompt: "Modern kitchen with dark espresso cabinetry, light quartz counters, under-cabinet lighting, glass tile backsplash, breakfast bar", isStatic: true },
  { id: "static-17", url: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80", title: "Classic White", prompt: "Timeless white kitchen, Carrara marble, glass-front cabinets, La Cornue range, antique brass hardware, beadboard ceiling", isStatic: true },
  { id: "static-18", url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", title: "Coastal Modern", prompt: "Coastal modern kitchen, light blue cabinets, white quartz, natural fiber pendants, rattan bar stools, ocean views, driftwood accents", isStatic: true },
  { id: "static-19", url: "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=800&q=80", title: "Rustic Modern", prompt: "Rustic modern kitchen, reclaimed wood beams, stone accent wall, farmhouse sink, vintage lighting, copper accents, terracotta floors", isStatic: true },
  { id: "static-20", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80", title: "Scandinavian Minimal", prompt: "Scandinavian kitchen, pale wood cabinets, white walls, minimal hardware, functional storage, natural materials, hygge atmosphere", isStatic: true },
];

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
  const [hiddenStaticIds, setHiddenStaticIds] = useState<string[]>([]);
  const [showRandomDialog, setShowRandomDialog] = useState(false);
  const [randomPrompt, setRandomPrompt] = useState<string>("");
  const [randomTitle, setRandomTitle] = useState<string>("");

  // Load hidden static images from localStorage
  useEffect(() => {
    const hidden = localStorage.getItem("hiddenInspirationImages");
    if (hidden) {
      setHiddenStaticIds(JSON.parse(hidden));
    }
  }, []);

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

  const handleDeleteImage = async (imageId: string, isStatic: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeletingId(imageId);
    
    try {
      if (isStatic) {
        // Hide static image using localStorage
        const newHidden = [...hiddenStaticIds, imageId];
        setHiddenStaticIds(newHidden);
        localStorage.setItem("hiddenInspirationImages", JSON.stringify(newHidden));
        toast.success("Image removed from gallery");
      } else {
        // Delete from database
        const { error } = await supabase
          .from("inspiration_gallery")
          .delete()
          .eq("id", imageId);

        if (error) throw error;
        
        setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
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
              <HoverCard openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Card 
                    key={image.id}
                    className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 relative cursor-pointer"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* AI Generated badge */}
                      {!image.isStatic && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 z-10">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </div>
                      )}

                      {/* Delete button for ALL images */}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => handleDeleteImage(image.id, !!image.isStatic, e)}
                        disabled={isDeletingId === image.id}
                      >
                        {isDeletingId === image.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>

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
                </HoverCardTrigger>
                <HoverCardContent 
                  className="w-[800px] max-w-[90vw] p-0 overflow-hidden fixed left-1/2 top-4 -translate-x-1/2 z-50" 
                  side="top" 
                  sideOffset={-9999}
                >
                  <div className="relative">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full aspect-[4/3] object-cover"
                    />
                    {!image.isStatic && (
                      <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        AI Generated
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2 bg-background">
                    <h4 className="font-semibold text-base">{image.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-4">{image.prompt}</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
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
