import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Loader2, Wand2, ArrowRight, Sparkles, Check, Terminal, PartyPopper, AlertTriangle, RefreshCw, SkipForward, ChevronDown, ChevronUp, FileText, CheckCircle2, Circle } from "lucide-react";
import { KyleAvatar } from "@/components/KyleAvatar";
import { useCustomSkills, GENERATION_PHASES } from "@/hooks/useCustomSkills";
import { useSkillBuilderVoice } from "@/hooks/useSkillBuilderVoice";
import { AudioWaves } from "@/components/AudioWaves";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type PagePhase = "conversation" | "building" | "complete";

interface SkillDoc {
  name: string;
  description: string;
  bullets: string[];
  prompt: string;
  role: string;
}

const statusColors: Record<string, string> = {
  building: "bg-primary/10 text-primary border-primary/30",
  ready: "bg-primary/20 text-primary border-primary/40",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function SkillBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { skills, loading, createSkill, generationPhase, generationLogs, codeLines, resetGeneration } = useCustomSkills();
  const voice = useSkillBuilderVoice();

  const [pagePhase, setPagePhase] = useState<PagePhase>("conversation");
  const [skillDoc, setSkillDoc] = useState<SkillDoc | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [buildError, setBuildError] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    if (codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight;
  }, [generationLogs, codeLines]);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [voice.transcript]);

  const isGenerating = generationPhase !== "idle" && generationPhase !== "complete" && generationPhase !== "error";
  const currentPhaseIndex = GENERATION_PHASES.findIndex(p => p.phase === generationPhase);

  // Sync generationPhase with pagePhase
  useEffect(() => {
    if (pagePhase === "building" && generationPhase === "complete") {
      setPagePhase("complete");
    }
    if (pagePhase === "building" && generationPhase === "error") {
      setBuildError(true);
    }
  }, [generationPhase, pagePhase]);

  // Single handler: stop voice → analyze → build
  const handleBuildIt = useCallback(async () => {
    await voice.stopConversation();
    const fullTranscript = voice.getFullTranscript();

    if (!fullTranscript || fullTranscript.trim().length < 20) {
      toast({ title: "Too short", description: "The conversation was too short. Try again!", variant: "destructive" });
      return;
    }

    setPagePhase("building");
    setBuildError(false);

    try {
      // Step 1: Analyze transcript
      const { data, error } = await supabase.functions.invoke("analyze-skill-transcript", {
        body: { transcript: fullTranscript },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "Failed to analyze transcript");
      }

      const doc: SkillDoc = {
        name: data.name || "New Skill",
        description: data.description || "",
        bullets: data.bullets || [],
        prompt: data.prompt || fullTranscript,
        role: data.role || "",
      };
      setSkillDoc(doc);

      // Step 2: Build the skill
      const prompt = `Create a professional, production-ready skill called "${doc.name}".

ROLE: ${doc.role}

DESCRIPTION: ${doc.description}

WHAT IT SHOULD DO:
${doc.bullets.map(b => `- ${b}`).join("\n")}

DETAILED REQUIREMENTS:
${doc.prompt}

IMPORTANT GUIDELINES:
- The output MUST be a fully functional, self-contained HTML page renderable in an iframe.
- Use modern CSS (flexbox, grid, variables, animations, gradients) for a polished, professional look.
- Include interactive JavaScript where appropriate.
- Make it responsive and print-friendly when applicable.
- Include sample/placeholder data so the skill is immediately usable.
- Use professional typography and spacing.`;

      const result = await createSkill(prompt, doc.name, doc.description);
      if (!result) {
        setBuildError(true);
      }
    } catch (err) {
      console.error("Build failed:", err);
      setBuildError(true);
      toast({ title: "Build failed", description: "Something went wrong. You can retry.", variant: "destructive" });
    }
  }, [voice, toast, createSkill]);

  const handleNewSkill = () => {
    resetGeneration();
    setSkillDoc(null);
    setPagePhase("conversation");
    setTranscriptOpen(false);
    setBuildError(false);
  };

  const handleRetry = () => {
    setShowErrorDialog(false);
    setBuildError(false);
    resetGeneration();
    // Re-trigger build with existing doc
    if (skillDoc) {
      setPagePhase("building");
      const prompt = `Create a professional, production-ready skill called "${skillDoc.name}".
ROLE: ${skillDoc.role}
DESCRIPTION: ${skillDoc.description}
WHAT IT SHOULD DO:
${skillDoc.bullets.map(b => `- ${b}`).join("\n")}
DETAILED REQUIREMENTS:
${skillDoc.prompt}
IMPORTANT GUIDELINES:
- The output MUST be a fully functional, self-contained HTML page renderable in an iframe.
- Use modern CSS for a polished look.
- Include interactive JavaScript where appropriate.
- Make it responsive. Include sample data.`;
      createSkill(prompt, skillDoc.name, skillDoc.description);
    }
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
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Skill Builder</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Talk to Kyle. He'll build it.
          </p>
        </div>

        {/* ===== SCREEN 1: CONVERSATION ===== */}
        {pagePhase === "conversation" && (
          <div className="flex flex-col items-center gap-6">
            <KyleAvatar
              size="lg"
              standalone
              onClickOverride={voice.isConnected ? () => voice.stopConversation() : () => voice.startConversation()}
              isConnectedOverride={voice.isConnected}
              isSpeakingOverride={voice.isSpeaking}
            />

            {voice.isConnected ? (
              <div className="flex items-center justify-center gap-2">
                <AudioWaves isActive={true} isSpeaking={voice.isSpeaking} barCount={5} className="h-6" />
                <span className="text-sm font-medium text-foreground">
                  {voice.isSpeaking ? "Kyle is speaking..." : "Kyle is listening..."}
                </span>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Tap Kyle to start</p>
                <p className="text-xs text-muted-foreground">
                  Describe the tool you need. Kyle will ask the right questions.
                </p>
              </div>
            )}

            {/* Live transcript — always visible */}
            <div
              ref={transcriptRef}
              className="w-full max-w-md max-h-56 min-h-[80px] overflow-y-auto rounded-lg bg-muted/50 p-3 space-y-1.5"
            >
              {voice.transcript.length > 0 ? (
                voice.transcript.map((line, i) => (
                  <p key={i} className={cn(
                    "text-xs",
                    line.startsWith("Kyle:") ? "text-primary font-medium" : "text-muted-foreground"
                  )}>
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-xs text-muted-foreground/50 italic text-center pt-4">
                  Transcript will appear here...
                </p>
              )}
            </div>

            {/* Action buttons — always visible */}
            <div className="flex justify-center gap-3">
              {voice.isConnected && (
                <Button variant="ghost" size="sm" onClick={() => voice.stopConversation()} className="text-xs text-muted-foreground">
                  Cancel
                </Button>
              )}
              <Button
                variant="kyle"
                size="lg"
                onClick={handleBuildIt}
                disabled={voice.transcript.length < 2}
                className="gap-2 text-base"
              >
                <Wand2 className="w-4 h-4" />
                Let's build it!
              </Button>
            </div>

            {voice.error && <p className="text-xs text-destructive">{voice.error}</p>}
          </div>
        )}

        {/* ===== SCREEN 2: BUILDING (Kyle's Computer) ===== */}
        {(pagePhase === "building" || pagePhase === "complete") && (
          <div className="space-y-6">
            {/* Skill summary card (appears once analysis is done) */}
            {skillDoc && (
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{skillDoc.name}</h2>
                      <p className="text-sm text-muted-foreground">{skillDoc.description}</p>
                    </div>
                    {pagePhase === "complete" && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <Check className="w-3 h-3 mr-1" /> Built
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What Kyle will build</p>
                    <ul className="space-y-2">
                      {skillDoc.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Collapsed transcript */}
                  <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <FileText className="w-3 h-3" />
                      Conversation transcript
                      {transcriptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-muted/30 p-3 space-y-1">
                        {voice.transcript.map((line, i) => (
                          <p key={i} className={cn(
                            "text-xs",
                            line.startsWith("Kyle:") ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )}

            {/* Pipeline steps */}
            <div className="flex items-center justify-center gap-2">
              {GENERATION_PHASES.map((p, i) => {
                const isDone = currentPhaseIndex > i || generationPhase === "complete";
                const isCurrent = currentPhaseIndex === i && isGenerating;
                return (
                  <div key={p.phase} className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      isDone ? "bg-green-500/10 text-green-600 border border-green-500/30" :
                      isCurrent ? "bg-primary/10 text-primary border border-primary/30 animate-pulse" :
                      "bg-muted text-muted-foreground border border-border"
                    )}>
                      {isDone ? <Check className="w-3 h-3" /> : isCurrent ? <Loader2 className="w-3 h-3 animate-spin" /> : <Circle className="w-3 h-3" />}
                      {p.label.split(" ").pop()}
                    </div>
                    {i < GENERATION_PHASES.length - 1 && (
                      <div className={cn("w-4 h-0.5 rounded", isDone ? "bg-green-500" : "bg-border")} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Kyle's Computer - Terminal */}
            <Card className="border-2 border-primary/30 overflow-hidden shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
              {/* Title bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-white/40 ml-2 font-mono">Kyle's Computer</span>
                </div>
                <div className="flex items-center gap-2">
                  {isGenerating && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                  {generationPhase === "complete" && <Check className="w-4 h-4 text-green-400" />}
                  <span className="text-[10px] text-white/30 font-mono">{codeLines.length} lines</span>
                </div>
              </div>

              {/* Code editor */}
              <div
                ref={codeRef}
                className="bg-[#1e1e2e] p-0 font-mono text-[13px] leading-6 max-h-[400px] overflow-y-auto"
                style={{ scrollBehavior: 'smooth' }}
              >
                {codeLines.map((line, i) => (
                  <div key={i} className={cn("flex transition-opacity duration-200", i === codeLines.length - 1 && isGenerating ? "bg-white/[0.03]" : "")}>
                    <span className="inline-block w-12 text-right pr-4 text-white/20 select-none flex-shrink-0">{i + 1}</span>
                    <span className={cn(
                      "flex-1 pr-4",
                      line.trim().startsWith('//') || line.trim().startsWith('<!--') ? "text-white/30 italic" :
                      line.trim().startsWith('<') ? "text-[#7dd3fc]" :
                      line.trim().startsWith('.') || line.includes('{') && !line.includes('(') ? "text-[#c4b5fd]" :
                      line.includes('function') || line.includes('const') ? "text-[#fbbf24]" :
                      line.includes(':') && !line.includes('//') && !line.includes('<') ? "text-[#a5f3fc]" :
                      "text-white/80"
                    )}>
                      {line || '\u00A0'}
                    </span>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex">
                    <span className="inline-block w-12 text-right pr-4 text-white/20 select-none">{codeLines.length + 1}</span>
                    <span className="text-primary animate-pulse">█</span>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#1e1e2e] border-t border-white/5">
                <div className="flex items-center gap-3">
                  {GENERATION_PHASES.map((p, i) => {
                    const isDone = currentPhaseIndex > i || generationPhase === "complete";
                    const isCurrent = currentPhaseIndex === i && isGenerating;
                    return (
                      <div key={p.phase} className="flex items-center gap-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full transition-all", isDone ? "bg-green-400" : isCurrent ? "bg-primary animate-pulse" : "bg-white/10")} />
                        <span className={cn("text-[10px] font-mono transition-colors", isDone ? "text-green-400/70" : isCurrent ? "text-white/60" : "text-white/20")}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-white/30 font-mono">
                  Kyle AI • {generationPhase === "complete" ? "Done" : generationPhase === "error" ? "Error" : "Building..."}
                </div>
              </div>
            </Card>

            {/* Build log */}
            <Card className="border border-border/50 overflow-hidden">
              <div className="px-3 py-1.5 bg-muted/50 flex items-center gap-2 border-b border-border">
                <Terminal className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-mono text-muted-foreground">Build Log</span>
              </div>
              <div ref={terminalRef} className="p-3 font-mono text-[11px] max-h-32 overflow-y-auto space-y-0.5 bg-card">
                <div className="text-muted-foreground">$ kyle build --skill="{skillDoc?.name || "..."}"</div>
                {generationLogs.map((log, i) => (
                  <div key={i} className={cn(
                    log.startsWith("▸") ? "text-primary font-semibold mt-1" :
                    log.startsWith("  ✓") ? "text-muted-foreground" :
                    log.startsWith("  →") ? "text-primary" :
                    log.startsWith("✗") ? "text-destructive" :
                    "text-foreground"
                  )}>
                    {log}
                  </div>
                ))}
              </div>
            </Card>

            {/* Complete actions */}
            {pagePhase === "complete" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <PartyPopper className="w-5 h-5" />
                  Skill built successfully!
                  <PartyPopper className="w-5 h-5" />
                </div>
                <Button variant="outline" size="sm" onClick={handleNewSkill} className="gap-2">
                  <Wand2 className="w-3 h-3" /> Build Another Skill
                </Button>
              </div>
            )}

            {/* Error actions */}
            {buildError && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowErrorDialog(true)} className="gap-2">
                  <AlertTriangle className="w-3 h-3" /> See Options
                </Button>
                <Button size="sm" onClick={handleRetry} className="gap-2">
                  <RefreshCw className="w-3 h-3" /> Retry
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Skills Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Your Custom Skills</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : skills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No custom skills yet. Create your first one above!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <Card key={skill.id} className={cn("cursor-pointer hover:shadow-md transition-all", skill.status === "ready" && "hover:border-primary/50")} onClick={() => skill.status === "ready" && navigate(`/skills/${skill.id}`)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{skill.icon}</span>
                        <span className="font-medium text-foreground">{skill.name}</span>
                      </div>
                      <Badge variant="outline" className={statusColors[skill.status] || ""}>{skill.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{skill.description}</p>
                    {skill.status === "ready" && (
                      <div className="flex items-center gap-1 text-xs text-primary">Open <ArrowRight className="w-3 h-3" /></div>
                    )}
                    {skill.status === "building" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Kyle is building...</div>
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
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /> Kyle needs your help</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button onClick={handleRetry} className="w-full gap-2 justify-start" variant="outline">
              <RefreshCw className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Try Again</div>
                <div className="text-xs text-muted-foreground">Retry with the same configuration</div>
              </div>
            </Button>
            <Button onClick={handleNewSkill} className="w-full gap-2 justify-start" variant="outline">
              <SkipForward className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Start Fresh</div>
                <div className="text-xs text-muted-foreground">Have a new conversation with Kyle</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
