import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Layers, Grid3X3, Box, Palette, Image, Brush, BookOpen, Video, Loader2, ExternalLink, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePipeline, ShoppingItem } from "@/hooks/usePipeline";
import { PipelineProgress } from "@/components/PipelineProgress";

interface ElementData {
  id: string;
  name: string;
  category: string;
  dimensions: { width: number; height: number; depth: number };
  color: string;
  material: string;
}

const features = [
  { icon: Grid3X3, label: "Spatial Analysis", stepNumber: 1 },
  { icon: Layers, label: "Architectural Plans", stepNumber: 2 },
  { icon: Box, label: "Items Extraction", stepNumber: 3 },
  { icon: Palette, label: "Design Moodboard", stepNumber: 4 },
  { icon: Image, label: "Material Flatlay", stepNumber: 5 },
  { icon: Brush, label: "Colors & Textures", stepNumber: 6 },
  { icon: BookOpen, label: "Your Story Book", stepNumber: 7 },
  { icon: Video, label: "Video Presentation", stepNumber: 8 },
];

export default function FreeProject360() {
  const [activeTab, setActiveTab] = useState<"visual" | "management">("visual");
  const location = useLocation();
  const { isRunning, currentStep, steps, architecturalPlans, itemsExtraction, startPipeline } = usePipeline();
  const [elements, setElements] = useState<ElementData[]>([]);
  const [pipelineStarted, setPipelineStarted] = useState(false);

  // Get the design image URL from navigation state
  const designImageUrl = location.state?.designImageUrl;
  const conversationSummary = location.state?.conversationSummary;

  // Auto-start pipeline when page loads with design image
  useEffect(() => {
    if (designImageUrl && !pipelineStarted && !isRunning) {
      console.log("Auto-starting pipeline with image:", designImageUrl);
      setPipelineStarted(true);
      startPipeline(designImageUrl, conversationSummary);
    }
  }, [designImageUrl, conversationSummary, pipelineStarted, isRunning, startPipeline]);

  // Extract elements from pipeline memory when spatial analysis completes
  useEffect(() => {
    const spatialStep = steps.find(s => s.stepNumber === 1);
    if (spatialStep?.status === "completed" && spatialStep.output) {
      const output = spatialStep.output as { parsedAnalysis?: { elements?: ElementData[] } };
      if (output.parsedAnalysis?.elements) {
        setElements(output.parsedAnalysis.elements);
      }
    }
  }, [steps]);

  const getStepStatus = (stepNumber: number) => {
    const step = steps.find(s => s.stepNumber === stepNumber);
    return step?.status || "pending";
  };

  const formatPrice = (min: number, max: number, currency: string) => {
    return `${currency === "USD" ? "$" : currency}${min.toLocaleString()} - ${currency === "USD" ? "$" : currency}${max.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-8 pt-4">
        {/* Logo Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
          <Layers className="h-8 w-8 text-primary-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          360° Design Project
        </h1>
        <p className="text-muted-foreground text-center text-base mb-8">
          Complete AI-powered interior design pipeline
        </p>

        {/* Pipeline Progress */}
        {isRunning && (
          <div className="w-full max-w-md mb-8">
            <PipelineProgress steps={steps} currentStep={currentStep} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-secondary rounded-full p-1 mb-10">
          <button
            onClick={() => setActiveTab("visual")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "visual"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visual Design
          </button>
          <button
            onClick={() => setActiveTab("management")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "management"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Management
          </button>
        </div>

        {/* Features Grid */}
        {activeTab === "visual" && (
          <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-md w-full mb-10">
            {features.map((feature, index) => {
              const status = getStepStatus(feature.stepNumber);
              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
                    status === "completed" 
                      ? "bg-green-500 shadow-green-500/30" 
                      : status === "processing"
                      ? "bg-primary shadow-primary/30 animate-pulse"
                      : status === "error"
                      ? "bg-destructive shadow-destructive/30"
                      : "bg-primary/30 shadow-primary/20"
                  } hover:scale-105`}>
                    {status === "processing" ? (
                      <Loader2 className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground animate-spin" />
                    ) : (
                      <feature.icon className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-center text-muted-foreground leading-tight">
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Elements Table - Shows after Spatial Analysis completes */}
        {activeTab === "visual" && elements.length > 0 && (
          <div className="w-full max-w-3xl overflow-x-auto mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Extracted Elements & Measurements</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Element</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Category</th>
                    <th className="px-4 py-3 text-center font-medium text-foreground">X (width)</th>
                    <th className="px-4 py-3 text-center font-medium text-foreground">Y (height)</th>
                    <th className="px-4 py-3 text-center font-medium text-foreground">Z (depth)</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Material</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Color</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {elements.map((element, idx) => (
                    <tr key={element.id || idx} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{element.name}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{element.category}</td>
                      <td className="px-4 py-3 text-center text-primary font-mono">{element.dimensions?.width ? `${element.dimensions.width}m` : "—"}</td>
                      <td className="px-4 py-3 text-center text-primary font-mono">{element.dimensions?.height ? `${element.dimensions.height}m` : "—"}</td>
                      <td className="px-4 py-3 text-center text-primary font-mono">{element.dimensions?.depth ? `${element.dimensions.depth}m` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{element.material || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{element.color || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Architectural Plans - Shows after Step 2 completes */}
        {activeTab === "visual" && (architecturalPlans.floorPlan || architecturalPlans.elevationView) && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Architectural Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Floor Plan */}
              {architecturalPlans.floorPlan && (
                <div className="rounded-lg border border-border overflow-hidden bg-card">
                  <div className="p-3 bg-secondary border-b border-border">
                    <h3 className="font-medium text-foreground text-center">Floor Plan (Top View)</h3>
                  </div>
                  <div className="p-4">
                    <img 
                      src={architecturalPlans.floorPlan} 
                      alt="Floor Plan" 
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Elevation View */}
              {architecturalPlans.elevationView && (
                <div className="rounded-lg border border-border overflow-hidden bg-card">
                  <div className="p-3 bg-secondary border-b border-border">
                    <h3 className="font-medium text-foreground text-center">Elevation View (Front View)</h3>
                  </div>
                  <div className="p-4">
                    <img 
                      src={architecturalPlans.elevationView} 
                      alt="Elevation View" 
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 Processing Indicator */}
        {activeTab === "visual" && getStepStatus(2) === "processing" && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Generating Architectural Plans...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border overflow-hidden bg-card animate-pulse">
                <div className="p-3 bg-secondary border-b border-border">
                  <h3 className="font-medium text-foreground text-center">Floor Plan</h3>
                </div>
                <div className="p-4 flex items-center justify-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              </div>
              <div className="rounded-lg border border-border overflow-hidden bg-card animate-pulse">
                <div className="p-3 bg-secondary border-b border-border">
                  <h3 className="font-medium text-foreground text-center">Elevation View</h3>
                </div>
                <div className="p-4 flex items-center justify-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Extraction - Shopping List with Links */}
        {activeTab === "visual" && itemsExtraction.items.length > 0 && (
          <div className="w-full max-w-4xl mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Shopping List
              </h2>
              {itemsExtraction.totalEstimatedBudget && (
                <div className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  Total: {formatPrice(
                    itemsExtraction.totalEstimatedBudget.min,
                    itemsExtraction.totalEstimatedBudget.max,
                    itemsExtraction.totalEstimatedBudget.currency
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemsExtraction.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground">{item.productName}</h3>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground capitalize">
                      {item.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-primary font-bold">
                      {formatPrice(item.estimatedPriceRange.min, item.estimatedPriceRange.max, item.estimatedPriceRange.currency)}
                    </span>
                    {item.material && (
                      <span className="text-xs text-muted-foreground">{item.material}</span>
                    )}
                  </div>

                  {/* Suggested Retailers */}
                  {item.suggestedRetailers && item.suggestedRetailers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.suggestedRetailers.slice(0, 3).map((retailer, rIdx) => (
                        <span key={rIdx} className="text-xs bg-secondary/50 px-2 py-0.5 rounded text-muted-foreground">
                          {retailer}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Shopping Link */}
                  <a 
                    href={item.shoppingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Shop Now
                  </a>
                </div>
              ))}
            </div>

            {/* Shopping Tips */}
            {itemsExtraction.shoppingTips && itemsExtraction.shoppingTips.length > 0 && (
              <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
                <h3 className="font-medium text-foreground mb-2">Shopping Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {itemsExtraction.shoppingTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 3 Processing Indicator */}
        {activeTab === "visual" && getStepStatus(3) === "processing" && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Generating Shopping List...
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                  <div className="h-5 bg-secondary rounded w-3/4 mb-3" />
                  <div className="h-3 bg-secondary rounded w-full mb-2" />
                  <div className="h-3 bg-secondary rounded w-2/3 mb-4" />
                  <div className="h-8 bg-primary/20 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "management" && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Layers className="h-12 w-12 mb-4 text-primary/50" />
            <p className="text-center">Management features coming soon</p>
          </div>
        )}

        {/* No image message */}
        {!designImageUrl && !isRunning && (
          <div className="text-center text-muted-foreground mt-8 p-6 rounded-lg bg-secondary/50">
            <p className="mb-2">No design image provided.</p>
            <p className="text-sm">Go to <Link to="/shazam" className="text-primary hover:underline">Shazam</Link> to generate a design first.</p>
          </div>
        )}
      </main>
    </div>
  );
}
