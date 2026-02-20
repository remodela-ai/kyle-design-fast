import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, ArrowRight, ArrowLeft, Sparkles, UserCog, BookOpen, ListChecks, Rocket, Check, Upload, FileText, X, Terminal } from "lucide-react";
import { useCustomSkills, GENERATION_PHASES } from "@/hooks/useCustomSkills";
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
  const { skills, loading, createSkill, generationPhase, generationLogs, resetGeneration } = useCustomSkills();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 - Role
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  // Step 2 - Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Terminal auto-scroll
  const terminalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [generationLogs]);

  // Step 3 - Instructions
  const [instructions, setInstructions] = useState("");

  const isGenerating = generationPhase !== "idle" && generationPhase !== "complete" && generationPhase !== "error";

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0 && role.trim().length > 0;
    if (step === 2) return knowledgeBase.trim().length > 0 || uploadedFiles.length > 0;
    if (step === 3) return instructions.trim().length > 0;
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      size: f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    // Add file names to knowledge base context
    const fileNames = newFiles.map(f => f.name).join(", ");
    setKnowledgeBase(prev => prev ? `${prev}\n\n[Uploaded files: ${fileNames}]` : `[Uploaded files: ${fileNames}]`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const buildPrompt = () => {
    return `Create a skill called "${name}".

ROLE: ${role}

KNOWLEDGE BASE:
${knowledgeBase}

INSTRUCTIONS:
${instructions}

IMPORTANT: The output should be a fully functional, self-contained HTML page that can be rendered in an iframe. If a PDF template was provided in the knowledge base, use vision to replicate it as pixel-perfect HTML that produces identical-looking documents every time — like a repeatable template.`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const prompt = buildPrompt();
    const description = role.slice(0, 200);
    await createSkill(prompt, name, description);
    setIsSubmitting(false);
  };

  const handleNewSkill = () => {
    resetGeneration();
    setName("");
    setRole("");
    setKnowledgeBase("");
    setInstructions("");
    setUploadedFiles([]);
    setStep(1);
  };

  // Get current phase index for progress
  const currentPhaseIndex = GENERATION_PHASES.findIndex(p => p.phase === generationPhase);
  const progressPercent = generationPhase === "complete" ? 100 
    : generationPhase === "error" ? 0
    : currentPhaseIndex >= 0 ? ((currentPhaseIndex + 1) / GENERATION_PHASES.length) * 100 
    : 0;

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

        {/* Generation Terminal - shown when generating */}
        {(isGenerating || generationPhase === "complete" || generationPhase === "error") && (
          <Card className="border-2 border-primary/30 overflow-hidden">
            <CardHeader className="bg-muted/50 py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Kyle is building: {name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {generationPhase === "complete" && <Check className="w-4 h-4 text-primary" />}
                  {generationPhase === "error" && <X className="w-4 h-4 text-destructive" />}
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-border rounded-full h-1.5 mt-2">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-700 ease-out",
                    generationPhase === "error" ? "bg-destructive" : "bg-primary"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </CardHeader>

            {/* Phase Steps */}
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                {GENERATION_PHASES.map((p, i) => {
                  const isDone = currentPhaseIndex > i || generationPhase === "complete";
                  const isCurrent = currentPhaseIndex === i && isGenerating;
                  return (
                    <div key={p.phase} className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        isDone ? "bg-primary" : isCurrent ? "bg-primary animate-pulse" : "bg-border"
                      )} />
                      <span className={cn(
                        "text-xs transition-colors",
                        isDone ? "text-primary font-medium" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {p.label}
                      </span>
                      {i < GENERATION_PHASES.length - 1 && <span className="text-border">→</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Terminal Output */}
            <div
              ref={terminalRef}
              className="bg-card p-4 font-mono text-xs max-h-64 overflow-y-auto space-y-0.5"
            >
              <div className="text-muted-foreground mb-2">$ kyle build --skill="{name}"</div>
              {generationLogs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "transition-opacity duration-300",
                    log.startsWith("▸") ? "text-primary font-semibold mt-1" 
                    : log.startsWith("  ✓") ? "text-muted-foreground"
                    : log.startsWith("  →") ? "text-primary"
                    : log.startsWith("✗") ? "text-destructive"
                    : "text-foreground"
                  )}
                >
                  {log}
                </div>
              ))}
              {isGenerating && (
                <div className="text-primary animate-pulse mt-1">█</div>
              )}
            </div>

            {/* Complete actions */}
            {(generationPhase === "complete" || generationPhase === "error") && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {generationPhase === "complete" 
                    ? "Skill created. It will appear in your skills once Kyle finishes processing."
                    : "Something went wrong. Try again."
                  }
                </p>
                <Button variant="outline" size="sm" onClick={handleNewSkill} className="gap-2">
                  <Wand2 className="w-3 h-3" />
                  New Skill
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Stepper - hidden during generation */}
        {generationPhase === "idle" && (
          <>
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Knowledge Base</label>
                      <Textarea
                        placeholder="What information should this skill have access to? Paste text, describe the domain, or upload files below."
                        value={knowledgeBase}
                        onChange={(e) => setKnowledgeBase(e.target.value)}
                        className="min-h-[140px]"
                      />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Upload Documents</label>
                      <p className="text-xs text-muted-foreground">
                        Upload PDFs, proposals, or estimate templates. Kyle will use vision to replicate them as pixel-perfect, repeatable HTML templates.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-dashed gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload PDF, Image, or Document
                      </Button>

                      {/* Uploaded files list */}
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-1.5">
                          {uploadedFiles.map((file, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-sm text-foreground">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{file.size}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Instructions */}
                {step === 3 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Instructions & Behavior</label>
                    <Textarea
                      placeholder="How should this skill behave? e.g. 'Always present comparisons in a table format. Highlight the best value option. Include lead times and warranty information.'"
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
                        {uploadedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {uploadedFiles.map((f, i) => (
                              <Badge key={i} variant="outline" className="gap-1 text-xs">
                                <FileText className="w-3 h-3" /> {f.name}
                              </Badge>
                            ))}
                          </div>
                        )}
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
          </>
        )}

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
