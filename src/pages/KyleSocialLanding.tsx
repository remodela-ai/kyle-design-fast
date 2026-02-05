import { useNavigate } from "react-router-dom";
import { KyleAvatar } from "@/components/KyleAvatar";
import { ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import kitchenHero from "@/assets/kitchen-hero.jpg";

const inspirationImages = [
  { id: 1, url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", title: "Modern White Kitchen" },
  { id: 2, url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", title: "Luxury Open Kitchen" },
  { id: 3, url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80", title: "Scandinavian Style" },
  { id: 4, url: "https://images.unsplash.com/photo-1600573472591-ee6c563aaec4?w=800&q=80", title: "Dark Wood Elegance" },
  { id: 5, url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80", title: "Minimalist Design" },
  { id: 6, url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80", title: "Industrial Chic" },
  { id: 7, url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80", title: "Contemporary Classic" },
  { id: 8, url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", title: "Bright & Airy" },
  { id: 9, url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80", title: "Coastal Kitchen" },
  { id: 10, url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80", title: "Rustic Modern" },
  { id: 11, url: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800&q=80", title: "Black & Gold" },
  { id: 12, url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80", title: "Marble Luxury" },
  { id: 13, url: "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=800&q=80", title: "Farmhouse Fresh" },
  { id: 14, url: "https://images.unsplash.com/photo-1600566752734-2a0cd66c42f6?w=800&q=80", title: "Urban Loft" },
  { id: 15, url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80", title: "Mediterranean Style" },
  { id: 16, url: "https://images.unsplash.com/photo-1600573472591-ee6c563aaec4?w=800&q=80", title: "Warm Wood Tones" },
  { id: 17, url: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80", title: "Sleek & Modern" },
  { id: 18, url: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80", title: "Traditional Elegance" },
  { id: 19, url: "https://images.unsplash.com/photo-1600566752547-33a300e5ed57?w=800&q=80", title: "Open Concept" },
  { id: 20, url: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&q=80", title: "Chef's Kitchen" },
];

const KyleSocialLanding = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/shazam");
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
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
            Inspiration Gallery
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {inspirationImages.map((image) => (
              <Card 
                key={image.id}
                className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-medium truncate">{image.title}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KyleSocialLanding;
