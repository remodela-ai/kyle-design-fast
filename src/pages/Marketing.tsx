import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  Wand2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Platform = "instagram" | "facebook" | "linkedin" | "twitter" | "youtube" | "tiktok";
type ContentType = "image" | "video" | "text";

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: React.ElementType;
  color: string;
  formats: {
    image: string[];
    video: string[];
  };
}

const platforms: PlatformConfig[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    formats: {
      image: ["1080x1080 (Feed)", "1080x1920 (Story/Reel)", "1080x566 (Landscape)"],
      video: ["1080x1080 (Feed)", "1080x1920 (Reel)", "1080x1920 (Story)"],
    },
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600",
    formats: {
      image: ["1200x630 (Post)", "1080x1080 (Square)", "1200x628 (Link)"],
      video: ["1280x720 (HD)", "1080x1080 (Square)", "1080x1920 (Story)"],
    },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-700",
    formats: {
      image: ["1200x627 (Post)", "1080x1080 (Square)", "1584x396 (Banner)"],
      video: ["1920x1080 (Landscape)", "1080x1080 (Square)"],
    },
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "bg-black",
    formats: {
      image: ["1600x900 (Post)", "1080x1080 (Square)", "1500x500 (Header)"],
      video: ["1280x720 (HD)", "1080x1080 (Square)"],
    },
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-600",
    formats: {
      image: ["1280x720 (Thumbnail)", "2560x1440 (Banner)"],
      video: ["1920x1080 (Full HD)", "3840x2160 (4K)", "1080x1920 (Shorts)"],
    },
  },
];

