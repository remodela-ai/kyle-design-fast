import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, ArrowRight, CheckCircle2, MessageSquare, Target, Settings, Upload, FileText, Music, Video, Globe, History, BarChart3, Mail, Plus, X, Eye, Timer, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Kyle Oriel-Carlos agent ID - will be updated after agent creation
const KYLE_ORIEL_CARLOS_AGENT_ID = "agent_9601kcaqrkejf8nvzjfh9efvetaj";

// Random daily greeting messages for Oriel (English)
const ORIEL_GREETINGS_EN = [
  "Hey Oriel! Quick sync - let's get everyone on the same page. What's your top priority today?",
  "Oriel! Let's dive right in. What did you accomplish since our last sync?",
  "Hey Oriel, ready for a quick standup? What's blocking you right now?",
  "Oriel! Let's make this quick and productive. What's your focus for today?",
  "Hey! Quick check-in. Oriel, what's the most important thing we need to align on?",
];

// Random daily greeting messages for Oriel (Spanish) - kept for ES language option
const ORIEL_GREETINGS_ES = [
  "Hey Oriel! Quick sync - let's get on the same page. What's your priority today?",
  "Oriel! Let's get straight to the point. What did you accomplish since our last sync?",
  "Hey Oriel, ready for a quick standup? What's blocking you right now?",
  "Oriel! Let's make this quick and productive. What's your focus for today?",
  "Hey! Quick check-in. Oriel, what's the most important thing we need to align on?",
];

// Random daily greeting messages for Carlos
const CARLOS_GREETINGS = [
  "Hey Carlos! Quick sync - I just talked to Oriel. What's your top priority today?",
  "Carlos! Let's dive in. What did you accomplish since our last sync?",
  "Hey Carlos, standup time. Any blockers on your end?",
  "Carlos! Quick and focused. What's your update?",
  "Hey! Connecting the dots between you and Oriel. What should we align on today?",
];

const getRandomGreeting = (greetings: string[]) => {
  return greetings[Math.floor(Math.random() * greetings.length)];
};

type ConversationPhase = 'idle' | 'oriel' | 'carlos' | 'synthesis' | 'complete';
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

