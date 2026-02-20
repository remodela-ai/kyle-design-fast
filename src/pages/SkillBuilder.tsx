import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, ArrowRight, Sparkles } from "lucide-react";
import { useCustomSkills } from "@/hooks/useCustomSkills";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  building: "bg-amber-500/20 text-amber-700 border-amber-300",
  ready: "bg-emerald-500/20 text-emerald-700 border-emerald-300",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function SkillBuilder() {
  const navigate = useNavigate();
  const { skills, loading, createSkill } = useCustomSkills();
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || !name.trim()) return;
    setIsSubmitting(true);
    await createSkill(prompt, name, description || name);
    setPrompt("");
    setName("");
    setDescription("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Vibe Coding
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Skill Builder
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Describe it. Kyle builds it.
          </p>
        </div>

        {/* Builder Form */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              New Skill
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Skill name (e.g. Supplier Comparator)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Textarea
              placeholder="Describe the functionality you imagine... e.g. 'I want a tool that compares supplier prices for kitchen materials, shows a table with brands, prices, and lead times, and highlights the best option.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px]"
            />
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || !name.trim() || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending to Kyle...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Build Skill
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Skills Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Your Custom Skills</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : skills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No custom skills yet. Create your first one above!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <Card
                  key={skill.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all",
                    skill.status === "ready" && "hover:border-primary/50"
                  )}
                  onClick={() => skill.status === "ready" && navigate(`/skills/${skill.id}`)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{skill.icon}</span>
                        <span className="font-medium text-foreground">{skill.name}</span>
                      </div>
                      <Badge variant="outline" className={statusColors[skill.status] || ""}>
                        {skill.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {skill.description}
                    </p>
                    {skill.status === "ready" && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        Open <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                    {skill.status === "building" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Kyle is building...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
