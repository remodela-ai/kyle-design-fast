import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function CreateAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const createAgent = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-kyle-agent');
      
      if (error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold text-foreground">Create Kyle Blink Design Agent</h1>
      
      <Button onClick={createAgent} disabled={loading}>
        {loading ? "Creating..." : "Create Agent"}
      </Button>
      
      {result && (
        <pre className="bg-muted p-4 rounded-lg max-w-2xl overflow-auto text-sm">
          {result}
        </pre>
      )}
      
      <p className="text-muted-foreground text-sm max-w-md text-center">
        After creating, copy the agent_id and update KyleContext.tsx with the new ID.
      </p>
    </div>
  );
}
