import { useState, useCallback, useRef } from "react";
import { useConversation } from "@11labs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, ArrowRight, CheckCircle2, MessageSquare, Target, Settings, Upload, FileText, Music, Video, Globe } from "lucide-react";

// Kyle Comm agent ID - this agent was created with proper overrides enabled
const KYLE_COMM_AGENT_ID = "agent_1501kbtjqq0pezxrrhkv2hvjync6";

type ConversationPhase = 'idle' | 'oriel' | 'james' | 'synthesis' | 'complete';
type OrielLanguage = 'en' | 'es';

interface ConversationNote {
  phase: string;
  speaker: string;
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  name: string;
  type: string;
  content?: string;
  url?: string;
}

const DailyNextInteriors = () => {
  const [currentPhase, setCurrentPhase] = useState<ConversationPhase>('idle');
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [orielSummary, setOrielSummary] = useState<string>("");
  const [jamesSummary, setJamesSummary] = useState<string>("");
  const [finalPlan, setFinalPlan] = useState<string>("");
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");
  
  // Language selection for Oriel
  const [orielLanguage, setOrielLanguage] = useState<OrielLanguage>('en');
  
  // File uploads per person
  const [orielFiles, setOrielFiles] = useState<UploadedFile[]>([]);
  const [jamesFiles, setJamesFiles] = useState<UploadedFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orielFileInputRef = useRef<HTMLInputElement>(null);
  const jamesFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Comm connected");
    },
    onDisconnect: () => {
      console.log("Kyle Comm disconnected");
      // Handle phase transitions
      if (currentPhase === 'oriel') {
        toast({
          title: "Session with Oriel complete",
          description: "Ready to talk with James",
        });
      } else if (currentPhase === 'james') {
        toast({
          title: "Session with James complete",
          description: "Kyle is synthesizing the GTM plan",
        });
        setCurrentPhase('synthesis');
      }
    },
    onMessage: (message) => {
      console.log("Kyle Comm message:", message);
      
      // Capture conversation notes
      if (message.source === 'user' && typeof message.message === 'string') {
        const speakerName = currentPhase === 'oriel' ? 'Oriel' : currentPhase === 'james' ? 'James' : 'User';
        setNotes(prev => [...prev, {
          phase: currentPhase,
          speaker: speakerName,
          content: message.message as string,
          timestamp: new Date()
        }]);
      } else if (message.source === 'ai' && typeof message.message === 'string') {
        setNotes(prev => [...prev, {
          phase: currentPhase,
          speaker: 'Kyle',
          content: message.message as string,
          timestamp: new Date()
        }]);
      }
    },
    onError: (error) => {
      console.error("Kyle Comm error:", error);
      toast({
        title: "Connection error",
        description: "Failed to connect to Kyle",
        variant: "destructive"
      });
    },
  });

  // Handle Knowledge Base upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setKnowledgeBase(text);
      toast({
        title: "Knowledge base loaded",
        description: `${file.name} has been loaded for Kyle`,
      });
    } catch (err) {
      console.error("Failed to read file:", err);
      toast({
        title: "Error reading file",
        description: "Could not process the file",
        variant: "destructive"
      });
    }
  };

  // Handle file uploads for Oriel
  const handleOrielFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;
      
      if (fileType.includes('pdf') || fileType.includes('text')) {
        try {
          const text = await file.text();
          newFiles.push({
            name: file.name,
            type: 'document',
            content: text.substring(0, 3000), // Limit content size
          });
        } catch (err) {
          console.error("Failed to read document:", err);
        }
      } else if (fileType.includes('audio') || fileType.includes('video')) {
        // For audio/video, we just track the file name (transcription would require additional API)
        newFiles.push({
          name: file.name,
          type: fileType.includes('audio') ? 'audio' : 'video',
          content: `[${fileType.includes('audio') ? 'Audio' : 'Video'} file: ${file.name}]`,
        });
      }
    }
    
    setOrielFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) added to Oriel's session`,
    });
  };

  // Handle file uploads for James
  const handleJamesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;
      
      if (fileType.includes('pdf') || fileType.includes('text')) {
        try {
          const text = await file.text();
          newFiles.push({
            name: file.name,
            type: 'document',
            content: text.substring(0, 3000),
          });
        } catch (err) {
          console.error("Failed to read document:", err);
        }
      } else if (fileType.includes('audio') || fileType.includes('video')) {
        newFiles.push({
          name: file.name,
          type: fileType.includes('audio') ? 'audio' : 'video',
          content: `[${fileType.includes('audio') ? 'Audio' : 'Video'} file: ${file.name}]`,
        });
      }
    }
    
    setJamesFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) added to James's session`,
    });
  };

  const startSessionWithOriel = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setCurrentPhase('oriel');
      setNotes([]);
      
      const knowledgeContext = knowledgeBase 
        ? `\n\nKNOWLEDGE BASE CONTEXT:\n${knowledgeBase.substring(0, 2000)}` 
        : '';
      
      const filesContext = orielFiles.length > 0
        ? `\n\nORIEL'S UPLOADED FILES:\n${orielFiles.map(f => `- ${f.name}: ${f.content?.substring(0, 500) || f.type}`).join('\n')}`
        : '';

      const firstMessageEs = "¡Hola Oriel! Vamos a tener una charla rápida para refinar nuestra estrategia de go-to-market. Después hablaré con James para que todos estemos en la misma página. ¿Cuál es tu prioridad GTM más importante ahora mismo?";
      const firstMessageEn = "Hey Oriel! Let's have a quick chat to refine our go-to-market strategy. I'll reach out to James after so we're all on the same page. What's your biggest GTM priority right now?";
      
      await conversation.startSession({
        agentId: KYLE_COMM_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: {
              prompt: `You are Kyle Comm, an expert in Agile methodology and startup Go-to-Market strategy.

You are now speaking with ORIEL, one of the co-founders of Next Interiors. Focus on:
- Marketing strategy and customer acquisition
- Brand positioning and messaging
- Pricing and monetization
- Target customer segments
- Growth channels and campaigns

${orielLanguage === 'es' ? 'IMPORTANT: Oriel prefers to speak in SPANISH. Respond in Spanish throughout this conversation.' : 'Speak in English.'}

Keep the conversation focused and action-oriented. Ask the 3 Agile questions:
1. What did you accomplish since our last sync?
2. What are you working on today?
3. Any blockers or dependencies?

${knowledgeContext}${filesContext}`,
            },
            firstMessage: orielLanguage === 'es' ? firstMessageEs : firstMessageEn,
            language: orielLanguage,
          },
        },
      });
      
      toast({
        title: "Connected with Oriel",
        description: `Kyle Comm is ready (${orielLanguage === 'es' ? 'Spanish' : 'English'})`,
      });
    } catch (err) {
      console.error("Failed to start Oriel session:", err);
      toast({
        title: "Error",
        description: "Could not start the conversation. Check microphone permissions.",
        variant: "destructive"
      });
    }
  }, [conversation, toast, knowledgeBase, orielFiles, orielLanguage]);

  const startSessionWithJames = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Save Oriel's session summary
      const orielNotes = notes.filter(n => n.phase === 'oriel').map(n => `${n.speaker}: ${n.content}`).join('\n');
      setOrielSummary(orielNotes);
      
      setCurrentPhase('james');
      
      const knowledgeContext = knowledgeBase 
        ? `\n\nKNOWLEDGE BASE CONTEXT:\n${knowledgeBase.substring(0, 2000)}` 
        : '';
      
      const orielContext = orielNotes 
        ? `\n\nCONTEXT FROM ORIEL'S SESSION:\n${orielNotes}` 
        : '';

      const filesContext = jamesFiles.length > 0
        ? `\n\nJAMES'S UPLOADED FILES:\n${jamesFiles.map(f => `- ${f.name}: ${f.content?.substring(0, 500) || f.type}`).join('\n')}`
        : '';
      
      await conversation.startSession({
        agentId: KYLE_COMM_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: {
              prompt: `You are Kyle Comm, an expert in Agile methodology and startup Go-to-Market strategy.

You are now speaking with JAMES, one of the co-founders of Next Interiors. Focus on:
- Product readiness and feature pipeline
- Technical capabilities and constraints
- Development timelines
- Competitive advantages
- Integration with marketing efforts

Speak in English.

Keep the conversation focused and action-oriented. Ask the 3 Agile questions:
1. What did you accomplish since our last sync?
2. What are you working on today?
3. Any blockers or dependencies?

${knowledgeContext}
${orielContext}${filesContext}`,
            },
            firstMessage: "Hey James! Let's have a quick chat to align on our go-to-market. I just synced with Oriel, so I can help connect the dots between product and marketing. What's your main focus this week?",
            language: "en",
          },
        },
      });
      
      toast({
        title: "Connected with James",
        description: "Kyle Comm is ready (English)",
      });
    } catch (err) {
      console.error("Failed to start James session:", err);
      toast({
        title: "Error",
        description: "Could not start the conversation. Check microphone permissions.",
        variant: "destructive"
      });
    }
  }, [conversation, notes, toast, knowledgeBase, jamesFiles]);

  const generateSynthesis = useCallback(async () => {
    const jamesNotes = notes.filter(n => n.phase === 'james').map(n => `${n.speaker}: ${n.content}`).join('\n');
    setJamesSummary(jamesNotes);
    
    // Generate the final GTM plan based on both conversations
    const allNotes = notes.map(n => `[${n.phase.toUpperCase()}] ${n.speaker}: ${n.content}`).join('\n\n');
    
    setFinalPlan(`
**Go-to-Market Daily Sync Summary**

📋 **From Oriel's Session:**
${orielSummary || "No notes captured"}

🔧 **From James's Session:**
${jamesNotes || "No notes captured"}

🎯 **Action Items:**
- Review captured insights
- Align on priorities
- Execute GTM strategy

_This synthesis is based on today's triangulation meeting._
    `);
    
    setCurrentPhase('complete');
    
    toast({
      title: "GTM Plan Ready",
      description: "Kyle has synthesized the daily sync",
    });
  }, [notes, orielSummary, toast]);

  const endCurrentSession = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const resetDaily = () => {
    setCurrentPhase('idle');
    setNotes([]);
    setOrielSummary("");
    setJamesSummary("");
    setFinalPlan("");
  };

  const createKyleCommAgent = async () => {
    try {
      toast({
        title: "Creating Kyle Comm agent...",
        description: "This may take a moment",
      });
      
      const { data, error } = await supabase.functions.invoke('create-kyle-comm-agent', {
        body: {}
      });
      
      if (error) throw error;
      
      toast({
        title: "Kyle Comm Agent Created!",
        description: `Agent ID: ${data.agent_id}. Update KYLE_COMM_AGENT_ID in code.`,
      });
      
      console.log("New Kyle Comm Agent ID:", data.agent_id);
    } catch (err) {
      console.error("Error creating agent:", err);
      toast({
        title: "Error creating agent",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const getPhaseStatus = (phase: ConversationPhase) => {
    const phases: ConversationPhase[] = ['idle', 'oriel', 'james', 'synthesis', 'complete'];
    const currentIndex = phases.indexOf(currentPhase);
    const phaseIndex = phases.indexOf(phase);
    
    if (phaseIndex < currentIndex) return 'complete';
    if (phaseIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Daily Next Interiors
          </h1>
          <p className="text-muted-foreground mt-2">
            GTM Triangulation: Kyle ↔ Oriel ↔ James
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { phase: 'oriel' as ConversationPhase, label: 'Oriel', icon: Users },
            { phase: 'james' as ConversationPhase, label: 'James', icon: Users },
            { phase: 'synthesis' as ConversationPhase, label: 'Synthesis', icon: MessageSquare },
            { phase: 'complete' as ConversationPhase, label: 'Plan Ready', icon: CheckCircle2 },
          ].map((step, idx) => (
            <div key={step.phase} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                getPhaseStatus(step.phase) === 'complete' 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : getPhaseStatus(step.phase) === 'active'
                    ? 'bg-primary border-primary text-primary-foreground animate-pulse'
                    : 'bg-muted/30 border-muted text-muted-foreground'
              }`}>
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {idx < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kyle Avatar & Controls */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Kyle Comm
                <Badge variant={conversation.status === 'connected' ? 'default' : 'secondary'}>
                  {conversation.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <KyleAvatar 
                size="xl" 
                isConnectedOverride={conversation.status === 'connected'}
                isSpeakingOverride={conversation.isSpeaking}
              />
              
              {conversation.status === 'connected' && (
                <AudioWaves isActive={true} isSpeaking={conversation.isSpeaking} />
              )}
              
              <p className="text-sm text-muted-foreground text-center">
                {currentPhase === 'idle' && "Ready to start the daily sync"}
                {currentPhase === 'oriel' && (conversation.isSpeaking ? "Kyle is speaking with Oriel..." : "Listening to Oriel...")}
                {currentPhase === 'james' && (conversation.isSpeaking ? "Kyle is speaking with James..." : "Listening to James...")}
                {currentPhase === 'synthesis' && "Generating GTM synthesis..."}
                {currentPhase === 'complete' && "Daily sync complete!"}
              </p>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                {currentPhase === 'idle' && (
                  <>
                    {/* Language Selection for Oriel */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Oriel's language:</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={orielLanguage === 'en' ? 'default' : 'outline'}
                          onClick={() => setOrielLanguage('en')}
                          className="h-7 px-2"
                        >
                          EN
                        </Button>
                        <Button
                          size="sm"
                          variant={orielLanguage === 'es' ? 'default' : 'outline'}
                          onClick={() => setOrielLanguage('es')}
                          className="h-7 px-2"
                        >
                          ES
                        </Button>
                      </div>
                    </div>

                    {/* File Upload Sections */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Oriel's Files */}
                      <div className="space-y-1">
                        <input
                          type="file"
                          ref={orielFileInputRef}
                          onChange={handleOrielFileUpload}
                          accept=".pdf,.txt,.mp3,.mp4,.wav,.m4a"
                          multiple
                          className="hidden"
                        />
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => orielFileInputRef.current?.click()}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Oriel Files
                        </Button>
                        {orielFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {orielFiles.map((f, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {f.type === 'document' && <FileText className="w-3 h-3 mr-1" />}
                                {f.type === 'audio' && <Music className="w-3 h-3 mr-1" />}
                                {f.type === 'video' && <Video className="w-3 h-3 mr-1" />}
                                {f.name.substring(0, 10)}...
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* James's Files */}
                      <div className="space-y-1">
                        <input
                          type="file"
                          ref={jamesFileInputRef}
                          onChange={handleJamesFileUpload}
                          accept=".pdf,.txt,.mp3,.mp4,.wav,.m4a"
                          multiple
                          className="hidden"
                        />
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => jamesFileInputRef.current?.click()}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          James Files
                        </Button>
                        {jamesFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {jamesFiles.map((f, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {f.type === 'document' && <FileText className="w-3 h-3 mr-1" />}
                                {f.type === 'audio' && <Music className="w-3 h-3 mr-1" />}
                                {f.type === 'video' && <Video className="w-3 h-3 mr-1" />}
                                {f.name.substring(0, 10)}...
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Start Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={startSessionWithOriel}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        I am Oriel
                      </Button>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={startSessionWithJames}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        I am James
                      </Button>
                    </div>
                  </>
                )}
                
                {currentPhase === 'oriel' && conversation.status === 'connected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={endCurrentSession}
                  >
                    It's all from my end for today
                  </Button>
                )}
                
                {currentPhase === 'oriel' && conversation.status === 'disconnected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={startSessionWithJames}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Continue with James
                  </Button>
                )}
                
                {currentPhase === 'james' && conversation.status === 'connected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={endCurrentSession}
                  >
                    It's all from my end for today
                  </Button>
                )}
                
                {currentPhase === 'james' && conversation.status === 'disconnected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={generateSynthesis}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate GTM Plan
                  </Button>
                )}
                
                {currentPhase === 'synthesis' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={generateSynthesis}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalize Plan
                  </Button>
                )}
                
                {currentPhase === 'complete' && (
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={resetDaily}
                  >
                    Start New Daily
                  </Button>
                )}
                
                {/* Knowledge Base Upload */}
                {currentPhase === 'idle' && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.txt"
                      className="hidden"
                    />
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {knowledgeBase ? "Knowledge Base Loaded ✓" : "Upload GTM Knowledge Base"}
                    </Button>
                    
                    {/* Admin: Create Kyle Comm Agent */}
                    <Button 
                      className="w-full"
                      variant="ghost"
                      size="sm"
                      onClick={createKyleCommAgent}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Create Kyle Comm Agent
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversation Notes */}
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Conversation Notes
                <Badge variant="secondary" className="ml-auto">{notes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Notes will appear here as the conversations progress
                </p>
              ) : (
                notes.map((note, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      note.speaker === 'Kyle' 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={note.phase === 'oriel' ? 'default' : 'secondary'}>
                        {note.phase}
                      </Badge>
                      <span className="font-medium text-foreground">{note.speaker}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Final GTM Plan */}
        {finalPlan && (
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                GTM Synthesis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 p-4 rounded-lg">
                  {finalPlan}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DailyNextInteriors;