const DailyOrielCarlos = () => {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState<ConversationPhase>('idle');
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [orielSummary, setOrielSummary] = useState<string>("");
  const [carlosSummary, setCarlosSummary] = useState<string>("");
  const [finalPlan, setFinalPlan] = useState<string>("");
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null);
  const [pastSyncs, setPastSyncs] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPastSync, setSelectedPastSync] = useState<any | null>(null);
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [transcriptMessages, setTranscriptMessages] = useState<any[]>([]);
  const [transcriptSyncDate, setTranscriptSyncDate] = useState<string>("");
  
  // Email recipients for synthesis
  const [emailRecipients, setEmailRecipients] = useState<string[]>(['oriel@copilotinnovations.com']);
  const [newEmail, setNewEmail] = useState<string>('');
  
  // Use ref to track current phase for callbacks (avoids stale closure)
  const currentPhaseRef = useRef<ConversationPhase>('idle');
  
  // Update ref whenever phase changes
  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);
  
  // Language selection for Oriel
  const [orielLanguage, setOrielLanguage] = useState<OrielLanguage>('en');
  
  // File uploads per person
  const [orielFiles, setOrielFiles] = useState<UploadedFile[]>([]);
  const [carlosFiles, setCarlosFiles] = useState<UploadedFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orielFileInputRef = useRef<HTMLInputElement>(null);
  const carlosFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Previous context for Kyle memory
  const [previousContext, setPreviousContext] = useState<string>("");
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  
  // 3-minute timer for each session
  const [sessionTimer, setSessionTimer] = useState<number>(180); // 3 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timer effect
  useEffect(() => {
    if (isTimerRunning && sessionTimer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setSessionTimer(prev => {
          if (prev <= 1) {
            // Time's up - show notification
            toast({
              title: "⏰ Time's up!",
              description: "The 3 minutes are over. You can continue or end your session.",
            });
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, toast]);
  
  // Reset timer when starting a new session
  const resetAndStartTimer = () => {
    setSessionTimer(180); // Reset to 3 minutes
    setIsTimerRunning(true);
  };
  
  // Format timer display
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load past syncs on mount and build context
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingContext(true);
      await Promise.all([loadPastSyncs(), loadPreviousContext()]);
      setIsLoadingContext(false);
    };
    loadData();
  }, []);

  const loadPastSyncs = async () => {
    const { data, error } = await supabase
      .from('daily_syncs')
      .select('*')
      .order('sync_date', { ascending: false })
      .limit(10);
    
    if (data && !error) {
      setPastSyncs(data);
    }
  };

  // Load previous conversation context for Kyle's memory
  const loadPreviousContext = async () => {
    try {
      // Get the last 3 completed syncs
      const { data: recentSyncs, error } = await supabase
        .from('daily_syncs')
        .select('id, sync_date, oriel_notes, james_notes, synthesis')
        .eq('status', 'complete')
        .order('sync_date', { ascending: false })
        .limit(3);
      
      if (error || !recentSyncs || recentSyncs.length === 0) {
        setPreviousContext("");
        return;
      }
      
      // Build context summary from recent syncs
      let contextParts: string[] = [];
      
      for (const sync of recentSyncs) {
        const syncDate = new Date(sync.sync_date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        let syncSummary = `\n### Session from ${syncDate}:\n`;
        
        if (sync.synthesis) {
          syncSummary += `**Synthesis:** ${sync.synthesis.substring(0, 500)}...\n`;
        }
        
        if (sync.oriel_notes) {
          syncSummary += `**Oriel's topics:** ${sync.oriel_notes.substring(0, 300)}...\n`;
        }
        
        if (sync.james_notes) { // Carlos notes
          syncSummary += `**Carlos's topics:** ${sync.james_notes.substring(0, 300)}...\n`;
        }
        
        contextParts.push(syncSummary);
      }
      
      const fullContext = contextParts.join('\n---\n');
      setPreviousContext(fullContext);
      console.log("Loaded previous context for Kyle:", fullContext.substring(0, 200) + "...");
      
    } catch (err) {
      console.error("Error loading previous context:", err);
      setPreviousContext("");
    }
  };

  // Create a new sync session in database
  const createSyncSession = async () => {
    const { data, error } = await supabase
      .from('daily_syncs')
      .insert({ 
        status: 'in_progress',
        knowledge_base: knowledgeBase || null
      })
      .select()
      .single();
    
    if (data && !error) {
      setCurrentSyncId(data.id);
      console.log("Created sync session:", data.id);
      return data.id;
    }
    return null;
  };

  // Save a message to database
  const saveMessage = async (syncId: string, phase: string, speaker: string, content: string) => {
    await supabase.from('sync_messages').insert({
      sync_id: syncId,
      phase,
      speaker,
      content,
      timestamp: new Date().toISOString()
    });
  };

  // Update sync with notes and synthesis
  const updateSyncNotes = async (syncId: string, orielNotes: string, carlosNotes: string, synthesis?: string) => {
    await supabase.from('daily_syncs').update({
      oriel_notes: orielNotes,
      james_notes: carlosNotes, // Reusing james_notes column for Carlos
      synthesis: synthesis || null,
      status: synthesis ? 'complete' : 'in_progress'
    }).eq('id', syncId);
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Oriel-Carlos connected");
    },
    onDisconnect: async () => {
      console.log("Kyle Oriel-Carlos disconnected, phase:", currentPhaseRef.current);
      const phase = currentPhaseRef.current;
      
      // Handle phase transitions and save notes
      if (phase === 'oriel') {
        // Save Oriel's notes to database immediately
        if (currentSyncId) {
          const orielNotes = notes.filter(n => n.phase === 'oriel').map(n => `${n.speaker}: ${n.content}`).join('\n');
          await supabase.from('daily_syncs').update({
            oriel_notes: orielNotes
          }).eq('id', currentSyncId);
        }
        toast({
          title: "Session with Oriel complete",
          description: "Ready to talk with Carlos",
        });
      } else if (phase === 'carlos') {
        // Save Carlos's notes to database immediately
        if (currentSyncId) {
          const carlosNotes = notes.filter(n => n.phase === 'carlos').map(n => `${n.speaker}: ${n.content}`).join('\n');
          const orielNotes = notes.filter(n => n.phase === 'oriel').map(n => `${n.speaker}: ${n.content}`).join('\n');
          await supabase.from('daily_syncs').update({
            oriel_notes: orielNotes,
            james_notes: carlosNotes // Reusing james_notes column for Carlos
          }).eq('id', currentSyncId);
        }
        toast({
          title: "Session with Carlos complete",
          description: "Kyle is synthesizing the plan",
        });
        setCurrentPhase('synthesis');
      }
    },
    onMessage: async (message) => {
      const phase = currentPhaseRef.current;
      console.log("Kyle Oriel-Carlos message (phase:", phase, "):", message);
      
      // Capture conversation notes
      if (message.source === 'user' && typeof message.message === 'string') {
        const speakerName = phase === 'oriel' ? 'Oriel' : phase === 'carlos' ? 'Carlos' : 'User';
        const content = message.message as string;
        
        setNotes(prev => [...prev, {
          phase: phase,
          speaker: speakerName,
          content,
          timestamp: new Date()
        }]);
        
        // Save to database
        if (currentSyncId) {
          saveMessage(currentSyncId, phase, speakerName, content);
        }
      } else if (message.source === 'ai' && typeof message.message === 'string') {
        const content = message.message as string;
        
        setNotes(prev => [...prev, {
          phase: phase,
          speaker: 'Kyle',
          content,
          timestamp: new Date()
        }]);
        
        // Save to database
        if (currentSyncId) {
          saveMessage(currentSyncId, phase, 'Kyle', content);
        }
      }
    },
    onError: (error) => {
      console.error("Kyle Oriel-Carlos error:", error);
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

  // Handle file uploads for Carlos
  const handleCarlosFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    setCarlosFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Files uploaded",
      description: `${newFiles.length} file(s) added to Carlos's session`,
    });
  };

  const startSessionWithOriel = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create sync session in database
      const syncId = await createSyncSession();
      if (!syncId) {
        console.warn("Could not create sync session, continuing without persistence");
      }

      setCurrentPhase("oriel");
      setNotes([]);
      resetAndStartTimer(); // Start 3-minute timer

      // Build dynamic prompt with previous context
      const contextInfo = previousContext 
        ? `\n\n## Previous sessions context:\n${previousContext}` 
        : '';
      
      const filesContext = orielFiles.length > 0 
        ? `\n\n## Oriel's files:\n${orielFiles.map(f => `- ${f.name}: ${f.content}`).join('\n')}` 
        : '';
      
      const kbContext = knowledgeBase 
        ? `\n\n## Knowledge base:\n${knowledgeBase.substring(0, 1000)}` 
        : '';

      console.log("Starting session with context:", { 
        hasContext: !!previousContext, 
        hasFiles: orielFiles.length > 0, 
        hasKB: !!knowledgeBase 
      });

      await conversation.startSession({
        agentId: KYLE_ORIEL_CARLOS_AGENT_ID,
        connectionType: "webrtc",
      });

      toast({
        title: "⏱️ Oriel's session started",
        description: "3 minutes to share whatever you want",
      });
    } catch (err) {
      console.error("Failed to start Oriel session:", err);
      toast({
        title: "Error",
        description: "Could not start the conversation. Check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [conversation, toast, knowledgeBase, orielFiles, orielLanguage, previousContext, pastSyncs]);

  const startSessionWithCarlos = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const orielNotes = notes
        .filter((n) => n.phase === "oriel")
        .map((n) => `${n.speaker}: ${n.content}`)
        .join("\n");
      setOrielSummary(orielNotes);

      setCurrentPhase("carlos");
      resetAndStartTimer(); // Start 3-minute timer

      const filesContext = carlosFiles.length > 0 
        ? `\n\n## Carlos's files:\n${carlosFiles.map(f => `- ${f.name}: ${f.content}`).join('\n')}` 
        : '';
      
      const kbContext = knowledgeBase 
        ? `\n\n## Knowledge base:\n${knowledgeBase.substring(0, 1000)}` 
        : '';

      await conversation.startSession({
        agentId: KYLE_ORIEL_CARLOS_AGENT_ID,
        connectionType: "webrtc",
      });

      toast({
        title: "⏱️ Carlos's session started",
        description: "3 minutes to share whatever you want",
      });
    } catch (err) {
      console.error("Failed to start Carlos session:", err);
      toast({
        title: "Error",
        description: "Could not start the conversation. Check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [conversation, notes, toast, knowledgeBase, carlosFiles, previousContext]);

  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false);

  const generateSynthesis = useCallback(async () => {
    setCurrentPhase('synthesis');
    setIsGeneratingSynthesis(true);
    
    const orielNotes = notes.filter(n => n.phase === 'oriel').map(n => `${n.speaker}: ${n.content}`).join('\n');
    const carlosNotes = notes.filter(n => n.phase === 'carlos').map(n => `${n.speaker}: ${n.content}`).join('\n');
    
    setOrielSummary(orielNotes);
    setCarlosSummary(carlosNotes);
    
    try {
      toast({
        title: "Generating Synthesis...",
        description: "Processing... (usually 5-10 seconds)",
      });

      const { data, error } = await supabase.functions.invoke('gtm-synthesis', {
        body: { 
          orielNotes, 
          jamesNotes: carlosNotes, // Reusing the same edge function
          knowledgeBase 
        }
      });

      if (error) throw error;

      if (data?.synthesis) {
        setFinalPlan(data.synthesis);
        setCurrentPhase('complete');
        
        // Save to database
        if (currentSyncId) {
          await updateSyncNotes(currentSyncId, orielNotes, carlosNotes, data.synthesis);
          loadPastSyncs(); // Refresh history
        }
        
        // Send email notification
        if (emailRecipients.length > 0) {
          try {
            await supabase.functions.invoke('send-gtm-synthesis', {
              body: {
                synthesis: data.synthesis,
                orielNotes,
                jamesNotes: carlosNotes,
                syncDate: new Date().toISOString(),
                recipients: emailRecipients
              }
            });
            toast({
              title: "Synthesis Ready!",
              description: `Sent to ${emailRecipients.length} recipient(s)`,
            });
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
            toast({
              title: "Synthesis Ready!",
              description: "Synthesis generated (email notification failed)",
            });
          }
        } else {
          toast({
            title: "Synthesis Ready!",
            description: "Synthesis generated (no recipients configured)",
          });
        }
      } else {
        throw new Error("No synthesis generated");
      }
    } catch (err) {
      console.error("Synthesis error:", err);
      toast({
        title: "Synthesis Error",
        description: err instanceof Error ? err.message : "Failed to generate synthesis",
        variant: "destructive",
      });
      setCurrentPhase('carlos'); // Go back to allow retry
    } finally {
      setIsGeneratingSynthesis(false);
    }
  }, [notes, knowledgeBase, toast, currentSyncId, emailRecipients]);

  const endCurrentSession = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Email recipient management
  const addEmailRecipient = () => {
    const email = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) return;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    if (emailRecipients.includes(email)) {
      toast({
        title: "Duplicate email",
        description: "This email is already in the list",
        variant: "destructive"
      });
      return;
    }
    
    setEmailRecipients(prev => [...prev, email]);
    setNewEmail('');
    toast({
      title: "Recipient added",
      description: email
    });
  };

  const removeEmailRecipient = (email: string) => {
    setEmailRecipients(prev => prev.filter(e => e !== email));
  };

  const resetDaily = () => {
    setCurrentPhase('idle');
    setCurrentSyncId(null);
    setNotes([]);
    setOrielSummary("");
    setCarlosSummary("");
    setFinalPlan("");
  };

  const loadPastSync = async (syncId: string) => {
    // Load sync metadata
    const { data: sync } = await supabase
      .from('daily_syncs')
      .select('*')
      .eq('id', syncId)
      .single();
    
    // Load conversation messages
    const { data: messages } = await supabase
      .from('sync_messages')
      .select('*')
      .eq('sync_id', syncId)
      .order('timestamp', { ascending: true });
    
    if (sync) {
      setSelectedPastSync(sync);
      
      let orielNotes = sync.oriel_notes || "";
      let carlosNotes = sync.james_notes || ""; // Reusing james_notes for Carlos
      
      if (messages && messages.length > 0) {
        if (!orielNotes) {
          orielNotes = messages
            .filter(m => m.phase === 'oriel')
            .map(m => `${m.speaker}: ${m.content}`)
            .join('\n');
        }
        if (!carlosNotes) {
          carlosNotes = messages
            .filter(m => m.phase === 'carlos')
            .map(m => `${m.speaker}: ${m.content}`)
            .join('\n');
        }
        
        const loadedNotes: ConversationNote[] = messages.map(m => ({
          phase: m.phase,
          speaker: m.speaker,
          content: m.content,
          timestamp: new Date(m.timestamp)
        }));
        setNotes(loadedNotes);
      }
      
      setOrielSummary(orielNotes);
      setCarlosSummary(carlosNotes);
      setFinalPlan(sync.synthesis || "");
      setCurrentPhase('complete');
      setCurrentSyncId(sync.id);
      
      toast({
        title: "Past sync loaded",
        description: `Sync from ${new Date(sync.sync_date).toLocaleDateString()} - ${messages?.length || 0} messages`,
      });
    }
  };

  // View full transcript for a past sync
  const viewTranscript = async (sync: any) => {
    try {
      const { data: messages } = await supabase
        .from('sync_messages')
        .select('*')
        .eq('sync_id', sync.id)
        .order('timestamp', { ascending: true });
      
      setTranscriptMessages(messages || []);
      setTranscriptSyncDate(sync.sync_date);
      setTranscriptDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error loading transcript",
        description: "Could not load conversation messages",
        variant: "destructive"
      });
    }
  };

  // Re-run synthesis on a past sync
  const rerunSynthesis = async (sync: any) => {
    setCurrentSyncId(sync.id);
    setCurrentPhase('synthesis');
    setIsGeneratingSynthesis(true);
    setShowHistory(false);
    
    try {
      let orielNotes = sync.oriel_notes || "";
      let carlosNotes = sync.james_notes || "";
      
      if (!orielNotes || !carlosNotes) {
        const { data: messages } = await supabase
          .from('sync_messages')
          .select('*')
          .eq('sync_id', sync.id)
          .order('timestamp', { ascending: true });
        
        if (messages && messages.length > 0) {
          if (!orielNotes) {
            orielNotes = messages
              .filter(m => m.phase === 'oriel')
              .map(m => `${m.speaker}: ${m.content}`)
              .join('\n');
          }
          if (!carlosNotes) {
            carlosNotes = messages
              .filter(m => m.phase === 'carlos')
              .map(m => `${m.speaker}: ${m.content}`)
              .join('\n');
          }
          
          if (orielNotes || carlosNotes) {
            await supabase.from('daily_syncs').update({
              oriel_notes: orielNotes || null,
              james_notes: carlosNotes || null
            }).eq('id', sync.id);
          }
        }
      }
      
      if (!orielNotes && !carlosNotes) {
        toast({
          title: "Cannot re-analyze",
          description: "This sync has no conversation notes or messages",
          variant: "destructive"
        });
        setCurrentPhase('idle');
        setIsGeneratingSynthesis(false);
        return;
      }

      setOrielSummary(orielNotes);
      setCarlosSummary(carlosNotes);
      
      toast({
        title: "Re-analyzing sync...",
        description: `Processing ${new Date(sync.sync_date).toLocaleDateString()}`,
      });

      const { data, error } = await supabase.functions.invoke('gtm-synthesis', {
        body: { 
          orielNotes, 
          jamesNotes: carlosNotes, 
          knowledgeBase 
        }
      });

      if (error) throw error;

      if (data?.synthesis) {
        setFinalPlan(data.synthesis);
        setCurrentPhase('complete');
        
        await supabase.from('daily_syncs').update({
          synthesis: data.synthesis,
          status: 'complete'
        }).eq('id', sync.id);
        
        loadPastSyncs();
        
        if (emailRecipients.length > 0) {
          try {
            await supabase.functions.invoke('send-gtm-synthesis', {
              body: {
                synthesis: data.synthesis,
                orielNotes: sync.oriel_notes || '',
                jamesNotes: sync.james_notes || '',
                syncDate: sync.sync_date,
                recipients: emailRecipients
              }
            });
            toast({
              title: "Re-analysis Complete!",
              description: `New synthesis sent to ${emailRecipients.length} recipient(s)`,
            });
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
            toast({
              title: "Re-analysis Complete!",
              description: "New synthesis generated (email failed)",
            });
          }
        } else {
          toast({
            title: "Re-analysis Complete!",
            description: "New synthesis generated",
          });
        }
      }
    } catch (err) {
      console.error("Re-analysis error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to re-analyze",
        variant: "destructive",
      });
      setCurrentPhase('complete');
    } finally {
      setIsGeneratingSynthesis(false);
    }
  };

  const createKyleOrielCarlosAgent = async () => {
    try {
      toast({
        title: "Creating Kyle Oriel-Carlos agent...",
        description: "This may take a moment",
      });
      
      const { data, error } = await supabase.functions.invoke('create-kyle-oriel-carlos-agent', {
        body: {}
      });
      
      if (error) throw error;
      
      toast({
        title: "Kyle Oriel-Carlos Agent Created!",
        description: `Agent ID: ${data.agent_id}. Update KYLE_ORIEL_CARLOS_AGENT_ID in code.`,
      });
      
      console.log("New Kyle Oriel-Carlos Agent ID:", data.agent_id);
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
    const phases: ConversationPhase[] = ['idle', 'oriel', 'carlos', 'synthesis', 'complete'];
    const currentIndex = phases.indexOf(currentPhase);
    const phaseIndex = phases.indexOf(phase);
    
    if (phaseIndex < currentIndex) return 'complete';
    if (phaseIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Thought Synthesizer
            </h1>
            <p className="text-muted-foreground mt-2">
              3 min each → Kyle finds patterns → Enriched document
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { phase: 'oriel' as ConversationPhase, label: 'Oriel (3 min)', icon: Users },
            { phase: 'carlos' as ConversationPhase, label: 'Carlos (3 min)', icon: Users },
            { phase: 'synthesis' as ConversationPhase, label: 'Analysis', icon: MessageSquare },
            { phase: 'complete' as ConversationPhase, label: 'Document', icon: CheckCircle2 },
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
                Kyle
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
              
              {/* 3-minute Timer */}
              {(currentPhase === 'oriel' || currentPhase === 'carlos') && conversation.status === 'connected' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  sessionTimer <= 30 
                    ? 'bg-destructive/20 border-destructive text-destructive animate-pulse' 
                    : sessionTimer <= 60 
                      ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                      : 'bg-primary/20 border-primary text-primary'
                }`}>
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold font-mono">{formatTimer(sessionTimer)}</span>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground text-center">
                {isLoadingContext && "Loading previous sessions..."}
                {!isLoadingContext && currentPhase === 'idle' && "Ready to start - 3 min each"}
                {currentPhase === 'oriel' && (conversation.isSpeaking ? "Kyle listening..." : "Oriel speaking...")}
                {currentPhase === 'carlos' && (conversation.isSpeaking ? "Kyle listening..." : "Carlos speaking...")}
                {currentPhase === 'synthesis' && "Analyzing patterns and generating document..."}
                {currentPhase === 'complete' && "Enriched document ready!"}
              </p>

              {/* View Past Syncs */}
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4 mr-2" />
                {showHistory ? "Hide History" : "View Past Syncs"} ({pastSyncs.length})
              </Button>

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                {currentPhase === 'idle' && !isLoadingContext && (
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

                      {/* Carlos's Files */}
                      <div className="space-y-1">
                        <input
                          type="file"
                          ref={carlosFileInputRef}
                          onChange={handleCarlosFileUpload}
                          accept=".pdf,.txt,.mp3,.mp4,.wav,.m4a"
                          multiple
                          className="hidden"
                        />
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => carlosFileInputRef.current?.click()}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Carlos Files
                        </Button>
                        {carlosFiles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {carlosFiles.map((f, i) => (
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

                    {/* Email Recipients */}
                    <div className="space-y-2 border border-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Email Recipients</span>
                      </div>
                      
                      {/* Current recipients */}
                      <div className="flex flex-wrap gap-1">
                        {emailRecipients.map((email) => (
                          <Badge key={email} variant="secondary" className="text-xs flex items-center gap-1">
                            {email.length > 20 ? `${email.substring(0, 20)}...` : email}
                            <button
                              onClick={() => removeEmailRecipient(email)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Add new recipient */}
                      <div className="flex gap-1">
                        <Input
                          type="email"
                          placeholder="Add email..."
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addEmailRecipient()}
                          className="h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addEmailRecipient}
                          className="h-8 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Start Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={startSessionWithOriel}
                      >
                         <Timer className="w-4 h-4 mr-2" />
                        I am Oriel (3 min)
                      </Button>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={startSessionWithCarlos}
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        I am Carlos (3 min)
                      </Button>
                    </div>
                  </>
                )}
                
                {currentPhase === 'oriel' && conversation.status === 'connected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={endCurrentSession}
                  >
                    I'm done with my session
                  </Button>
                )}
                
                {currentPhase === 'oriel' && conversation.status === 'disconnected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={startSessionWithCarlos}
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Now Carlos (3 min)
                  </Button>
                )}
                
                {currentPhase === 'carlos' && conversation.status === 'connected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={endCurrentSession}
                  >
                    I'm done with my session
                  </Button>
                )}
                
                {currentPhase === 'carlos' && conversation.status === 'disconnected' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={generateSynthesis}
                    disabled={isGeneratingSynthesis}
                  >
                    {isGeneratingSynthesis ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Analyzing patterns...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Generate Enriched Document
                      </>
                    )}
                  </Button>
                )}
                
                {currentPhase === 'synthesis' && (
                  <div className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Kyle analyzing patterns and generating document...
                  </div>
                )}
                
                {currentPhase === 'complete' && (
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={resetDaily}
                  >
                    New Session
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
                      {knowledgeBase ? "Knowledge Base Loaded ✓" : "Upload Knowledge Base"}
                    </Button>
                    
                    {/* Admin: Create Kyle Agent */}
                    <Button 
                      className="w-full"
                      variant="ghost"
                      size="sm"
                      onClick={createKyleOrielCarlosAgent}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Create Kyle Oriel-Carlos Agent
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Past Syncs History */}
          {showHistory && pastSyncs.length > 0 && (
            <Card className="bg-card/50 border-primary/20 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Past Daily Syncs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {pastSyncs.map((sync) => (
                  <div 
                    key={sync.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedPastSync?.id === sync.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => loadPastSync(sync.id)}
                      >
                        <span className="font-medium text-foreground">
                          {new Date(sync.sync_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={sync.status === 'complete' ? 'default' : 'secondary'}>
                          {sync.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewTranscript(sync);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Transcript
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            rerunSynthesis(sync);
                          }}
                          disabled={isGeneratingSynthesis}
                        >
                          {isGeneratingSynthesis && selectedPastSync?.id === sync.id ? (
                            <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <>
                              <BarChart3 className="w-3 h-3 mr-1" />
                              Re-analyze
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {sync.synthesis && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {sync.synthesis.substring(0, 150)}...
                      </p>
                    )}
                    {(sync.oriel_notes || sync.james_notes) && !sync.synthesis && (
                      <p className="text-sm text-muted-foreground/60 mt-2 italic">
                        Has notes but no synthesis yet
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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

        {/* Final Plan */}
        {finalPlan && (
          <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Synthesis
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

      {/* Transcript Dialog */}
      <Dialog open={transcriptDialogOpen} onOpenChange={setTranscriptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Conversation Transcript
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {transcriptSyncDate && new Date(transcriptSyncDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            {transcriptMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No conversation messages found for this sync
              </p>
            ) : (
              <div className="space-y-3">
                {transcriptMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      msg.speaker === 'Kyle' 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={msg.phase === 'oriel' ? 'default' : 'secondary'}>
                        {msg.phase}
                      </Badge>
                      <span className="font-medium text-foreground">{msg.speaker}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyOrielCarlos;