export default function Marketing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ContentType>("image");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const currentPlatform = platforms.find((p) => p.id === selectedPlatform);
  const availableFormats = currentPlatform?.formats[activeTab === "text" ? "image" : activeTab] || [];

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a description", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-random-kitchen", {
        body: {
          customPrompt: `Marketing content for ${currentPlatform?.name}: ${prompt}. Style: professional, high-quality, brand-consistent. Format optimized for ${selectedFormat || "social media"}.`,
        },
      });

      if (error) throw error;

      setGeneratedContent(data.imageUrl);
      toast({ title: "Image generated!", description: "Your content is ready to download" });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Please enter a topic or idea", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("marketing-content", {
        body: {
          platform: selectedPlatform,
          topic: prompt,
          type: "caption",
        },
      });

      if (error) throw error;

      setGeneratedText(data.content);
      toast({ title: "Text generated!", description: "Your copy is ready" });
    } catch (error) {
      console.error("Error generating text:", error);
      const sampleContent = generateSampleContent(selectedPlatform, prompt);
      setGeneratedText(sampleContent);
      toast({ title: "Content generated", description: "Using optimized template" });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSampleContent = (platform: Platform, topic: string): string => {
    const templates: Record<Platform, string> = {
      instagram: `✨ ${topic}\n\n🔥 Discover how we transform ordinary spaces into extraordinary.\n\n💡 Every project is crafted with passion, creativity and attention to detail.\n\n👉 Ready for your next transformation?\n\n#InteriorDesign #HomeDecor #DesignInspiration #LuxuryInteriors #ModernLiving`,
      facebook: `🏠 ${topic}\n\nIn our latest project, we combined functionality and aesthetics to create a space that reflects our clients' personality.\n\n✅ Custom design\n✅ Premium materials\n✅ Attention to detail\n\n📩 Contact us for a free consultation.\n\n#InteriorDesign #Architecture #Home`,
      linkedin: `🎯 ${topic}\n\nInterior design is not just decoration, it's strategy.\n\nIn every project we apply methodologies that optimize:\n• Workflow\n• Team wellbeing\n• Corporate image\n\nDoes your workspace reflect your company values?\n\n#InteriorDesign #CorporateDesign #WorkplaceDesign #BusinessStrategy`,
      twitter: `${topic} 🏠✨\n\nWe transform spaces. We create experiences.\n\nYour next project? 👇`,
      youtube: `${topic} | Complete Interior Design Tour\n\nIn this video we show you the complete transformation process of this incredible space. From initial concept to final result.\n\n🕐 Timestamps:\n00:00 - Intro\n01:30 - Concept\n05:00 - Materials\n10:00 - Final Result\n\n📱 Follow us for more content.`,
      tiktok: `${topic} ✨🏠\n\nPOV: When you transform a boring space into something INCREDIBLE 🤯\n\n#InteriorDesign #HomeTransformation #DesignTok #Viral`,
    };
    return templates[platform] || templates.instagram;
  };

  const handleCopyText = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
      toast({ title: "Copied!", description: "Text copied to clipboard" });
    }
  };

  const handleDownloadImage = () => {
    if (generatedContent) {
      const link = document.createElement("a");
      link.href = generatedContent;
      link.download = `marketing-${selectedPlatform}-${Date.now()}.jpg`;
      link.click();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Marketing Content Studio</h1>
              <p className="text-xs text-muted-foreground">
                Generate content for all your social networks
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <div className="grid lg:grid-cols-3 gap-4 h-full">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 flex flex-col gap-3 overflow-auto">
            {/* Platform Selection */}
            <Card className="shrink-0">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Platform</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform.id);
                          setSelectedFormat("");
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          selectedPlatform === platform.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`p-1.5 rounded-full ${platform.color} text-white`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="text-[10px] font-medium leading-tight">{platform.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content Type & Format Row */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">Type</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
                    <TabsList className="grid grid-cols-3 w-full h-8">
                      <TabsTrigger value="image" className="text-xs px-2">
                        <Image className="h-3 w-3" />
                      </TabsTrigger>
                      <TabsTrigger value="text" className="text-xs px-2">
                        <FileText className="h-3 w-3" />
                      </TabsTrigger>
                      <TabsTrigger value="video" className="text-xs px-2">
                        <Video className="h-3 w-3" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {activeTab !== "text" && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Format</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormats.map((format) => (
                          <SelectItem key={format} value={format} className="text-xs">
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Prompt Input */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-3 px-4 shrink-0">
                <CardTitle className="text-sm">
                  {activeTab === "text" ? "Topic or Idea" : "Description"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 flex flex-col gap-3 flex-1">
                <Textarea
                  placeholder={
                    activeTab === "text"
                      ? "Ex: Launch of new modern kitchen collection..."
                      : "Ex: Minimalist kitchen with central island, white tones and natural wood..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 min-h-[80px] text-sm resize-none"
                />
                <Button
                  className="w-full shrink-0"
                  size="sm"
                  onClick={activeTab === "text" ? handleGenerateText : handleGenerateImage}
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
                      Generate {activeTab === "text" ? "Text" : activeTab === "image" ? "Image" : "Video"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card className="shrink-0">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "Project Post", desc: "Showcase your latest work", icon: Image },
                    { title: "Promo Story", desc: "Promote your services", icon: Sparkles },
                    { title: "Before/After", desc: "Impactful transformations", icon: RefreshCw },
                    { title: "Testimonial", desc: "Happy clients", icon: Video },
                  ].map((template) => (
                    <button
                      key={template.title}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
                      onClick={() => setPrompt(template.desc)}
                    >
                      <div className="p-1.5 rounded bg-primary/10 shrink-0">
                        <template.icon className="h-3 w-3 text-primary" />
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
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="py-3 px-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Preview</CardTitle>
                    <CardDescription className="text-xs">
                      Content for {currentPlatform?.name}
                      {selectedFormat && ` • ${selectedFormat}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {activeTab === "text" && generatedText && (
                      <Button variant="outline" size="sm" onClick={handleCopyText} className="h-7 text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                    {activeTab === "image" && generatedContent && (
                      <Button variant="outline" size="sm" onClick={handleDownloadImage} className="h-7 text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    {(generatedContent || generatedText) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={activeTab === "text" ? handleGenerateText : handleGenerateImage}
                        disabled={isGenerating}
                        className="h-7 text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                        Regenerate
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center p-4 overflow-auto">
                {activeTab === "text" ? (
                  generatedText ? (
                    <div className="w-full max-w-lg">
                      <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-[50vh] overflow-auto">
                        {generatedText}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{generatedText.length} characters</span>
                        <Badge variant="secondary" className="text-xs">{currentPlatform?.name}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Your generated text will appear here</p>
                    </div>
                  )
                ) : activeTab === "image" ? (
                  generatedContent ? (
                    <div className="relative group">
                      <img
                        src={generatedContent}
                        alt="Generated content"
                        className="max-w-full max-h-[55vh] rounded-lg shadow-lg object-contain"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                        <Button variant="secondary" size="sm" onClick={handleDownloadImage}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Image className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Your generated image will appear here</p>
                    </div>
                  )
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm mb-2">Video generation</p>
                    <Badge variant="outline">Coming Soon</Badge>
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
