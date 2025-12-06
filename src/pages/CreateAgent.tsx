import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function CreateAgent() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const createAgent = async (type: 'kyle' | 'shazam2' | 'shazam3') => {
    setLoading(type);
    setResult(null);
    
    try {
      const functionNames: Record<string, string> = {
        kyle: 'create-kyle-agent',
        shazam2: 'create-shazam2-agent',
        shazam3: 'create-shazam3-agent',
      };
      const { data, error } = await supabase.functions.invoke(functionNames[type]);
      
      if (error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold text-foreground">Create Voice Agents</h1>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={() => createAgent('kyle')} disabled={loading !== null}>
          {loading === 'kyle' ? "Creating..." : "Create Kyle Agent"}
        </Button>
        
        <Button onClick={() => createAgent('shazam2')} disabled={loading !== null} variant="secondary">
          {loading === 'shazam2' ? "Creating..." : "Create Shazam 2 Agent"}
        </Button>
        
        <Button onClick={() => createAgent('shazam3')} disabled={loading !== null} variant="outline">
          {loading === 'shazam3' ? "Creating..." : "Create Shazam 3 Agent"}
        </Button>
      </div>
      
      {result && (
        <pre className="bg-muted p-4 rounded-lg max-w-2xl overflow-auto text-sm">
          {result}
        </pre>
      )}
      
      <p className="text-muted-foreground text-sm max-w-md text-center">
        After creating, copy the agent_id and update the corresponding hook with the new ID.
      </p>
    </div>
  );
}
