import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KyleAvatar } from "@/components/KyleAvatar";
import { ChevronUp, Sparkles, Loader2, Wand2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GalleryImage[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

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

  // Combine generated images (first) with static images
  const allImages = [...generatedImages, ...staticInspirationImages];

  const handleStart = () => {
    navigate("/shazam");
  };

  const handleGenerateImage = async () => {
    if (!selectedImage) return;
    
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-inspiration-image', {
        body: { prompt: selectedImage.prompt, title: selectedImage.title }
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
            prompt: selectedImage.prompt,
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
      toast.success("Image removed from gallery");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleUseThisImage = () => {
    if (generatedImageUrl) {
      navigate("/shazam", { 
        state: { 
          referenceImage: generatedImageUrl,
          initialPrompt: selectedImage?.prompt 
        } 
      });
    }
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
    setGeneratedImageUrl(null);
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
              Get a stunning design concept in under 5 minutes.<br />
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
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-2">
            Inspiration Gallery
          </h2>
          {generatedImages.length > 0 && (
            <p className="text-center text-muted-foreground text-sm mb-8">
              {generatedImages.length} AI-generated design{generatedImages.length !== 1 ? 's' : ''} • Click any card to generate more
            </p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {allImages.map((image) => (
              <Card 
                key={image.id}
                className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 relative"
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
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </div>
                  )}

                  {/* Delete button for generated images */}
                  {!image.isStatic && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteImage(image.id, e)}
                      disabled={isDeletingId === image.id}
                    >
                      {isDeletingId === image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
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
                        setSelectedImage(image);
                        setGeneratedImageUrl(null);
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate Design
                    </Button>
                  </div>
                </div>
              </Card>
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
              
              {/* Prompt display */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Prompt:</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedImage.prompt}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {!generatedImageUrl ? (
                  <Button 
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="flex-1 gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Image
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleGenerateImage}
                      disabled={isGenerating}
                      className="flex-1 gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          Regenerate
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleUseThisImage}
                      className="flex-1 gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Use This with Kyle
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KyleSocialLanding;
