import { useState, useEffect, useCallback } from "react";
import { useOnboardingAgent } from "@/hooks/useOnboardingAgent";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { User, CheckCircle, Loader2, Volume2, Mic, ChevronRight, RotateCcw } from "lucide-react";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";

const TOTAL_SESSIONS = 3;

interface PersonProfile {
  id?: string;
  person_name: string;
  communication_style?: string;
  priorities?: string[];
  frustrations?: string[];
  strengths?: string[];
  decision_style?: string;
  feedback_preferences?: string;
  work_style?: string;
  values_and_motivations?: string;
  personality_summary?: string;
  onboarding_completed: boolean;
  sessions_completed: number;
}

export default function Onboarding() {
  const [selectedPerson, setSelectedPerson] = useState<'oriel' | 'carlos' | null>(null);
  const [currentSession, setCurrentSession] = useState(1);
  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [isRecovering, setIsRecovering] = useState(false);

  const personName = selectedPerson === 'oriel' ? 'Oriel' : selectedPerson === 'carlos' ? 'Carlos' : '';
  
  const {
    status,
    isSpeaking,
    isConnected,
    isCreatingAgent,
    error,
    sessionFocus,
    messages,
    createOnboardingAgent,
    startConversation,
    stopConversation,
    getTranscript,
    extractInsights,
  } = useOnboardingAgent(personName);

  // Load existing profile when person is selected
  useEffect(() => {
    if (!selectedPerson) return;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('person_profiles')
          .select('*')
          .eq('person_name', personName)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setProfile(data as PersonProfile);
          setCurrentSession(data.sessions_completed + 1);
        } else {
          // Create new profile
          const newProfile: PersonProfile = {
            person_name: personName,
            onboarding_completed: false,
            sessions_completed: 0
          };
          setProfile(newProfile);
          setCurrentSession(1);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        toast.error('Error loading profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [selectedPerson, personName]);

  const handleStartSession = async () => {
    if (!profile) return;

    const existingInsights = profile.id ? {
      communication_style: profile.communication_style,
      priorities: profile.priorities,
      work_style: profile.work_style,
      values_and_motivations: profile.values_and_motivations
    } : null;

    const agentId = await createOnboardingAgent(currentSession, existingInsights, language);
    if (agentId) {
      await startConversation(agentId);
    }
  };

  const handleEndSession = async () => {
    await stopConversation();
    setSessionComplete(true);
  };

  const handleSaveAndContinue = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      // Extract insights from the conversation
      const existingProfile = profile.id ? profile : null;
      const insights = await extractInsights(currentSession, existingProfile);

      // Save session transcript
      const transcript = getTranscript();
      await supabase.from('onboarding_sessions').insert({
        person_name: personName,
        session_number: currentSession,
        conversation_transcript: transcript,
        extracted_insights: insights,
        session_focus: sessionFocus
      });

      // Update or create profile
      const updatedProfile = {
        person_name: personName,
        communication_style: insights?.communication_style || profile.communication_style,
        priorities: insights?.priorities || profile.priorities,
        frustrations: insights?.frustrations || profile.frustrations,
        strengths: insights?.strengths || profile.strengths,
        decision_style: insights?.decision_style || profile.decision_style,
        feedback_preferences: insights?.feedback_preferences || profile.feedback_preferences,
        work_style: insights?.work_style || profile.work_style,
        values_and_motivations: insights?.values_and_motivations || profile.values_and_motivations,
        personality_summary: insights?.personality_summary || profile.personality_summary,
        sessions_completed: currentSession,
        onboarding_completed: currentSession >= TOTAL_SESSIONS,
      };

      if (profile.id) {
        await supabase
          .from('person_profiles')
          .update(updatedProfile)
          .eq('id', profile.id);
      } else {
        const { data } = await supabase
          .from('person_profiles')
          .insert(updatedProfile)
          .select()
          .single();
        if (data) setProfile(data as PersonProfile);
      }

      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);

      if (currentSession >= TOTAL_SESSIONS) {
        toast.success(`¡Onboarding de ${personName} completado!`);
      } else {
        setCurrentSession(prev => prev + 1);
        setSessionComplete(false);
        toast.success(`Sesión ${currentSession} guardada`);
      }
    } catch (err) {
      console.error('Error saving session:', err);
      toast.error('Error saving session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKyleClick = () => {
    if (isConnected) {
      handleEndSession();
    }
  };

  const handleRecoverConversations = async () => {
    setIsRecovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('recover-elevenlabs-conversation', {
        body: { 
          personName: personName || undefined,
        }
      });

      if (error) throw error;

      if (data.recovered > 0) {
        toast.success(`${data.recovered} conversaciones recuperadas de ${data.totalFound} encontradas`);
      } else if (data.totalFound > 0) {
        toast.info(`${data.totalFound} conversaciones encontradas, pero ya estaban guardadas`);
      } else {
        toast.info('No se encontraron conversaciones recientes para recuperar');
      }
    } catch (err) {
      console.error('Error recovering conversations:', err);
      toast.error('Error al recuperar conversaciones');
    } finally {
      setIsRecovering(false);
    }
  };

  // Person selection screen
  if (!selectedPerson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Kyle Onboarding</CardTitle>
            <p className="text-muted-foreground mt-2">
              Select who is doing the onboarding session with Kyle
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-16 text-lg justify-start gap-4 hover:bg-primary/10 hover:border-primary"
              onClick={() => setSelectedPerson('oriel')}
            >
              <User className="h-6 w-6 text-primary" />
              <span>I am Oriel</span>
              <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="w-full h-16 text-lg justify-start gap-4 hover:bg-primary/10 hover:border-primary"
              onClick={() => setSelectedPerson('carlos')}
            >
              <User className="h-6 w-6 text-primary" />
              <span>I am Carlos</span>
              <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading profile
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Onboarding completed
  if (profile?.onboarding_completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Onboarding Complete!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Kyle has learned about {personName} and can now represent them in conversations.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Profile Summary</h4>
              <p className="text-sm text-muted-foreground">
                {profile.personality_summary || 'Profile being analyzed...'}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedPerson(null)}
            >
              Back to Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Onboarding: {personName}</h1>
            <p className="text-sm text-muted-foreground">
              Session {currentSession} of {TOTAL_SESSIONS}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={language === 'es' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('es')}
              disabled={isConnected}
            >
              ES
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              disabled={isConnected}
            >
              EN
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium ml-auto">
            {Math.round(((currentSession - 1) / TOTAL_SESSIONS) * 100)}%
          </span>
        </div>
        <Progress value={((currentSession - 1) / TOTAL_SESSIONS) * 100} className="h-2" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Kyle Avatar */}
        <div 
          className="cursor-pointer"
          onClick={handleKyleClick}
        >
          <KyleAvatar 
            size="xl" 
            isConnectedOverride={isConnected} 
            isSpeakingOverride={isSpeaking}
          />
        </div>

        {/* Audio waves when active */}
        {isConnected && (
          <AudioWaves isActive={true} isSpeaking={isSpeaking} />
        )}

        {/* Status */}
        <div className="text-center space-y-2">
          {!isConnected && !sessionComplete && (
            <>
              <p className="text-lg font-medium">
                {sessionFocus || `Ready for Session ${currentSession}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Tap Kyle or click the button below to start
              </p>
            </>
          )}
          
          {isConnected && (
            <div className="flex items-center gap-2 justify-center">
              {isSpeaking ? (
                <>
                  <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                  <span>Kyle is speaking...</span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 text-primary animate-pulse" />
                  <span>Listening to {personName}...</span>
                </>
              )}
            </div>
          )}

          {sessionComplete && (
            <p className="text-lg font-medium text-green-500">
              Session {currentSession} complete!
            </p>
          )}
        </div>

        {/* Conversation preview */}
        {messages.length > 0 && (
          <div className="w-full max-w-md max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3 space-y-2">
            {messages.slice(-4).map((msg, idx) => (
              <div 
                key={idx}
                className={`text-sm ${msg.role === 'user' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <span className="font-medium">{msg.role === 'user' ? personName : 'Kyle'}:</span>{' '}
                {msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 w-full max-w-xs">
          {!isConnected && !sessionComplete && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleStartSession}
              disabled={isCreatingAgent}
            >
              {isCreatingAgent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                `Start Session ${currentSession}`
              )}
            </Button>
          )}

          {isConnected && (
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          )}

          {sessionComplete && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSaveAndContinue}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentSession >= TOTAL_SESSIONS ? (
                'Complete Onboarding'
              ) : (
                'Save & Continue'
              )}
            </Button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Footer with back button and recover */}
      <div className="p-4 border-t border-border/50 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setSelectedPerson(null)}
          disabled={isConnected}
        >
          ← Back to Selection
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecoverConversations}
          disabled={isRecovering || isConnected}
          className="gap-2"
        >
          {isRecovering ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Recuperando...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Recuperar sesiones
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
