import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomSkill } from "@/hooks/useCustomSkills";

export default function CustomSkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const [skill, setSkill] = useState<CustomSkill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!skillId) return;
    (async () => {
      const { data, error } = await supabase
        .from("kyle_custom_skills" as any)
        .select("*")
        .eq("id", skillId)
        .single();
      if (!error && data) setSkill(data as unknown as CustomSkill);
      setLoading(false);
    })();
  }, [skillId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Skill not found</p>
        <Button asChild variant="outline">
          <Link to="/skill-builder"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/skill-builder"><ArrowLeft className="w-4 h-4 mr-2" /> Skill Builder</Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{skill.icon}</span>
          <h1 className="font-semibold text-foreground">{skill.name}</h1>
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">{skill.description}</p>
      </div>

      {/* Content */}
      <div className="flex-1">
        {skill.status === "building" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Kyle is building this skill...</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              This may take a few minutes. The page will update when it's ready.
            </p>
          </div>
        )}

        {skill.status === "failed" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <p className="text-lg text-destructive">Build failed</p>
            <p className="text-sm text-muted-foreground">Something went wrong while creating this skill.</p>
          </div>
        )}

        {skill.status === "ready" && skill.result_url && (
          <iframe
            src={skill.result_url}
            className="w-full h-[calc(100vh-60px)] border-0"
            title={skill.name}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}

        {skill.status === "ready" && skill.result_html && !skill.result_url && (
          <div
            className="p-6 max-w-4xl mx-auto prose prose-sm"
            dangerouslySetInnerHTML={{ __html: skill.result_html }}
          />
        )}

        {skill.status === "ready" && !skill.result_url && !skill.result_html && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <p className="text-muted-foreground">Skill is ready but no content available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
