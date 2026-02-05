import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Image,
  Video,
  FileText,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Wand2,
  ArrowLeft,
  Volume2,
  VolumeX,
  ChefHat,
  Bath,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Platform = "instagram" | "facebook" | "linkedin" | "twitter" | "youtube" | "tiktok";
type DesignType = "kitchen" | "bathroom";

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: React.ElementType;
  color: string;
  imageFormat: string;
  videoDimensions: string;
}

interface QuickTemplate {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

const platforms: PlatformConfig[] = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-purple-500 to-pink-500", imageFormat: "1080x1080", videoDimensions: "1080x1920" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-600", imageFormat: "1200x630", videoDimensions: "1280x720" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-700", imageFormat: "1200x627", videoDimensions: "1920x1080" },
  { id: "twitter", name: "X", icon: Twitter, color: "bg-black", imageFormat: "1600x900", videoDimensions: "1280x720" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "bg-red-600", imageFormat: "1280x720", videoDimensions: "1920x1080" },
  { id: "tiktok", name: "TikTok", icon: Video, color: "bg-black", imageFormat: "1080x1920", videoDimensions: "1080x1920" },
];

const quickTemplates: QuickTemplate[] = [
  { id: "project", title: "Project Post", desc: "Showcase your latest work", icon: Image },
  { id: "promo", title: "Promo Story", desc: "Promote your services", icon: Sparkles },
  { id: "before-after", title: "Before/After", desc: "Impactful transformations", icon: Wand2 },
  { id: "testimonial", title: "Testimonial", desc: "Happy clients", icon: FileText },
];

interface GeneratedContent {
  imageUrl: string;
  caption: string;
}

