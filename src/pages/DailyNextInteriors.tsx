import { useState, useCallback } from "react";
import { useConversation } from "@11labs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, ArrowRight, CheckCircle2, MessageSquare, Target, Settings } from "lucide-react";

// Kyle Comm agent ID - update this after creating the agent
const KYLE_COMM_AGENT_ID = "agent_1501kbtjqq0pezxrrhkv2hvjync6"; // Using existing Kyle until new agent created

type ConversationPhase = 'idle' | 'oriel' | 'james' | 'synthesis' | 'complete';

interface ConversationNote {
  phase: string;
  speaker: string;
  content: string;
  timestamp: Date;
}

const DailyNextInteriors = () => {
  const [currentPhase, setCurrentPhase] = useState<ConversationPhase>('idle');
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [orielSummary, setOrielSummary] = useState<string>("");
  const [jamesSummary, setJamesSummary] = useState<string>("");
  const [finalPlan, setFinalPlan] = useState<string>("");
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
      
      await conversation.startSession({
        agentId: KYLE_COMM_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: {
              prompt: `You are Kyle Comm, the Go-to-Market strategist for Next Interiors. 
              
You are now speaking with ORIEL, one of the co-founders. Your goal is to:
1. Ask Oriel about their current GTM priorities and challenges
2. Discuss marketing strategies, target customers, and positioning
3. Understand what resources and budget are available
4. Identify key decisions that need to be made

Be conversational but focused. Take mental notes of all key points Oriel mentions.
After gathering information, summarize what you learned and ask if there's anything else to add.

Start by greeting Oriel warmly and asking about the most pressing GTM priority for this week.`
            },
            firstMessage: "Hey Oriel! Great to connect for our daily sync. What's the most pressing Go-to-Market priority you want to tackle this week?"
          }
        }
      });
    } catch (err) {
      console.error("Failed to start Oriel session:", err);
      toast({
        title: "Error",
        description: "Could not start the conversation",
        variant: "destructive"
      });
    }
  }, [conversation, toast]);

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
      
      await conversation.startSession({
        agentId: KYLE_COMM_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: {
              prompt: `You are Kyle Comm, the Go-to-Market strategist for Next Interiors.

You are now speaking with JAMES, one of the co-founders. Your goal is to:
1. Ask James about their technical capabilities and product roadmap
2. Discuss what features are ready for market
3. Understand technical constraints and timelines
4. Get James's perspective on competitive advantages

Context from earlier conversation with Oriel:
${orielNotes}

Use this context to ask relevant follow-up questions and identify synergies or conflicts.
After gathering information, summarize key points and ask if there's anything else to add.

Start by greeting James and asking about the product's current state and what's ready to showcase.`
            },
            firstMessage: "Hey James! Just finished syncing with Oriel. Now I'd love to hear your perspective - what's the current state of the product and what features are we ready to showcase to the market?"
          }
        }
      });
    } catch (err) {
      console.error("Failed to start James session:", err);
      toast({
        title: "Error",
        description: "Could not start the conversation",
        variant: "destructive"
      });
    }
  }, [conversation, notes, toast]);

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
              <div className="w-full space-y-2">
                {currentPhase === 'idle' && (
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
                )}
                
                {currentPhase === 'oriel' && conversation.status === 'connected' && (
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={endCurrentSession}
                  >
                    End Oriel Session
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
                    className="w-full"
                    variant="outline"
                    onClick={endCurrentSession}
                  >
                    End James Session
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
                
                {/* Admin: Create Kyle Comm Agent */}
                {currentPhase === 'idle' && (
                  <Button 
                    className="w-full"
                    variant="ghost"
                    size="sm"
                    onClick={createKyleCommAgent}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Create Kyle Comm Agent
                  </Button>
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
