import { useState, useEffect } from "react";
import { Check, X, Play, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepStatus {
  verified: boolean | null; // null = not tested, true = works, false = needs fix
  notes: string;
}

interface SequenceState {
  steps: {
    kyle3: StepStatus;
    imageGeneration: StepStatus;
    kyle4: StepStatus;
    pipeline: StepStatus;
  };
  mockImage: string | null;
  lastTestedStep: number;
}

const DEFAULT_STATE: SequenceState = {
  steps: {
    kyle3: { verified: null, notes: "" },
    imageGeneration: { verified: null, notes: "" },
    kyle4: { verified: null, notes: "" },
    pipeline: { verified: null, notes: "" },
  },
  mockImage: null,
  lastTestedStep: 0,
};

const STORAGE_KEY = "kyle-sequence-debug";

// Mock placeholder image for testing
const MOCK_IMAGE_URL = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80";

interface Props {
  kyle3Connected: boolean;
  kyle4Connected: boolean;
  generatedImage: string | null;
  pipelineRunning: boolean;
  onTriggerKyle3: () => void;
  onStopKyle3: () => void;
  onTriggerImageGeneration: () => void;
  onSetMockImage: (url: string) => void;
  onTriggerKyle4: () => void;
  onStopKyle4: () => void;
  onTriggerPipeline: () => void;
  onReset: () => void;
}

export function SequenceDebugPanel({
  kyle3Connected,
  kyle4Connected,
  generatedImage,
  pipelineRunning,
  onTriggerKyle3,
  onStopKyle3,
  onTriggerImageGeneration,
  onSetMockImage,
  onTriggerKyle4,
  onStopKyle4,
  onTriggerPipeline,
  onReset,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [state, setState] = useState<SequenceState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateStepStatus = (step: keyof SequenceState["steps"], verified: boolean | null) => {
    setState(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        [step]: { ...prev.steps[step], verified },
      },
    }));
  };

  const handleUseMockImage = () => {
    onSetMockImage(MOCK_IMAGE_URL);
    setState(prev => ({ ...prev, mockImage: MOCK_IMAGE_URL }));
  };

  const handleFullReset = () => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
    onReset();
  };

  const getStepIcon = (verified: boolean | null) => {
    if (verified === true) return <Check className="h-4 w-4 text-green-500" />;
    if (verified === false) return <X className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  const steps = [
    {
      key: "kyle3" as const,
      name: "Kyle 3",
      description: "Conversación de diseño + 'Hey Kyle Generate'",
      isActive: kyle3Connected,
      actions: (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onTriggerKyle3} disabled={kyle3Connected}>
            <Play className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onStopKyle3} disabled={!kyle3Connected}>
            Stop
          </Button>
        </div>
      ),
    },
    {
      key: "imageGeneration" as const,
      name: "Generación Imagen",
      description: "Generar imagen desde conversación",
      isActive: false,
      actions: (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onTriggerImageGeneration}>
            Real
          </Button>
          <Button size="sm" variant="secondary" onClick={handleUseMockImage}>
            Mock
          </Button>
        </div>
      ),
    },
    {
      key: "kyle4" as const,
      name: "Kyle 4",
      description: "Storyteller + ofrece pipeline",
      isActive: kyle4Connected,
      actions: (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onTriggerKyle4} disabled={kyle4Connected || !generatedImage}>
            <Play className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onStopKyle4} disabled={!kyle4Connected}>
            Stop
          </Button>
        </div>
      ),
    },
    {
      key: "pipeline" as const,
      name: "Pipeline",
      description: "Visual Design Pipeline completo",
      isActive: pipelineRunning,
      actions: (
        <Button size="sm" variant="outline" onClick={onTriggerPipeline} disabled={pipelineRunning || !generatedImage}>
          <Play className="h-3 w-3 mr-1" /> Start
        </Button>
      ),
    },
  ];

  return (
    <div className="fixed top-20 right-4 z-50 bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl w-80 text-xs">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-border cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">🔧 Sequence Debug</span>
          <span className="text-muted-foreground">
            ({Object.values(state.steps).filter(s => s.verified === true).length}/4 ✓)
          </span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Steps */}
          {steps.map((step, index) => (
            <div key={step.key} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-4">{index + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${step.isActive ? 'text-primary' : 'text-foreground'}`}>
                      {step.name}
                    </span>
                    {step.isActive && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[10px]">{step.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-6">
                {/* Actions */}
                {step.actions}
                
                {/* Verify buttons */}
                <div className="flex gap-1 ml-auto">
                  <Button
                    size="sm"
                    variant={state.steps[step.key].verified === true ? "default" : "ghost"}
                    className="h-6 w-6 p-0"
                    onClick={() => updateStepStatus(step.key, state.steps[step.key].verified === true ? null : true)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={state.steps[step.key].verified === false ? "destructive" : "ghost"}
                    className="h-6 w-6 p-0"
                    onClick={() => updateStepStatus(step.key, state.steps[step.key].verified === false ? null : false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Current State Summary */}
          <div className="pt-2 border-t border-border space-y-1">
            <p className="text-muted-foreground">
              📷 Imagen: {generatedImage ? '✅ Generada' : state.mockImage ? '🎭 Mock' : '❌ Ninguna'}
            </p>
            <p className="text-muted-foreground">
              🔊 Kyle 3: {kyle3Connected ? '🟢 ON' : '⚪ OFF'} | Kyle 4: {kyle4Connected ? '🟢 ON' : '⚪ OFF'}
            </p>
          </div>

          {/* Reset Button */}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleFullReset}
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset Todo
          </Button>
        </div>
      )}
    </div>
  );
}
