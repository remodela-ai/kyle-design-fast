import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Wand2, ArrowRight, ArrowLeft, Sparkles, UserCog, BookOpen, ListChecks, Rocket, Check, Upload, FileText, X, Terminal, Code2, PartyPopper, AlertTriangle, RefreshCw, Pencil, SkipForward } from "lucide-react";
import { useCustomSkills, GENERATION_PHASES } from "@/hooks/useCustomSkills";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const { skills, loading, createSkill, generationPhase, generationLogs, codeLines, resetGeneration } = useCustomSkills();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1 - Role
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  // Step 2 - Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; url?: string; uploading?: boolean; error?: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Terminal & code editor auto-scroll
  const terminalRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [generationLogs, codeLines]);

  // Step 3 - Instructions
  const [instructions, setInstructions] = useState("");

  const isGenerating = generationPhase !== "idle" && generationPhase !== "complete" && generationPhase !== "error";

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0 && role.trim().length > 0;
    if (step === 2) return knowledgeBase.trim().length > 0 || uploadedFiles.length > 0;
    if (step === 3) return instructions.trim().length > 0;
    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const fileEntry = {
        name: file.name,
        size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploading: true,
        error: false,
        url: undefined as string | undefined,
      };

      setUploadedFiles(prev => [...prev, fileEntry]);
      const fileIndex = uploadedFiles.length;

      try {
        const filePath = `skills/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('skill-files')
          .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('skill-files')
          .getPublicUrl(data.path);

        const publicUrl = urlData.publicUrl;

        setUploadedFiles(prev =>
          prev.map((f, i) => i === fileIndex ? { ...f, uploading: false, url: publicUrl } : f)
        );

        // Append file URL to knowledge base
        setKnowledgeBase(prev =>
          prev ? `${prev}\n\n[Uploaded file: ${file.name} - URL: ${publicUrl}]` : `[Uploaded file: ${file.name} - URL: ${publicUrl}]`
        );

        toast({ title: "File uploaded", description: `${file.name} uploaded successfully.` });
      } catch (err) {
        console.error("File upload error:", err);
        setUploadedFiles(prev =>
          prev.map((f, i) => i === fileIndex ? { ...f, uploading: false, error: true } : f)
        );
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: `Could not upload ${file.name}. You can continue without it or try again.`,
        });
      }
    }
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
    setShowErrorDialog(false);
    const prompt = buildPrompt();
    const description = role.slice(0, 200);
    const result = await createSkill(prompt, name, description);
    setIsSubmitting(false);
    // If creation failed, show recovery dialog
    if (!result) {
      setErrorMessage("Kyle couldn't complete the skill generation. This can happen due to a temporary issue.");
      setShowErrorDialog(true);
    }
  };

  const handleRetry = () => {
    setShowErrorDialog(false);
    resetGeneration();
    handleSubmit();
  };

  const handleEditAndRetry = () => {
    setShowErrorDialog(false);
    resetGeneration();
    setStep(4); // Go back to review step
  };

  const handleContinueWithout = () => {
    setShowErrorDialog(false);
    resetGeneration();
    handleNewSkill();
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
          <div className="space-y-4">
            {/* Hero message */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold animate-pulse">
                <Code2 className="w-4 h-4" />
                Kyle is writing his own code for this new skill
              </div>
              {generationPhase === "complete" && (
                <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg animate-in fade-in">
                  <PartyPopper className="w-5 h-5" />
                  Congrats! You are becoming a vibe interior designer!
                  <PartyPopper className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Manus-style code editor */}
            <Card className="border-2 border-primary/30 overflow-hidden shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
              {/* Title bar - browser-like */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-white/40 ml-2 font-mono">kyle-skill-{name.toLowerCase().replace(/\s+/g, '-')}.html</span>
                </div>
                <div className="flex items-center gap-2">
                  {isGenerating && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  {generationPhase === "complete" && <Check className="w-4 h-4 text-green-400" />}
                  {generationPhase === "error" && <X className="w-4 h-4 text-red-400" />}
                  <span className="text-[10px] text-white/30 font-mono">
                    {codeLines.length} lines
                  </span>
                </div>
              </div>

              {/* Code editor area */}
              <div
                ref={codeRef}
                className="bg-[#1e1e2e] p-0 font-mono text-[13px] leading-6 max-h-[400px] overflow-y-auto"
                style={{ scrollBehavior: 'smooth' }}
              >
                {codeLines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex transition-opacity duration-200",
                      i === codeLines.length - 1 && isGenerating ? "bg-white/[0.03]" : ""
                    )}
                  >
                    {/* Line number */}
                    <span className="inline-block w-12 text-right pr-4 text-white/20 select-none flex-shrink-0">
                      {i + 1}
                    </span>
                    {/* Code content with syntax highlighting */}
                    <span className={cn(
                      "flex-1 pr-4",
                      line.trim().startsWith('//') || line.trim().startsWith('<!--') ? "text-white/30 italic" :
                      line.trim().startsWith('<') ? "text-[#7dd3fc]" :
                      line.trim().startsWith('.') || line.trim().startsWith(':root') || line.includes('{') && !line.includes('(') ? "text-[#c4b5fd]" :
                      line.includes('function') || line.includes('const') || line.includes('async') ? "text-[#fbbf24]" :
                      line.includes(':') && !line.includes('//') && !line.includes('<') ? "text-[#a5f3fc]" :
                      "text-white/80"
                    )}>
                      {line || '\u00A0'}
                    </span>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex">
                    <span className="inline-block w-12 text-right pr-4 text-white/20 select-none">
                      {codeLines.length + 1}
                    </span>
                    <span className="text-primary animate-pulse">█</span>
                  </div>
                )}
              </div>

              {/* Bottom status bar */}
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#1e1e2e] border-t border-white/5">
                <div className="flex items-center gap-3">
                  {GENERATION_PHASES.map((p, i) => {
                    const isDone = currentPhaseIndex > i || generationPhase === "complete";
                    const isCurrent = currentPhaseIndex === i && isGenerating;
                    return (
                      <div key={p.phase} className="flex items-center gap-1">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          isDone ? "bg-green-400" : isCurrent ? "bg-primary animate-pulse" : "bg-white/10"
                        )} />
                        <span className={cn(
                          "text-[10px] font-mono transition-colors",
                          isDone ? "text-green-400/70" : isCurrent ? "text-white/60" : "text-white/20"
                        )}>
                          {p.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-white/30 font-mono">
                  Kyle AI • {generationPhase === "complete" ? "Done" : generationPhase === "error" ? "Error" : "Building..."}
                </div>
              </div>
            </Card>

            {/* Mini terminal log */}
            <Card className="border border-border/50 overflow-hidden">
              <div className="px-3 py-1.5 bg-muted/50 flex items-center gap-2 border-b border-border">
                <Terminal className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-mono text-muted-foreground">Build Log</span>
              </div>
              <div
                ref={terminalRef}
                className="p-3 font-mono text-[11px] max-h-32 overflow-y-auto space-y-0.5 bg-card"
              >
                <div className="text-muted-foreground">$ kyle build --skill="{name}"</div>
                {generationLogs.map((log, i) => (
                  <div
                    key={i}
                    className={cn(
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
              </div>
            </Card>

            {/* Complete actions */}
            {generationPhase === "complete" && (
              <div className="flex items-center justify-center">
                <Button variant="outline" size="sm" onClick={handleNewSkill} className="gap-2">
                  <Wand2 className="w-3 h-3" />
                  Build Another Skill
                </Button>
              </div>
            )}
            {generationPhase === "error" && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowErrorDialog(true)} className="gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  See Options
                </Button>
                <Button size="sm" onClick={handleRetry} className="gap-2">
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
              </div>
            )}
          </div>
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
                            <div key={i} className={cn(
                              "flex items-center justify-between px-3 py-2 rounded-lg border",
                              file.error ? "bg-destructive/10 border-destructive/30" :
                              file.uploading ? "bg-muted/30 border-border animate-pulse" :
                              file.url ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border"
                            )}>
                              <div className="flex items-center gap-2">
                                {file.uploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                ) : file.error ? (
                                  <AlertTriangle className="w-4 h-4 text-destructive" />
                                ) : file.url ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <FileText className="w-4 h-4 text-primary" />
                                )}
                                <span className="text-sm text-foreground">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{file.size}</span>
                                {file.error && (
                                  <span className="text-xs text-destructive">Upload failed</span>
                                )}
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

      {/* Error Recovery Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Kyle needs your help
            </DialogTitle>
            <DialogDescription>
              {errorMessage || "Something went wrong during skill generation. Choose how you'd like to proceed."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button onClick={handleRetry} className="w-full gap-2 justify-start" variant="outline">
              <RefreshCw className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Try Again</div>
                <div className="text-xs text-muted-foreground">Retry with the same configuration</div>
              </div>
            </Button>
            <Button onClick={handleEditAndRetry} className="w-full gap-2 justify-start" variant="outline">
              <Pencil className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Edit & Retry</div>
                <div className="text-xs text-muted-foreground">Go back to review your inputs before retrying</div>
              </div>
            </Button>
            <Button onClick={handleContinueWithout} className="w-full gap-2 justify-start" variant="outline">
              <SkipForward className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Start Fresh</div>
                <div className="text-xs text-muted-foreground">Reset and create a different skill</div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Kyle will keep improving. Temporary issues are normal.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
