import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Layers, Grid3X3, Box, Palette, Image, Brush, BookOpen, Video, Loader2, ExternalLink, ShoppingCart, Upload, FileText, ClipboardList, Calendar, Wrench, Users, Settings, CheckSquare, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePipeline, ShoppingItem } from "@/hooks/usePipeline";
import { ImageUploadDialog } from "@/components/ImageUploadDialog";
import { toast } from "sonner";

interface ElementData {
  id: string;
  name: string;
  category: string;
  dimensions: { width: number; height: number; depth: number };
  color: string;
  material: string;
}

const visualFeatures = [
  { icon: Grid3X3, label: "Spatial Analysis", stepNumber: 1 },
  { icon: Layers, label: "Architectural Plans", stepNumber: 2 },
  { icon: Box, label: "Items Extraction", stepNumber: 3 },
  { icon: Palette, label: "Design Moodboard", stepNumber: 4 },
  { icon: Image, label: "Material Flatlay", stepNumber: 5 },
  { icon: Brush, label: "Colors & Textures", stepNumber: 6 },
  { icon: BookOpen, label: "Your Story Book", stepNumber: 7 },
  { icon: Video, label: "Video Presentation", stepNumber: 8 },
];

const managementFeatures = [
  { icon: FileText, label: "Proposal & Budget", stepNumber: 1 },
  { icon: ClipboardList, label: "Bill of Materials", stepNumber: 2 },
  { icon: Calendar, label: "Project Timeline", stepNumber: 3 },
  { icon: Wrench, label: "Technical Specs", stepNumber: 4 },
  { icon: Users, label: "Supplier Directory", stepNumber: 5 },
  { icon: Settings, label: "Installation Plan", stepNumber: 6 },
  { icon: CheckSquare, label: "Delivery Checklist", stepNumber: 7 },
  { icon: Award, label: "Project Cover", stepNumber: 8 },
];

