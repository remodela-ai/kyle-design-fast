import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, ArrowRight, ArrowLeft, Sparkles, UserCog, BookOpen, ListChecks, Rocket, Check } from "lucide-react";
import { useCustomSkills } from "@/hooks/useCustomSkills";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  building: "bg-primary/10 text-primary border-primary/30",
  ready: "bg-primary/20 text-primary border-primary/40",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const STEPS = [
  { id: 1, label: "Define Role", icon: UserCog, description: "What role does this skill play?" },
  { id: 2, label: "Knowledge Base", icon: BookOpen, description: "What should it know?" },
  { id: 3, label: "Instructions", icon: ListChecks, description: "How should it behave?" },
  { id: 4, label: "Generate", icon: Rocket, description: "Review & build" },
];

export default function SkillBuilder() {
  const navigate = useNavigate();
  const { skills, loading, createSkill } = useCustomSkills();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Role
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  // Step 2 - Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState("");

  // Step 3 - Instructions
  const [instructions, setInstructions] = useState("");

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0 && role.trim().length > 0;
    if (step === 2) return knowledgeBase.trim().length > 0;
    if (step === 3) return instructions.trim().length > 0;
    return true;
  };

  const buildPrompt = () => {
    return `Create a skill called "${name}".

ROLE: ${role}

KNOWLEDGE BASE:
${knowledgeBase}

INSTRUCTIONS:
${instructions}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const prompt = buildPrompt();
    const description = role.slice(0, 200);
    await createSkill(prompt, name, description);
    setName("");
    setRole("");
    setKnowledgeBase("");
    setInstructions("");
    setStep(1);
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

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  step === s.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : step > s.id
                    ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "w-6 h-0.5 rounded",
                  step > s.id ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = STEPS[step - 1].icon;
                return <StepIcon className="w-5 h-5 text-primary" />;
              })()}
              {STEPS[step - 1].label}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{STEPS[step - 1].description}</p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Step 1: Define Role */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Skill Name</label>
                  <Input
                    placeholder="e.g. Supplier Comparator, Budget Analyzer..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Role Description</label>
                  <Textarea
                    placeholder="Describe the role this skill plays... e.g. 'Acts as a procurement specialist that helps compare suppliers and negotiate prices for interior design materials.'"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </>
            )}

            {/* Step 2: Knowledge Base */}
            {step === 2 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Knowledge Base</label>
                <Textarea
                  placeholder="What information should this skill have access to? e.g. 'It should know about kitchen cabinet brands (IKEA, Kraftmaid, Merillat), countertop materials (quartz, granite, marble), and typical price ranges for each category.'"
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  className="min-h-[180px]"
                />
                <p className="text-xs text-muted-foreground">
                  Paste documents, URLs, or describe the domain knowledge this skill needs.
                </p>
              </div>
            )}

            {/* Step 3: Instructions */}
            {step === 3 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Instructions & Behavior</label>
                <Textarea
                  placeholder="How should this skill behave? e.g. 'Always present comparisons in a table format. Highlight the best value option. Include lead times and warranty information. Ask clarifying questions if the budget range is not clear.'"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="min-h-[180px]"
                />
                <p className="text-xs text-muted-foreground">
                  Define the behavior, output format, and any rules the skill should follow.
                </p>
              </div>
            )}

            {/* Step 4: Review & Generate */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Name</span>
                    <p className="text-sm text-foreground">{name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Role</span>
                    <p className="text-sm text-foreground">{role}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Knowledge Base</span>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{knowledgeBase}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Instructions</span>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{instructions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Skill
                    </>
                  )}
                </Button>
              )}
            </div>
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
