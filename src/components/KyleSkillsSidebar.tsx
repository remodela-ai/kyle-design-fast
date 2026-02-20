import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, X, ChevronLeft, ChevronRight, Loader2, Mail, Calendar, FileText, MessageSquare, Settings, Wand2 } from "lucide-react";
import { useKyleSkills, KYLE_SKILLS, KyleSkill } from "@/contexts/KyleSkillsContext";
import { useCustomSkills } from "@/hooks/useCustomSkills";
import { useNavigate } from "react-router-dom";
import { useKyleAgentActions } from "@/hooks/useKyleAgentActions";
import { useKyleVoiceAgent } from "@/hooks/useKyleVoiceAgent";
import { useKyleConnectors, ConnectorType } from "@/hooks/useKyleConnectors";
import { AudioWaves } from "@/components/AudioWaves";
import kyleAvatar from "@/assets/kyle-avatar.jpeg";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const CONNECTOR_ICONS: Record<ConnectorType, React.ElementType> = {
  gmail: Mail,
  google_calendar: Calendar,
  notion: FileText,
  slack: MessageSquare,
  github: () => <span className="text-xs">🐙</span>,
  google_drive: () => <span className="text-xs">📁</span>,
};

export function KyleSkillsSidebar() {
  const {
    activeSkill,
    isSkillMode,
    activateSkill,
    deactivateSkill,
    isSidebarOpen,
    toggleSidebar,
  } = useKyleSkills();

  const { executeTask, isProcessing, activeTasks } = useKyleAgentActions();
  const { 
    isConnected, 
    isSpeaking, 
    toggleConversation, 
    error 
  } = useKyleVoiceAgent();
  
  const { getActiveConnectorTypes, connectors } = useKyleConnectors();
  const { readySkills } = useCustomSkills();
  const navigate = useNavigate();

  const [pendingCommand, setPendingCommand] = useState<string>("");

  const activeConnectorTypes = getActiveConnectorTypes();

  const handleSkillClick = useCallback((skill: KyleSkill) => {
    if (activeSkill?.id === skill.id) {
      deactivateSkill();
    } else {
      activateSkill(skill);
    }
  }, [activeSkill, activateSkill, deactivateSkill]);

  const handleExecuteWithSkill = useCallback(async () => {
    if (!activeSkill || !pendingCommand.trim()) return;
    
    await executeTask(pendingCommand, undefined, activeSkill.actionType);
    setPendingCommand("");
    deactivateSkill();
  }, [activeSkill, pendingCommand, executeTask, deactivateSkill]);

  const workingTasks = activeTasks.filter(t => t.status === 'working' || t.status === 'pending');

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-50",
          "bg-primary text-primary-foreground",
          "p-2 rounded-l-lg shadow-lg",
          "hover:bg-primary/90 transition-all",
          "flex items-center gap-1",
          isSidebarOpen && "opacity-0 pointer-events-none"
        )}
      >
        <span className="text-lg">✨</span>
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full z-40",
          "bg-card border-l border-border shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          "w-80",
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={kyleAvatar} 
              alt="Kyle" 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
            />
            <div>
              <h2 className="font-semibold text-foreground">Kyle Skills</h2>
              <p className="text-xs text-muted-foreground">
                {isSkillMode ? `Mode: ${activeSkill?.name}` : "Select a skill"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="p-4 space-y-4">
            {/* Skill Builder Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-primary/30 hover:bg-primary/10"
              onClick={() => { navigate("/skill-builder"); toggleSidebar(); }}
            >
              <Wand2 className="w-4 h-4 text-primary" />
              Skill Builder
            </Button>
            {/* Connected Tools Indicator */}
            {activeConnectorTypes.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tools:</span>
                  <div className="flex gap-1">
                    {activeConnectorTypes.map((type) => {
                      const Icon = CONNECTOR_ICONS[type];
                      return (
                        <div 
                          key={type}
                          className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center"
                          title={type}
                        >
                          <Icon className="w-3 h-3 text-primary" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Link 
                  to="/kustr-next/kyle-connectors"
                  className="text-xs text-primary hover:underline"
                >
                  Configure
                </Link>
              </div>
            )}

            {/* No Connectors Warning */}
            {connectors.length === 0 && (
              <Link 
                to="/kustr-next/kyle-connectors"
                className="block p-3 rounded-lg bg-accent border border-border hover:bg-accent/80 transition-colors"
              >
                <div className="flex items-center gap-2 text-foreground">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Connect your tools</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kyle can do more when you connect Gmail, Calendar, etc.
                </p>
              </Link>
            )}

            {/* Skills Grid */}
            <div className="grid grid-cols-2 gap-2">
              {KYLE_SKILLS.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleSkillClick(skill)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    "hover:shadow-md hover:scale-[1.02]",
                    activeSkill?.id === skill.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl block mb-2">{skill.icon}</span>
                  <span className="font-medium text-sm text-foreground block">
                    {skill.name}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {skill.description}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Skills */}
            {readySkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Custom</p>
                <div className="grid grid-cols-2 gap-2">
                  {readySkills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => navigate(`/skills/${skill.id}`)}
                      className="p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all text-left hover:shadow-md hover:scale-[1.02]"
                    >
                      <span className="text-2xl block mb-2">{skill.icon}</span>
                      <span className="font-medium text-sm text-foreground block">
                        {skill.name}
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {skill.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Skill Mode */}
            {isSkillMode && (
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeSkill?.icon}</span>
                    <span className="font-medium text-foreground">
                      {activeSkill?.name} active
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={deactivateSkill}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Talk to Kyle naturally to describe what you need.
                </p>

                {/* Voice Control */}
                <div className="flex flex-col items-center gap-3">
                  <Button
                    onClick={toggleConversation}
                    size="lg"
                    className={cn(
                      "rounded-full w-16 h-16",
                      isConnected 
                        ? "bg-destructive hover:bg-destructive/90" 
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {isConnected ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </Button>
                  
                  {isConnected && (
                    <AudioWaves 
                      isActive={isConnected} 
                      isSpeaking={isSpeaking} 
                      barCount={5} 
                      className="h-6" 
                    />
                  )}
                  
                  <span className="text-xs text-muted-foreground">
                    {isConnected 
                      ? isSpeaking ? "Kyle speaking..." : "Listening..." 
                      : "Tap to talk"
                    }
                  </span>
                </div>

                {/* Text Input Alternative */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    or type your request:
                  </p>
                  <textarea
                    value={pendingCommand}
                    onChange={(e) => setPendingCommand(e.target.value)}
                    placeholder={`Describe what you want to ${activeSkill?.name.toLowerCase()}...`}
                    className="w-full h-20 p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button 
                    onClick={handleExecuteWithSkill}
                    disabled={!pendingCommand.trim() || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">{activeSkill?.icon}</span>
                        Execute {activeSkill?.name}
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <p className="text-xs text-destructive text-center">{error}</p>
                )}
              </div>
            )}

            {/* Active Tasks */}
            {workingTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kyle is working
                </h3>
                {workingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <p className="text-sm text-foreground line-clamp-2">
                      {task.command}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.status === 'pending' ? 'Queued...' : 'Processing...'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Tips */}
            {!isSkillMode && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-medium text-foreground">💡 Tips</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Select a skill and talk naturally</li>
                  <li>• Kyle processes your request automatically</li>
                  <li>• Connect tools for more capabilities</li>
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