export default function FreeProject360() {
  const [activeTab, setActiveTab] = useState<"visual" | "management">("visual");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const location = useLocation();
  const { 
    isRunning, currentStep, steps, architecturalPlans, itemsExtraction, moodboardUrl, flatlayUrl, colorsTexturesUrl, storybookUrl, videoPresentationUrl, pipelineComplete, startPipeline, resetPipeline,
    managementSteps, managementCurrentStep, isManagementRunning, managementComplete, startManagementPipeline,
    proposalBudgetUrl, bomUrl, timelineUrl, specsUrl, suppliersUrl, installationUrl, checklistUrl, coverUrl
  } = usePipeline();
  const [elements, setElements] = useState<ElementData[]>([]);
  const [pipelineStarted, setPipelineStarted] = useState(false);
  const [userUploadedImage, setUserUploadedImage] = useState<string | null>(null);
  
  // Timer state
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Get the design image URL from navigation state
  const designImageUrl = location.state?.designImageUrl || userUploadedImage;
  const conversationSummary = location.state?.conversationSummary;

  // Handle image upload from dialog
  const handleImageSelected = (imageDataUrl: string) => {
    console.log("User uploaded image for pipeline");
    setUserUploadedImage(imageDataUrl);
    setPipelineStarted(true);
    setFinalTime(null);
    resetPipeline();
    startPipeline(imageDataUrl, "User uploaded design image");
    toast.success("Pipeline started with your image!");
  };

  // Handle logo click to open upload dialog
  const handleLogoClick = () => {
    if (!isRunning && !isManagementRunning) {
      setUploadDialogOpen(true);
    }
  };

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start timer when pipeline starts
  useEffect(() => {
    if (isRunning && !timerStarted && !finalTime) {
      console.log("Starting timer...");
      setTimerStarted(true);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);
    }
  }, [isRunning, timerStarted, finalTime]);

  // Stop timer when management pipeline completes
  useEffect(() => {
    if (managementComplete && timerStarted && !finalTime) {
      console.log("Stopping timer - all pipelines complete!");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setFinalTime(elapsedTime);
      setTimerStarted(false);
      toast.success(`¡Proyecto completo en ${formatTime(elapsedTime)}!`);
    }
  }, [managementComplete, timerStarted, elapsedTime, finalTime]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-start pipeline when page loads with design image
  useEffect(() => {
    if (designImageUrl && !pipelineStarted && !isRunning) {
      console.log("Auto-starting pipeline with image:", designImageUrl);
      setPipelineStarted(true);
      setFinalTime(null);
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

  // Auto-start management pipeline when visual pipeline completes
  useEffect(() => {
    if (pipelineComplete && !isManagementRunning && !managementComplete) {
      console.log("Visual pipeline complete, auto-starting management pipeline...");
      const timer = setTimeout(() => {
        startManagementPipeline();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pipelineComplete, isManagementRunning, managementComplete, startManagementPipeline]);

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
        {/* Logo Icon - Clickable to upload image */}
        <div 
          onClick={handleLogoClick}
          className={`w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30 transition-all duration-300 ${
            !isRunning ? "cursor-pointer hover:scale-110 hover:shadow-primary/50" : ""
          }`}
          title={!isRunning ? "Click to upload your design image" : "Pipeline is running..."}
        >
          {isRunning ? (
            <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-primary-foreground" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          360° Design Project
        </h1>
        <p className="text-muted-foreground text-center text-base mb-4">
          Complete AI-powered interior design pipeline
        </p>

        {/* Timer Display */}
        {(timerStarted || finalTime !== null) && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
            finalTime !== null 
              ? "bg-green-500/20 border border-green-500/30" 
              : "bg-primary/20 border border-primary/30"
          }`}>
            <Clock className={`h-5 w-5 ${finalTime !== null ? "text-green-500" : "text-primary"}`} />
            <span className={`font-mono text-lg font-bold ${finalTime !== null ? "text-green-500" : "text-primary"}`}>
              {formatTime(finalTime !== null ? finalTime : elapsedTime)}
            </span>
            {finalTime === null && (
              <span className="text-xs text-muted-foreground ml-2">
                {isManagementRunning ? "Management" : "Visual Design"}
              </span>
            )}
            {finalTime !== null && (
              <span className="text-xs text-green-500 ml-2">¡Completado!</span>
            )}
          </div>
        )}


        {/* Uploaded Image Preview */}
        {designImageUrl && (
          <div className="w-full max-w-md mb-8">
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
              <div className="p-2 bg-secondary/50 border-b border-border">
                <p className="text-xs text-muted-foreground text-center">Your Design Image</p>
              </div>
              <div className="p-3">
                <img 
                  src={designImageUrl} 
                  alt="Uploaded design" 
                  className="w-full h-auto rounded-lg object-cover max-h-64"
                />
              </div>
            </div>
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
            {visualFeatures.map((feature, index) => {
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

        {/* Design Moodboard - Shows after Step 4 completes */}
        {activeTab === "visual" && moodboardUrl && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Design Moodboard
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
              <img 
                src={moodboardUrl} 
                alt="Design Moodboard" 
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Step 4 Processing Indicator */}
        {activeTab === "visual" && getStepStatus(4) === "processing" && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Creating Design Moodboard...
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card animate-pulse">
              <div className="aspect-video bg-secondary flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
          </div>
        )}

        {/* Material Flatlay - Shows after Step 5 completes */}
        {activeTab === "visual" && flatlayUrl && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Material Flatlay
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
              <img 
                src={flatlayUrl} 
                alt="Material Flatlay" 
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Step 5 Processing Indicator */}
        {activeTab === "visual" && getStepStatus(5) === "processing" && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Creating Material Flatlay...
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card animate-pulse">
              <div className="aspect-square bg-secondary flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
          </div>
        )}

        {/* Colors & Textures - Shows after Step 6 completes */}
        {activeTab === "visual" && colorsTexturesUrl && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brush className="h-5 w-5 text-primary" />
              Colors & Textures Palette
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
              <img 
                src={colorsTexturesUrl} 
                alt="Colors & Textures Palette" 
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Step 6 Processing Indicator */}
        {activeTab === "visual" && getStepStatus(6) === "processing" && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brush className="h-5 w-5 text-primary" />
              Creating Colors & Textures Palette...
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card animate-pulse">
              <div className="aspect-video bg-secondary flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
          </div>
        )}

        {/* Your Story Book - Shows after Step 7 completes */}
        {activeTab === "visual" && storybookUrl && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Your Design Story
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
              <img 
                src={storybookUrl} 
                alt="Your Design Story" 
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Step 7 Processing Indicator */}
        {activeTab === "visual" && getStepStatus(7) === "processing" && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Creating Your Design Story...
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card animate-pulse">
              <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
          </div>
        )}

        {/* Video Presentation - Shows after Step 8 completes */}
        {activeTab === "visual" && videoPresentationUrl && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video Presentation
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg relative">
              <img 
                src={videoPresentationUrl} 
                alt="Video Presentation" 
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Step 8 Processing Indicator */}
        {activeTab === "visual" && getStepStatus(8) === "processing" && (
          <div className="w-full max-w-4xl mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Creating Video Presentation...
            </h2>
            <div className="rounded-xl border border-border overflow-hidden bg-card animate-pulse">
              <div className="aspect-video bg-secondary flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Complete Message */}
        {activeTab === "visual" && pipelineComplete && (
          <div className="w-full max-w-4xl mb-10 p-6 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Pipeline Complete!</h2>
            </div>
            <p className="text-muted-foreground">
              Your complete 360° design project has been generated. All 8 deliverables are ready for download.
            </p>
          </div>
        )}

        {activeTab === "management" && (
          <>
            {/* Management Features Grid */}
            <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-md w-full mb-10">
              {managementFeatures.map((feature, index) => {
                const step = managementSteps.find(s => s.stepNumber === feature.stepNumber);
                const status = step?.status || "pending";
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

            {/* Start Management Pipeline Button */}
            {pipelineComplete && !isManagementRunning && !managementComplete && (
              <Button 
                variant="kyle" 
                onClick={startManagementPipeline}
                className="mb-10 gap-2"
              >
                <FileText className="h-4 w-4" />
                Generar Anteproyecto Completo
              </Button>
            )}

            {/* Management Pipeline Not Started Message */}
            {!pipelineComplete && !isManagementRunning && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Layers className="h-12 w-12 mb-4 text-primary/50" />
                <p className="text-center">Completa el pipeline de Visual Design primero para desbloquear Management</p>
              </div>
            )}

            {/* Management Step Processing Indicator */}
            {isManagementRunning && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  Generando {managementFeatures.find(f => f.stepNumber === managementCurrentStep)?.label}...
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card animate-pulse">
                  <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Propuesta y Presupuesto */}
            {proposalBudgetUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Propuesta y Presupuesto
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={proposalBudgetUrl} alt="Propuesta y Presupuesto" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Step 2: Lista de Materiales (BOM) */}
            {bomUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Lista de Materiales (BOM)
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={bomUrl} alt="Bill of Materials" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Step 3: Cronograma de Obra */}
            {timelineUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Cronograma de Obra
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={timelineUrl} alt="Project Timeline" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Step 4: Especificaciones Técnicas */}
            {specsUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Especificaciones Técnicas
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={specsUrl} alt="Technical Specifications" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Step 5: Directorio de Proveedores */}
            {suppliersUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Directorio de Proveedores
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={suppliersUrl} alt="Supplier Directory" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Step 6: Plano de Instalaciones */}
            {installationUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Plano de Instalaciones
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={installationUrl} alt="Installation Plan" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Step 7: Checklist de Entrega */}
            {checklistUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  Checklist de Entrega
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={checklistUrl} alt="Delivery Checklist" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Step 8: Portada de Proyecto */}
            {coverUrl && (
              <div className="w-full max-w-4xl mb-10">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Portada de Proyecto
                </h2>
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-lg">
                  <img src={coverUrl} alt="Project Cover" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Management Complete Message */}
            {managementComplete && (
              <div className="w-full max-w-4xl mb-10 p-6 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">¡Anteproyecto Completo!</h2>
                </div>
                <p className="text-muted-foreground">
                  Tu anteproyecto de gestión ha sido generado. Los 8 documentos están listos para descargar.
                </p>
              </div>
            )}
          </>
        )}

        {/* No image message - now shows upload prompt */}
        {!designImageUrl && !isRunning && (
          <div className="text-center text-muted-foreground mt-8 p-6 rounded-lg bg-secondary/50">
            <p className="mb-3">Click the upload icon above to start with your own image</p>
            <p className="text-sm mb-4">Or go to <Link to="/shazam" className="text-primary hover:underline">Shazam</Link> to generate a design first.</p>
            <Button 
              variant="kyle" 
              onClick={() => setUploadDialogOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Your Design
            </Button>
          </div>
        )}
      </main>

      {/* Image Upload Dialog */}
      <ImageUploadDialog 
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onImageSelected={handleImageSelected}
      />
    </div>
  );
}
