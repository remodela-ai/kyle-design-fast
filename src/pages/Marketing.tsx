import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      toast({ title: "Error", description: "Por favor ingresa una descripción", variant: "destructive" });
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
      toast({ title: "¡Imagen generada!", description: "Tu contenido está listo para descargar" });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({ title: "Error", description: "No se pudo generar la imagen", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      toast({ title: "Error", description: "Por favor ingresa un tema o idea", variant: "destructive" });
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
      toast({ title: "¡Texto generado!", description: "Tu copy está listo" });
    } catch (error) {
      console.error("Error generating text:", error);
      // Fallback con contenido de ejemplo
      const sampleContent = generateSampleContent(selectedPlatform, prompt);
      setGeneratedText(sampleContent);
      toast({ title: "Contenido generado", description: "Usando plantilla optimizada" });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSampleContent = (platform: Platform, topic: string): string => {
    const templates: Record<Platform, string> = {
      instagram: `✨ ${topic}\n\n🔥 Descubre cómo transformamos espacios ordinarios en extraordinarios.\n\n💡 En cada proyecto ponemos pasión, creatividad y atención al detalle.\n\n👉 ¿Listo para tu próxima transformación?\n\n#InteriorDesign #HomeDecor #DesignInspiration #LuxuryInteriors #ModernLiving`,
      facebook: `🏠 ${topic}\n\nEn nuestro último proyecto, combinamos funcionalidad y estética para crear un espacio que refleja la personalidad de nuestros clientes.\n\n✅ Diseño personalizado\n✅ Materiales de primera calidad\n✅ Atención al detalle\n\n📩 Contáctanos para una consulta gratuita.\n\n#DiseñoInterior #Arquitectura #Hogar`,
      linkedin: `🎯 ${topic}\n\nEl diseño de interiores no es solo decoración, es estrategia.\n\nEn cada proyecto aplicamos metodologías que optimizan:\n• Flujo de trabajo\n• Bienestar del equipo\n• Imagen corporativa\n\n¿Tu espacio de trabajo refleja los valores de tu empresa?\n\n#InteriorDesign #CorporateDesign #WorkplaceDesign #BusinessStrategy`,
      twitter: `${topic} 🏠✨\n\nTransformamos espacios. Creamos experiencias.\n\n¿Tu próximo proyecto? 👇`,
      youtube: `${topic} | Tour Completo de Diseño Interior\n\nEn este video te mostramos el proceso completo de transformación de este increíble espacio. Desde el concepto inicial hasta el resultado final.\n\n🕐 Timestamps:\n00:00 - Intro\n01:30 - Concepto\n05:00 - Materiales\n10:00 - Resultado Final\n\n📱 Síguenos en redes para más contenido.`,
      tiktok: `${topic} ✨🏠\n\nPOV: Cuando transformas un espacio aburrido en algo INCREÍBLE 🤯\n\n#InteriorDesign #HomeTransformation #DesignTok #Viral`,
    };
    return templates[platform] || templates.instagram;
  };

  const handleCopyText = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
      toast({ title: "¡Copiado!", description: "Texto copiado al portapapeles" });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Marketing Content Studio</h1>
              <p className="text-sm text-muted-foreground">
                Genera contenido para todas tus redes sociales
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plataforma</CardTitle>
                <CardDescription>Selecciona la red social</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform.id);
                          setSelectedFormat("");
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          selectedPlatform === platform.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`p-2 rounded-full ${platform.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium">{platform.name}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipo de Contenido</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Imagen
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Texto
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Format Selection */}
            {activeTab !== "text" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Formato</CardTitle>
                  <CardDescription>Dimensiones optimizadas para {currentPlatform?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Prompt Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {activeTab === "text" ? "Tema o Idea" : "Descripción"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "text"
                    ? "Describe el tema para generar el copy"
                    : "Describe lo que quieres generar"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={
                    activeTab === "text"
                      ? "Ej: Lanzamiento de nueva colección de cocinas modernas..."
                      : "Ej: Cocina minimalista con isla central, tonos blancos y madera natural..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
                <Button
                  className="w-full"
                  onClick={activeTab === "text" ? handleGenerateText : handleGenerateImage}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generar {activeTab === "text" ? "Texto" : activeTab === "image" ? "Imagen" : "Video"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vista Previa</CardTitle>
                    <CardDescription>
                      Contenido para {currentPlatform?.name}
                      {selectedFormat && ` • ${selectedFormat}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {activeTab === "text" && generatedText && (
                      <Button variant="outline" size="sm" onClick={handleCopyText}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    )}
                    {activeTab === "image" && generatedContent && (
                      <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    )}
                    {(generatedContent || generatedText) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={activeTab === "text" ? handleGenerateText : handleGenerateImage}
                        disabled={isGenerating}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                        Regenerar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === "text" ? (
                  <div className="min-h-[400px] flex items-center justify-center">
                    {generatedText ? (
                      <div className="w-full max-w-lg">
                        <div className="bg-muted rounded-lg p-6 whitespace-pre-wrap text-sm">
                          {generatedText}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{generatedText.length} caracteres</span>
                          <Badge variant="secondary">{currentPlatform?.name}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>Tu texto generado aparecerá aquí</p>
                      </div>
                    )}
                  </div>
                ) : activeTab === "image" ? (
                  <div className="min-h-[400px] flex items-center justify-center">
                    {generatedContent ? (
                      <div className="relative group">
                        <img
                          src={generatedContent}
                          alt="Generated content"
                          className="max-w-full max-h-[500px] rounded-lg shadow-lg object-contain"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                          <Button variant="secondary" size="sm" onClick={handleDownloadImage}>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Image className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>Tu imagen generada aparecerá aquí</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="mb-2">Generación de video</p>
                      <Badge variant="outline">Próximamente</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Templates Section */}
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6">Plantillas Rápidas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Post de Proyecto", desc: "Muestra tu último trabajo", icon: Image },
              { title: "Story Promocional", desc: "Promociona tus servicios", icon: Sparkles },
              { title: "Carrusel Before/After", desc: "Transformaciones impactantes", icon: RefreshCw },
              { title: "Video Testimonio", desc: "Clientes satisfechos", icon: Video },
            ].map((template) => (
              <Card
                key={template.title}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setPrompt(template.desc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <template.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{template.title}</h3>
                      <p className="text-xs text-muted-foreground">{template.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
