import { useState } from "react";
import { Sparkles, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InsightsEditorProps {
  insights: string;
  onInsightsChange?: (newInsights: string) => void;
  isEditable?: boolean;
  className?: string;
}

export function InsightsEditor({ 
  insights, 
  onInsightsChange, 
  isEditable = true,
  className = "" 
}: InsightsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInsights, setEditedInsights] = useState(insights);

  const handleSave = () => {
    onInsightsChange?.(editedInsights);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInsights(insights);
    setIsEditing(false);
  };

  if (!insights || insights.trim() === "") {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-muted-foreground border border-dashed border-border rounded-lg ${className}`}>
        <Sparkles className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No design insights extracted yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="font-semibold text-sm">Extracted Design Insights</h3>
          <span className="text-xs text-purple-500 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            AI Optimized
          </span>
        </div>
        
        {isEditable && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
        )}
        
        {isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-500/10"
            >
              <Check className="h-3 w-3" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <Textarea
          value={editedInsights}
          onChange={(e) => setEditedInsights(e.target.value)}
          className="min-h-[120px] font-mono text-sm bg-purple-500/5 border-purple-500/20 focus:border-purple-500/40"
          placeholder="Edit the design insights..."
        />
      ) : (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {insights}
          </p>
        </div>
      )}
    </div>
  );
}
