import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useKyleSkills, KYLE_SKILLS, KyleSkill } from "@/contexts/KyleSkillsContext";
import { useKyleAgentActions } from "@/hooks/useKyleAgentActions";
import { useKyleVoiceAgent } from "@/hooks/useKyleVoiceAgent";
import { AudioWaves } from "@/components/AudioWaves";
import kyleAvatar from "@/assets/kyle-avatar.jpeg";
import { cn } from "@/lib/utils";

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

  const [pendingCommand, setPendingCommand] = useState<string>("");

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
                {isSkillMode ? `Modo: ${activeSkill?.name}` : "Selecciona una habilidad"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="p-4 space-y-4">
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

            {/* Active Skill Mode */}
            {isSkillMode && (
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeSkill?.icon}</span>
                    <span className="font-medium text-foreground">
                      {activeSkill?.name} activo
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
                  Habla con Kyle naturalmente para describir lo que necesitas.
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
                      ? isSpeaking ? "Kyle habla..." : "Escuchando..." 
                      : "Toca para hablar"
                    }
                  </span>
                </div>

                {/* Text Input Alternative */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    o escribe tu solicitud:
                  </p>
                  <textarea
                    value={pendingCommand}
                    onChange={(e) => setPendingCommand(e.target.value)}
                    placeholder={`Describe qué quieres ${activeSkill?.name.toLowerCase()}...`}
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
                        Procesando...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">{activeSkill?.icon}</span>
                        Ejecutar {activeSkill?.name}
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
                  Kyle está trabajando
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
                      {task.status === 'pending' ? 'En cola...' : 'Procesando...'}
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
                  <li>• Selecciona un skill y habla naturalmente</li>
                  <li>• Kyle procesa tu solicitud automáticamente</li>
                  <li>• Los resultados aparecerán cuando estén listos</li>
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
