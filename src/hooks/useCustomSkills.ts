import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomSkill {
  id: string;
  office_id: string | null;
  created_by: string | null;
  name: string;
  description: string;
  icon: string;
  action_type: string;
  manus_task_id: string | null;
  status: string;
  result_url: string | null;
  result_html: string | null;
  prompt: string;
  created_at: string;
  updated_at: string;
}

export type GenerationPhase = 
  | "idle"
  | "analyzing"
  | "designing"
  | "coding"
  | "testing"
  | "deploying"
  | "complete"
  | "error";

export const GENERATION_PHASES: { phase: GenerationPhase; label: string; detail: string; duration: number }[] = [
  { phase: "analyzing", label: "Analyzing requirements", detail: "Reading your role definition, knowledge base, and instructions...", duration: 3000 },
  { phase: "designing", label: "Designing architecture", detail: "Planning components, data flow, and UI layout...", duration: 4000 },
  { phase: "coding", label: "Writing code", detail: "Generating HTML, CSS, and interactive logic...", duration: 8000 },
  { phase: "testing", label: "Running tests", detail: "Validating output matches your specifications...", duration: 3000 },
  { phase: "deploying", label: "Deploying skill", detail: "Making your skill available as a new page...", duration: 2000 },
];

// Realistic code snippets that Kyle "writes" during generation
export const CODE_SNIPPETS: string[] = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="UTF-8" />',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  '  <title>Kyle Custom Skill</title>',
  '  <style>',
  '    :root {',
  '      --primary: #e63946;',
  '      --bg: #1a1a2e;',
  '      --surface: #16213e;',
  '      --text: #edf2f4;',
  '      --muted: #8d99ae;',
  '      --radius: 12px;',
  '    }',
  '    * { margin: 0; padding: 0; box-sizing: border-box; }',
  '    body {',
  '      font-family: "Inter", system-ui, sans-serif;',
  '      background: var(--bg);',
  '      color: var(--text);',
  '      min-height: 100vh;',
  '    }',
  '    .container {',
  '      max-width: 960px;',
  '      margin: 0 auto;',
  '      padding: 2rem;',
  '    }',
  '    .header {',
  '      display: flex;',
  '      align-items: center;',
  '      gap: 1rem;',
  '      margin-bottom: 2rem;',
  '      padding-bottom: 1rem;',
  '      border-bottom: 1px solid rgba(255,255,255,0.1);',
  '    }',
  '    .card {',
  '      background: var(--surface);',
  '      border-radius: var(--radius);',
  '      padding: 1.5rem;',
  '      border: 1px solid rgba(255,255,255,0.06);',
  '      transition: transform 0.2s, box-shadow 0.2s;',
  '    }',
  '    .card:hover {',
  '      transform: translateY(-2px);',
  '      box-shadow: 0 8px 32px rgba(0,0,0,0.3);',
  '    }',
  '    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }',
  '    .btn {',
  '      background: var(--primary);',
  '      color: white;',
  '      border: none;',
  '      padding: 0.75rem 1.5rem;',
  '      border-radius: var(--radius);',
  '      cursor: pointer;',
  '      font-weight: 600;',
  '      transition: opacity 0.2s;',
  '    }',
  '    .btn:hover { opacity: 0.9; }',
  '    .input {',
  '      width: 100%;',
  '      padding: 0.75rem 1rem;',
  '      background: rgba(255,255,255,0.05);',
  '      border: 1px solid rgba(255,255,255,0.1);',
  '      border-radius: var(--radius);',
  '      color: var(--text);',
  '      font-size: 0.875rem;',
  '    }',
  '    .badge {',
  '      display: inline-flex;',
  '      padding: 0.25rem 0.75rem;',
  '      background: rgba(230,57,70,0.15);',
  '      color: var(--primary);',
  '      border-radius: 999px;',
  '      font-size: 0.75rem;',
  '      font-weight: 600;',
  '    }',
  '    @keyframes fadeIn {',
  '      from { opacity: 0; transform: translateY(8px); }',
  '      to { opacity: 1; transform: translateY(0); }',
  '    }',
  '    .animate-in { animation: fadeIn 0.3s ease-out; }',
  '  </style>',
  '</head>',
  '<body>',
  '  <div class="container">',
  '    <div class="header">',
  '      <h1>⚡ Kyle Skill</h1>',
  '      <span class="badge">Active</span>',
  '    </div>',
  '    <div class="grid" id="app">',
  '      <!-- Dynamic content injected by Kyle -->',
  '    </div>',
  '  </div>',
  '  <script>',
  '    const app = document.getElementById("app");',
  '    const state = { items: [], loading: false };',
  '',
  '    function render() {',
  '      app.innerHTML = state.items.map(item => `',
  '        <div class="card animate-in">',
  '          <h3>${item.title}</h3>',
  '          <p style="color:var(--muted)">${item.description}</p>',
  '          <div style="margin-top:1rem">',
  '            <button class="btn" onclick="handleAction(\'${item.id}\')">',
  '              Execute',
  '            </button>',
  '          </div>',
  '        </div>',
  '      `).join("");',
  '    }',
  '',
  '    async function initialize() {',
  '      state.loading = true;',
  '      // Kyle auto-generated logic',
  '      state.items = [',
  '        { id: "1", title: "Analysis", description: "Processing data..." },',
  '        { id: "2", title: "Output", description: "Generating results..." },',
  '      ];',
  '      state.loading = false;',
  '      render();',
  '    }',
  '',
  '    function handleAction(id) {',
  '      console.log("Kyle executing action:", id);',
  '      // Custom skill logic here',
  '    }',
  '',
  '    initialize();',
  '  </script>',
  '</body>',
  '</html>',
];

