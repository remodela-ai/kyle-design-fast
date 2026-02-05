 import { useState, useCallback, useEffect } from "react";
 import { RefreshCw, Mic, MicOff, CheckCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { ImageCarousel } from "@/components/ImageCarousel";
 import { InsightsEditor } from "@/components/InsightsEditor";
 import { KyleAvatar } from "@/components/KyleAvatar";
 import { AudioWaves } from "@/components/AudioWaves";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { useKyle } from "@/contexts/KyleContext";
 import { useNavigate } from "react-router-dom";
   import { useDesignerProfile } from "@/hooks/useDesignerProfile";
 
 interface ImageItem {
   url: string;
   label: string;
   iteration: number;
  prompt?: string;
 }
 
 interface DesignReviewPanelProps {
   initialImageUrl: string;
   extractedInsights: string;
   transcript: string;
   referenceImage?: string;
   onClose: () => void;
   sessionId?: string | null;
   onSessionUpdate?: (imageUrl: string, summary: string) => void;
 }
 
 export function DesignReviewPanel({
   initialImageUrl,
   extractedInsights,
   transcript,
   referenceImage,
   onClose,
   sessionId,
   onSessionUpdate,
 }: DesignReviewPanelProps) {
   const navigate = useNavigate();
     const { profile } = useDesignerProfile();
   const {
     isIterationConnected,
     isIterationSpeaking,
     iterationMessages,
     startIterationConversation,
     stopIterationConversation,
     setIterationCallback,
     getIterationFeedback,
   } = useKyle();
 
   const [images, setImages] = useState<ImageItem[]>([
    { url: initialImageUrl, label: "Original", iteration: 0, prompt: extractedInsights },
   ]);
   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
   const [currentInsights, setCurrentInsights] = useState(extractedInsights);
   const [isRegenerating, setIsRegenerating] = useState(false);
   const [useImageAsReference, setUseImageAsReference] = useState(true);
 
    // Get the current selected image URL for reference
    // IMPORTANT: always fall back to a valid image URL so we actually send a reference image to the backend.
    const currentReferenceImage = useImageAsReference
      ? (images[selectedImageIndex]?.url ?? referenceImage ?? initialImageUrl)
      : referenceImage;
 
   // Handle regeneration
   const handleRegenerate = useCallback(async (additionalFeedback?: string) => {
     setIsRegenerating(true);
     
     try {
       let refinedPrompt = currentInsights;
       if (additionalFeedback) {
         refinedPrompt = `${currentInsights}\n\nRefinement request: ${additionalFeedback}`;
       }
       
       // Add consistency instruction
       const consistencyPrompt = `${refinedPrompt}\n\nIMPORTANT: Maintain the same camera angle, room layout, architectural elements, and overall composition as the original design. Only modify the specific elements mentioned in the refinement request.`;
       
        const referenceToSend = currentReferenceImage ?? undefined;
        console.info("[DesignReviewPanel] blink-design invoke", {
          hasReferenceImage: !!referenceToSend,
          referenceImage: referenceToSend ? `${referenceToSend.slice(0, 60)}...` : null,
        });

        const { data, error } = await supabase.functions.invoke('blink-design', {
          body: { 
            prompt: consistencyPrompt,
            referenceImage: referenceToSend,
          }
        });
 
       if (error) throw error;
 
       if (data?.imageUrl) {
         const newIteration = images.length;
         const newImage: ImageItem = {
           url: data.imageUrl,
           label: `Iteration ${newIteration}`,
          iteration: newIteration,
          prompt: data.optimizedPrompt || refinedPrompt
         };
         
         setImages(prev => [...prev, newImage]);
         setSelectedImageIndex(newIteration);
         
         if (data.optimizedPrompt) {
           setCurrentInsights(data.optimizedPrompt);
         }
         
         // Update session with latest iteration
         if (onSessionUpdate) {
           onSessionUpdate(data.imageUrl, data.optimizedPrompt || refinedPrompt);
         }
           
           // Save iteration to design_generations
           if (sessionId && profile?.id) {
             await supabase.from('design_generations').insert([{
               designer_id: profile.id,
               session_id: sessionId,
               image_url: data.imageUrl,
               prompt: data.optimizedPrompt || refinedPrompt,
               metadata: JSON.parse(JSON.stringify({ 
                 iteration: newIteration, 
                 referenceUsed: !!currentReferenceImage 
               })),
             }]);
           }
 
         toast.success(`Iteration ${newIteration} generated!`);
       }
     } catch (error) {
       console.error('Regeneration error:', error);
       toast.error("Failed to regenerate design");
     } finally {
       setIsRegenerating(false);
     }
   }, [currentInsights, currentReferenceImage, images.length, onSessionUpdate]);
 
   // Handle voice-based iteration
   const handleVoiceIteration = useCallback((feedback: string) => {
     if (feedback.trim()) {
       handleRegenerate(feedback);
     }
   }, [handleRegenerate]);
 
   // Register iteration callback
   useEffect(() => {
     setIterationCallback(handleVoiceIteration);
     return () => setIterationCallback(null);
   }, [handleVoiceIteration, setIterationCallback]);
 
  // Handle prompt change from carousel
  const handlePromptChange = useCallback((index: number, newPrompt: string) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, prompt: newPrompt } : img
    ));
    // If editing the currently selected image, update insights too
    if (index === selectedImageIndex) {
      setCurrentInsights(newPrompt);
    }
  }, [selectedImageIndex]);

  // Sync insights when selecting a different image
  const handleImageSelect = useCallback((index: number) => {
    setSelectedImageIndex(index);
    const selectedImage = images[index];
    if (selectedImage?.prompt) {
      setCurrentInsights(selectedImage.prompt);
    }
  }, [images]);

   // Handle approval - navigate to pipeline
   const handleApprove = () => {
     const selectedImage = images[selectedImageIndex];
     navigate("/360-free-project", {
       state: {
         designImageUrl: selectedImage.url,
         conversationSummary: currentInsights,
         transcript,
         iterationCount: images.length
       }
     });
   };
 
   // Get current feedback from iteration messages
   const currentFeedback = iterationMessages
     .filter(m => m.role === "user")
     .map(m => m.content)
     .join(" ");
 
   return (
     <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
       {/* Header */}
       <div className="flex items-center justify-between mb-4">
         <h2 className="text-lg font-semibold">Refine Your Design</h2>
         <Button variant="ghost" size="sm" onClick={onClose}>
           Back to Chat
         </Button>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Left: Insights + Voice */}
         <div className="space-y-4">
           {/* Insights Editor */}
           <InsightsEditor
             insights={currentInsights}
             onInsightsChange={setCurrentInsights}
             isEditable={!isRegenerating && !isIterationConnected}
           />
 
           {/* Image Reference Toggle */}
           <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
             <div className="flex items-center gap-2">
               <Switch
                 id="use-image-ref"
                 checked={useImageAsReference}
                 onCheckedChange={setUseImageAsReference}
               />
               <Label htmlFor="use-image-ref" className="text-sm font-medium cursor-pointer">
                 Use current image as reference
               </Label>
             </div>
             {useImageAsReference && (
               <span className="text-xs text-muted-foreground">
                 Maintains visual consistency
               </span>
             )}
           </div>
           
           {/* Regenerate Button */}
           <Button
             variant="outline"
             size="lg"
             onClick={() => handleRegenerate()}
             disabled={isRegenerating || isIterationConnected}
             className="w-full gap-2"
           >
             <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
             Regenerate from Insights
           </Button>
 
           {/* Voice Iteration Section */}
           <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card/50">
             <p className="text-sm text-muted-foreground text-center">
               {isIterationConnected 
                 ? "Tell Kyle what to change, say 'generate' when ready" 
                 : "Talk to Kyle to iterate on the design"}
             </p>
             
             <KyleAvatar 
               size="md"
               onClickOverride={isIterationConnected ? stopIterationConversation : startIterationConversation}
               isConnectedOverride={isIterationConnected}
               isSpeakingOverride={isIterationSpeaking}
             />
             
             {isIterationConnected && (
               <AudioWaves 
                 isActive={isIterationConnected} 
                 isSpeaking={isIterationSpeaking} 
                 barCount={5}
                 className="h-5"
               />
             )}
             
             <Button
               variant={isIterationConnected ? "destructive" : "outline"}
               size="sm"
               onClick={isIterationConnected ? stopIterationConversation : startIterationConversation}
               disabled={isRegenerating}
               className="gap-2"
             >
               {isIterationConnected ? (
                 <>
                   <MicOff className="h-4 w-4" />
                   Stop
                 </>
               ) : (
                 <>
                   <Mic className="h-4 w-4" />
                   Voice Feedback
                 </>
               )}
             </Button>
             
             {currentFeedback && (
               <div className="w-full p-2 rounded-lg bg-muted text-xs">
                 <p className="font-medium mb-1">Feedback:</p>
                 <p className="text-muted-foreground">{currentFeedback}</p>
               </div>
             )}
           </div>
         </div>
 
         {/* Right: Image Carousel + Approve */}
         <div className="space-y-4">
           <ImageCarousel
             images={images}
             selectedIndex={selectedImageIndex}
            onSelect={handleImageSelect}
             isLoading={isRegenerating}
            onPromptChange={handlePromptChange}
            isPromptEditable={!isRegenerating && !isIterationConnected}
           />
 
           <Button
             variant="kyle"
             size="lg"
             onClick={handleApprove}
             disabled={isRegenerating || isIterationConnected}
             className="w-full gap-2"
           >
             <CheckCircle className="h-5 w-5" />
             Approve & Run Pipeline
           </Button>
           
           <p className="text-xs text-center text-muted-foreground">
             Select your preferred version, then approve to run the 16-step pipeline.
           </p>
         </div>
       </div>
     </div>
   );
 }