export default function Marketing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [designType, setDesignType] = useState<DesignType>("kitchen");
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<Platform, GeneratedContent>>({} as Record<Platform, GeneratedContent>);
  
  // Video options
  const [generateVideo, setGenerateVideo] = useState(false);
  const [withVoice, setWithVoice] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    const template = quickTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPrompt(template.desc);
    }
  };

  const generateCaptionForPlatform = (platform: Platform, topic: string, type: DesignType): string => {
    const designName = type === "kitchen" ? "kitchen" : "bathroom";
    const templates: Record<Platform, string> = {
      instagram: `✨ ${topic}\n\n🔥 Discover our latest ${designName} transformation!\n\n💡 Every detail crafted with passion and precision.\n\n👉 Ready for your dream ${designName}?\n\n#InteriorDesign #${type === "kitchen" ? "KitchenDesign" : "BathroomDesign"} #LuxuryInteriors #HomeRenovation #DesignInspiration`,
      facebook: `🏠 ${topic}\n\nOur latest ${designName} project combines functionality and stunning aesthetics.\n\n✅ Custom design\n✅ Premium materials\n✅ Expert craftsmanship\n\n📩 Contact us for a free consultation!`,
      linkedin: `🎯 ${topic}\n\nExceptional ${designName} design is about understanding how people live and work.\n\nIn this project we focused on:\n• Optimal workflow\n• Quality materials\n• Timeless aesthetics\n\n#InteriorDesign #${type === "kitchen" ? "KitchenDesign" : "BathroomDesign"} #PremiumDesign`,
      twitter: `${topic} 🏠✨\n\nAnother stunning ${designName} transformation complete!\n\nYour dream space awaits 👇`,
      youtube: `${topic} | Complete ${type === "kitchen" ? "Kitchen" : "Bathroom"} Design Tour\n\nWatch the full transformation of this incredible ${designName}. From concept to completion!\n\n🕐 Timestamps:\n00:00 - Overview\n01:30 - Design Concept\n05:00 - Materials & Finishes\n10:00 - Final Reveal`,
      tiktok: `${topic} ✨🏠\n\nPOV: Your ${designName} goes from boring to STUNNING 🤯\n\n#InteriorDesign #HomeTransformation #DesignTok #${type === "kitchen" ? "KitchenDesign" : "BathroomDesign"}`,
    };
    return templates[platform];
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a description", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent({} as Record<Platform, GeneratedContent>);

    try {
      // Generate one base image
      const edgeFunctionName = designType === "kitchen" ? "generate-random-kitchen" : "generate-random-bathroom";
      
      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          customPrompt: `Professional marketing photo for social media: ${prompt}. Style: ${designType === "kitchen" ? "modern luxury kitchen" : "spa-like luxury bathroom"}. Ultra high quality, photorealistic, professionally lit, magazine-worthy interior design photography.`,
        },
      });

      if (error) throw error;

      const baseImageUrl = data.imageUrl;

      // Generate captions for all platforms using the same image
      const content: Record<Platform, GeneratedContent> = {} as Record<Platform, GeneratedContent>;
      platforms.forEach(platform => {
        content[platform.id] = {
          imageUrl: baseImageUrl,
          caption: generateCaptionForPlatform(platform.id, prompt, designType),
        };
      });

      setGeneratedContent(content);
      toast({ title: "Content generated!", description: "Posts ready for all platforms" });

      // Generate video if enabled
      if (generateVideo) {
        await handleGenerateVideo(baseImageUrl);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast({ title: "Error", description: "Failed to generate content", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async (imageUrl: string) => {
    setIsGeneratingVideo(true);
    try {
      // Video generation would go here
      // For now, we'll simulate with a placeholder
      toast({ title: "Video generation", description: withVoice ? "Generating video with voice..." : "Generating silent video..." });
      
      // Simulate video generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedVideoUrl(imageUrl); // Placeholder
      
      toast({ title: "Video ready!", description: "Your video has been generated" });
    } catch (error) {
      console.error("Error generating video:", error);
      toast({ title: "Error", description: "Failed to generate video", variant: "destructive" });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Caption copied to clipboard" });
  };

  const handleDownload = (url: string, platform: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${designType}-${platform}-${Date.now()}.jpg`;
    link.click();
  };

  const hasContent = Object.keys(generatedContent).length > 0;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Marketing Content Studio</h1>
              <p className="text-xs text-muted-foreground">Generate posts for all platforms at once</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-3 overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-3 h-full">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 flex flex-col gap-3 overflow-auto">
            {/* Design Type Toggle */}
            <Card className="shrink-0">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm">Design Type</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex items-center justify-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${designType === "kitchen" ? "bg-primary/10" : ""}`}>
                    <ChefHat className={`h-4 w-4 ${designType === "kitchen" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${designType === "kitchen" ? "text-primary" : "text-muted-foreground"}`}>Kitchens</span>
                  </div>
                  <Switch
                    checked={designType === "bathroom"}
                    onCheckedChange={(checked) => setDesignType(checked ? "bathroom" : "kitchen")}
                  />
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${designType === "bathroom" ? "bg-primary/10" : ""}`}>
                    <Bath className={`h-4 w-4 ${designType === "bathroom" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${designType === "bathroom" ? "text-primary" : "text-muted-foreground"}`}>Bathrooms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card className="shrink-0">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {quickTemplates.map((template) => (
                    <button
                      key={template.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left ${
                        selectedTemplate === template.id
                          ? "border-red-500 bg-red-500/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className={`p-1.5 rounded shrink-0 ${selectedTemplate === template.id ? "bg-red-500/20" : "bg-primary/10"}`}>
                        <template.icon className={`h-3 w-3 ${selectedTemplate === template.id ? "text-red-500" : "text-primary"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{template.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{template.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description Input */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-2 px-4 shrink-0">
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 flex flex-col gap-3 flex-1">
                <Textarea
                  placeholder="Describe your post idea... e.g. 'Launch of new minimalist kitchen collection'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 min-h-[60px] text-sm resize-none"
                />
                
                {/* Video Options */}
                <div className="space-y-2 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generate-video" className="text-xs font-medium">Generate Video</Label>
                    <Switch
                      id="generate-video"
                      checked={generateVideo}
                      onCheckedChange={setGenerateVideo}
                    />
                  </div>
                  
                  {generateVideo && (
                    <div className="flex items-center justify-between pl-4 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-2">
                        {withVoice ? <Volume2 className="h-3 w-3 text-muted-foreground" /> : <VolumeX className="h-3 w-3 text-muted-foreground" />}
                        <Label htmlFor="with-voice" className="text-xs text-muted-foreground">
                          {withVoice ? "With Voice" : "No Voice"}
                        </Label>
                      </div>
                      <Switch
                        id="with-voice"
                        checked={withVoice}
                        onCheckedChange={setWithVoice}
                      />
                    </div>
                  )}
                </div>

                <Button
                  className="w-full shrink-0"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate All Posts
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Generated Content */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="py-2 px-4 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Generated Content</CardTitle>
                  {hasContent && (
                    <Badge variant="secondary" className="text-xs">
                      {platforms.length} platforms
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-3 overflow-auto">
                {hasContent ? (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {platforms.map((platform) => {
                      const content = generatedContent[platform.id];
                      if (!content) return null;
                      const Icon = platform.icon;
                      
                      return (
                        <div key={platform.id} className="border rounded-lg overflow-hidden bg-card">
                          {/* Platform Header */}
                          <div className={`flex items-center gap-2 px-3 py-1.5 ${platform.color} text-white`}>
                            <Icon className="h-3 w-3" />
                            <span className="text-xs font-medium">{platform.name}</span>
                            <span className="text-[10px] opacity-75 ml-auto">{platform.imageFormat}</span>
                          </div>
                          
                          {/* Image */}
                          <div className="relative aspect-square">
                            <img
                              src={content.imageUrl}
                              alt={`${platform.name} post`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              size="icon"
                              variant="secondary"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => handleDownload(content.imageUrl, platform.id)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Caption */}
                          <div className="p-2 space-y-2">
                            <p className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed">
                              {content.caption}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-6 text-[10px]"
                              onClick={() => handleCopy(content.caption)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Caption
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Video Card */}
                    {generateVideo && (
                      <div className="border rounded-lg overflow-hidden bg-card">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                          <Video className="h-3 w-3" />
                          <span className="text-xs font-medium">Video</span>
                          <span className="text-[10px] opacity-75 ml-auto">
                            {withVoice ? "With Voice" : "Silent"}
                          </span>
                        </div>
                        <div className="aspect-square flex items-center justify-center bg-muted">
                          {isGeneratingVideo ? (
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                              <p className="text-xs text-muted-foreground">Generating video...</p>
                            </div>
                          ) : generatedVideoUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={generatedVideoUrl}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                  <Video className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <Video className="h-8 w-8 mx-auto mb-2 opacity-20" />
                              <p className="text-xs">Video will appear here</p>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <Badge variant="outline" className="text-[10px]">
                            {withVoice ? "🔊 Voice narration" : "🔇 Music only"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No content yet</p>
                      <p className="text-xs mt-1">Select a template or write a description to generate posts</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