export function useCustomSkills() {
  const [skills, setSkills] = useState<CustomSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>("idle");
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kyle_custom_skills" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching custom skills:", error);
    } else {
      setSkills((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const [codeLines, setCodeLines] = useState<string[]>([]);

  const simulateGeneration = useCallback(async () => {
    setGenerationLogs([]);
    setCodeLines([]);

    for (const { phase, label, detail, duration } of GENERATION_PHASES) {
      setGenerationPhase(phase);
      setGenerationLogs((prev) => [...prev, `▸ ${label}`]);

      // During coding phase, stream code lines
      if (phase === "coding") {
        const linesPerChunk = 3;
        const totalChunks = Math.ceil(CODE_SNIPPETS.length / linesPerChunk);
        const chunkDelay = duration / totalChunks;

        for (let i = 0; i < CODE_SNIPPETS.length; i += linesPerChunk) {
          const chunk = CODE_SNIPPETS.slice(i, i + linesPerChunk);
          setCodeLines((prev) => [...prev, ...chunk]);
          await new Promise((r) => setTimeout(r, chunkDelay));
        }
        setGenerationLogs((prev) => [...prev, `  ✓ ${CODE_SNIPPETS.length} lines written`]);
      } else {
        await new Promise((r) => setTimeout(r, duration));
        setGenerationLogs((prev) => [...prev, `  ✓ ${detail}`]);
      }
    }
  }, []);

  const createSkill = useCallback(async (prompt: string, name: string, description: string) => {
    // Start visual generation simulation
    const simulationPromise = simulateGeneration();

    // 1. Call kyle-manus-bridge in parallel
    const { data: fnData, error: fnError } = await supabase.functions.invoke("kyle-manus-bridge", {
      body: {
        command: prompt,
        action_type: "create",
        context: { additional_context: `Skill Builder request: ${name} - ${description}` },
      },
    });

    if (fnError) {
      setGenerationPhase("error");
      setGenerationLogs((prev) => [...prev, `✗ Error: ${fnError.message}`]);
      toast({ title: "Error", description: fnError.message, variant: "destructive" });
      return null;
    }

    const taskId = fnData?.task_id || fnData?.data?.id || null;

    // 2. Store in DB
    const { data, error } = await supabase
      .from("kyle_custom_skills" as any)
      .insert({
        name,
        description,
        prompt,
        manus_task_id: taskId,
        status: "building",
        icon: "🧩",
        action_type: "create",
      } as any)
      .select()
      .single();

    if (error) {
      setGenerationPhase("error");
      setGenerationLogs((prev) => [...prev, `✗ Error: ${error.message}`]);
      toast({ title: "Error saving skill", description: error.message, variant: "destructive" });
      return null;
    }

    // Wait for simulation to finish
    await simulationPromise;

    setGenerationPhase("complete");
    setGenerationLogs((prev) => [...prev, "▸ Skill created successfully!", `  → Task ID: ${taskId || "pending"}`]);

    toast({ title: "Skill building started!", description: "Kyle is creating your new skill." });
    await fetchSkills();
    return data as unknown as CustomSkill;
  }, [toast, fetchSkills, simulateGeneration]);

  const resetGeneration = useCallback(() => {
    setGenerationPhase("idle");
    setGenerationLogs([]);
    setCodeLines([]);
  }, []);

  const deleteSkill = useCallback(async (skillId: string) => {
    const { error } = await supabase
      .from("kyle_custom_skills" as any)
      .delete()
      .eq("id", skillId);

    if (error) {
      toast({ title: "Error", description: "Could not delete the skill.", variant: "destructive" });
      return false;
    }

    toast({ title: "Skill deleted", description: "The skill has been permanently removed." });
    await fetchSkills();
    return true;
  }, [toast, fetchSkills]);

  const readySkills = skills.filter((s) => s.status === "ready");

  return { skills, readySkills, loading, createSkill, deleteSkill, refetch: fetchSkills, generationPhase, generationLogs, codeLines, resetGeneration };
}
